import "server-only";
import { query } from "./db";
import { DRILLS, DRILL_BY_ID } from "@/content/drills";
import type { CodeSubmission } from "./check";
import type { CodeTest } from "./types";
import { BARE_STARTER, levelInfo, limitFor, nextLevel, planDrills, type Pick, type ReadinessSkill, type SkillRow } from "./drill-plan";
import { renderBrief } from "./parton/render";

// Drill attempts live in their own table, created on first use. Each attempt is timed by the server from Start
// to the submission that passes every hidden test (or to Give up). Starting a new attempt while one is open
// closes the open one as abandoned, which counts as a miss in the pass rate.
let ready: Promise<void> | null = null;
function ensureTable() {
  ready ??= (async () => {
    await query(`CREATE TABLE IF NOT EXISTS drill_attempts (
      id SERIAL PRIMARY KEY,
      drill_id TEXT NOT NULL,
      limit_minutes INTEGER NOT NULL,
      total_tests INTEGER NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      outcome TEXT,
      submissions INTEGER NOT NULL DEFAULT 0,
      best_passed INTEGER NOT NULL DEFAULT 0,
      source TEXT
    )`);
    await query("CREATE INDEX IF NOT EXISTS drill_attempts_drill ON drill_attempts (drill_id, started_at)");
    // The adaptive plan: the level an attempt was set at, the Parton-written variant it used (if any), and the
    // hidden tests' results on its last submission, so a failed drill comes back with what failed.
    await query("ALTER TABLE drill_attempts ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1");
    await query("ALTER TABLE drill_attempts ADD COLUMN IF NOT EXISTS variant_id INTEGER");
    await query("ALTER TABLE drill_attempts ADD COLUMN IF NOT EXISTS last_results JSONB");
    // Variants Parton writes of a drill. One is 'pending' until the learner's browser has run its reference
    // solution, starter and plausible wrong answers against its tests; then it is 'ready' or 'rejected'.
    await query(`CREATE TABLE IF NOT EXISTS drill_variants (
      id SERIAL PRIMARY KEY,
      drill_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      twist TEXT NOT NULL,
      brief TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      starter TEXT NOT NULL,
      solution TEXT NOT NULL,
      prelude TEXT NOT NULL DEFAULT '',
      setup TEXT NOT NULL DEFAULT '',
      tests JSONB NOT NULL,
      mutants JSONB NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      problem TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    // Parton's hints on why hidden tests failed, one ladder per attempt.
    await query(`CREATE TABLE IF NOT EXISTS drill_hints (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER NOT NULL,
      rung INTEGER NOT NULL,
      body TEXT NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  })().catch((error) => { ready = null; throw error; });
  return ready;
}

export type Outcome = "passed" | "gave_up" | "abandoned";

export type Attempt = {
  id: number;
  drillId: string;
  limitMinutes: number;
  totalTests: number;
  startedAt: string;
  finishedAt: string | null;
  outcome: Outcome | null;
  submissions: number;
  bestPassed: number;
  /** Seconds from start to finish, or null while open. */
  seconds: number | null;
  /** The level the attempt was set at, 1 to 4. */
  level: number;
  /** The Parton-written variant it used, or null for the drill itself. */
  variantId: number | null;
  /** Hidden tests that failed on the last submission. */
  failedTests: string[];
};

type Row = {
  id: number; drill_id: string; limit_minutes: number; total_tests: number; started_at: Date | string;
  finished_at: Date | string | null; outcome: string | null; submissions: number; best_passed: number;
  level: number | null; variant_id: number | null; last_results: unknown;
};

const COLUMNS = "id, drill_id, limit_minutes, total_tests, started_at, finished_at, outcome, submissions, best_passed, level, variant_id, last_results";

type Result = { name: string; passed: boolean; message?: string };
function results(v: unknown): Result[] {
  const parsed = typeof v === "string" ? (() => { try { return JSON.parse(v) as unknown; } catch { return null; } })() : v;
  return Array.isArray(parsed) ? (parsed as Result[]).filter((r) => r && typeof r.name === "string") : [];
}
const iso = (v: Date | string) => new Date(v).toISOString();

function toAttempt(r: Row): Attempt {
  const finished = r.finished_at ? iso(r.finished_at) : null;
  return {
    id: Number(r.id),
    drillId: r.drill_id,
    limitMinutes: Number(r.limit_minutes),
    totalTests: Number(r.total_tests),
    startedAt: iso(r.started_at),
    finishedAt: finished,
    outcome: (r.outcome as Outcome | null) ?? null,
    submissions: Number(r.submissions),
    bestPassed: Number(r.best_passed),
    seconds: finished ? Math.max(0, Math.round((Date.parse(finished) - Date.parse(iso(r.started_at))) / 1000)) : null,
    level: Number(r.level ?? 1) || 1,
    variantId: r.variant_id === null || r.variant_id === undefined ? null : Number(r.variant_id),
    failedTests: results(r.last_results).filter((x) => !x.passed).map((x) => x.name),
  };
}

/** Whether a finished attempt passed within the time it was set. */
export const inTime = (a: Attempt) => a.outcome === "passed" && a.seconds !== null && a.seconds <= a.limitMinutes * 60;

export async function openAttempt(drillId: string): Promise<Attempt | null> {
  await ensureTable();
  const rows = await query<Row>(
    `SELECT ${COLUMNS} FROM drill_attempts WHERE drill_id = $1 AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1`,
    [drillId],
  );
  return rows[0] ? toAttempt(rows[0]) : null;
}

// ---------------------------------------------------------------------------------------------
// Variants

export type DrillVariant = {
  id: number;
  drillId: string;
  title: string;
  summary: string;
  /** One sentence on what is new compared with the original drill. */
  twist: string;
  /** The task in light Markdown: paragraphs, lists, `code`, fenced code blocks and TeX in dollar signs. */
  brief: string;
  minutes: number;
  starter: string;
  solution: string;
  prelude: string;
  setup: string;
  tests: CodeTest[];
  /** Plausible wrong answers, as text in the solution and what a learner might write instead. */
  mutants: { from: string; to: string; why: string }[];
  status: "pending" | "ready" | "rejected";
  problem: string | null;
  createdAt: string;
};

type VariantRow = {
  id: number; drill_id: string; title: string; summary: string; twist: string; brief: string; minutes: number;
  starter: string; solution: string; prelude: string; setup: string; tests: unknown; mutants: unknown; status: string;
  problem: string | null; created_at: Date | string;
};

const json = <T>(v: unknown, fallback: T): T => {
  if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return fallback; } }
  return (v as T) ?? fallback;
};

function toVariant(r: VariantRow): DrillVariant {
  return {
    id: Number(r.id), drillId: r.drill_id, title: r.title, summary: r.summary, twist: r.twist, brief: r.brief,
    minutes: Number(r.minutes), starter: r.starter, solution: r.solution, prelude: r.prelude, setup: r.setup,
    tests: json<CodeTest[]>(r.tests, []), mutants: json<DrillVariant["mutants"]>(r.mutants, []),
    status: r.status as DrillVariant["status"], problem: r.problem, createdAt: iso(r.created_at),
  };
}

export async function getVariant(id: number): Promise<DrillVariant | null> {
  await ensureTable();
  const rows = await query<VariantRow>("SELECT * FROM drill_variants WHERE id = $1", [id]);
  return rows[0] ? toVariant(rows[0]) : null;
}

export async function variantsFor(drillId: string): Promise<DrillVariant[]> {
  await ensureTable();
  const rows = await query<VariantRow>("SELECT * FROM drill_variants WHERE drill_id = $1 ORDER BY created_at DESC", [drillId]);
  return rows.map(toVariant);
}

/** A ready variant of the drill that no attempt has used yet, oldest first. */
async function unusedVariant(drillId: string): Promise<DrillVariant | null> {
  const rows = await query<VariantRow>(
    `SELECT * FROM drill_variants v WHERE v.drill_id = $1 AND v.status = 'ready'
       AND NOT EXISTS (SELECT 1 FROM drill_attempts a WHERE a.variant_id = v.id)
     ORDER BY v.created_at LIMIT 1`,
    [drillId],
  );
  return rows[0] ? toVariant(rows[0]) : null;
}

export async function saveVariant(v: Omit<DrillVariant, "id" | "status" | "problem" | "createdAt">): Promise<DrillVariant> {
  await ensureTable();
  const rows = await query<VariantRow>(
    `INSERT INTO drill_variants (drill_id, title, summary, twist, brief, minutes, starter, solution, prelude, setup, tests, mutants)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb) RETURNING *`,
    [v.drillId, v.title, v.summary, v.twist, v.brief, v.minutes, v.starter, v.solution, v.prelude, v.setup, JSON.stringify(v.tests), JSON.stringify(v.mutants)],
  );
  return toVariant(rows[0]);
}

/** Marks a pending variant ready or rejected after the browser has checked it. */
export async function settleVariant(id: number, ok: boolean, problem: string | null): Promise<DrillVariant | null> {
  await ensureTable();
  const rows = await query<VariantRow>(
    "UPDATE drill_variants SET status = $2, problem = $3 WHERE id = $1 AND status = 'pending' RETURNING *",
    [id, ok ? "ready" : "rejected", problem],
  );
  return rows[0] ? toVariant(rows[0]) : null;
}

// ---------------------------------------------------------------------------------------------
// Sessions

/** What the drill page needs to run an attempt: the task as set at its level, or the variant it uses. */
export type SessionMeta = {
  title: string;
  /** The variant's brief as HTML, or null to show the drill's own brief. */
  briefHtml: string | null;
  starter: string;
  setup?: string;
  testCount: number;
  limitMinutes: number;
  level: number;
  levelName: string;
  variantId: number | null;
  twist: string | null;
};

export function sessionMeta(drillId: string, level: number, variant: DrillVariant | null): SessionMeta {
  const drill = DRILL_BY_ID.get(drillId)!;
  const info = levelInfo(level);
  if (variant) {
    return {
      title: variant.title, briefHtml: renderBrief(variant.brief), starter: variant.starter, setup: variant.setup || undefined,
      testCount: variant.tests.length, limitMinutes: variant.minutes, level, levelName: info.name, variantId: variant.id, twist: variant.twist,
    };
  }
  return {
    title: drill.title, briefHtml: null, starter: info.editor === "bare" ? BARE_STARTER : drill.starter, setup: drill.setup,
    testCount: drill.tests.length, limitMinutes: limitFor(drill.minutes, level), level, levelName: info.name, variantId: null, twist: null,
  };
}

/** The session for an attempt already under way. */
export async function sessionFor(attempt: Attempt): Promise<SessionMeta> {
  const variant = attempt.variantId ? await getVariant(attempt.variantId) : null;
  const meta = sessionMeta(attempt.drillId, attempt.level, variant);
  return { ...meta, limitMinutes: attempt.limitMinutes, testCount: attempt.totalTests };
}

/** The level the drill's next attempt will be set at. */
export async function levelOf(drillId: string): Promise<number> {
  return nextLevel(await attemptsFor(drillId, 200));
}

export type StartResult =
  | { ok: true; attempt: Attempt; session: SessionMeta }
  | { ok: false; needsVariant: true; level: number }
  | { ok: false; needsVariant?: false; error: string };

/**
 * Starts an attempt at the drill's current level. At the variant level it uses a ready variant nobody has
 * attempted, and asks for a new one when there is none. `variantId` starts a particular unused variant at any
 * level; `fallback` starts the drill itself (at the bare level) when no variant can be made.
 */
export async function startAttempt(drillId: string, opts: { variantId?: number; fallback?: boolean } = {}): Promise<StartResult> {
  const drill = DRILL_BY_ID.get(drillId);
  if (!drill) return { ok: false, error: `Unknown drill ${drillId}` };
  await ensureTable();
  const blocked = await drillBlocked(drillId);
  if (blocked) return { ok: false, error: blocked };
  let level = await levelOf(drillId);
  let variant: DrillVariant | null = null;
  if (opts.variantId) {
    variant = await getVariant(opts.variantId);
    if (!variant || variant.drillId !== drillId || variant.status !== "ready") return { ok: false, error: "That variant is not ready." };
    const used = await query<{ n: number }>("SELECT count(*)::int AS n FROM drill_attempts WHERE variant_id = $1", [variant.id]);
    if ((used[0]?.n ?? 0) > 0) return { ok: false, error: "That variant has already been attempted. Ask for a new one." };
  } else if (levelInfo(level).editor === "variant") {
    if (opts.fallback) level = 3;
    else {
      variant = await unusedVariant(drillId);
      if (!variant) return { ok: false, needsVariant: true, level };
    }
  }
  const meta = sessionMeta(drillId, level, variant);
  await query(
    "UPDATE drill_attempts SET finished_at = now(), outcome = 'abandoned' WHERE drill_id = $1 AND finished_at IS NULL",
    [drillId],
  );
  const rows = await query<Row>(
    `INSERT INTO drill_attempts (drill_id, limit_minutes, total_tests, level, variant_id) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
    [drillId, meta.limitMinutes, meta.testCount, level, variant?.id ?? null],
  );
  return { ok: true, attempt: toAttempt(rows[0]), session: meta };
}

/** The hidden tests of an attempt under way, each prefixed by its shared reference code. */
export async function testsForOpen(drillId: string): Promise<CodeTest[] | null> {
  const open = await openAttempt(drillId);
  if (!open) return null;
  if (open.variantId) {
    const v = await getVariant(open.variantId);
    if (!v) return null;
    const prelude = v.prelude ? `${v.prelude}\n` : "";
    return v.tests.map((t) => ({ name: t.name, code: prelude + t.code }));
  }
  const { drillTests } = await import("@/content/drills/tests");
  return drillTests(DRILL_BY_ID.get(drillId)!);
}

export async function getAttempt(id: number): Promise<Attempt | null> {
  await ensureTable();
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM drill_attempts WHERE id = $1`, [id]);
  return rows[0] ? toAttempt(rows[0]) : null;
}

export type SubmitResult =
  | { ok: false; error: string }
  | { ok: true; passed: number; total: number; attempt: Attempt };

/**
 * Records one submission. The hidden tests ran in the learner's browser (Frontier never runs code on its
 * servers); the attempt passes when every one of the drill's tests reported a pass.
 */
export async function submitAttempt(id: number, sub: CodeSubmission): Promise<SubmitResult> {
  const attempt = await getAttempt(id);
  if (!attempt) return { ok: false, error: "That attempt no longer exists. Start the drill again." };
  if (attempt.finishedAt) return { ok: false, error: "This attempt has already ended. Start a new one to try again." };
  const drill = DRILL_BY_ID.get(attempt.drillId);
  if (!drill) return { ok: false, error: "This drill no longer exists." };
  if (!sub.source.trim()) return { ok: false, error: "Write some code first." };
  const variant = attempt.variantId ? await getVariant(attempt.variantId) : null;
  if (attempt.variantId && !variant) return { ok: false, error: "This variant no longer exists." };
  const tests = variant ? variant.tests : drill.tests;
  const reported = new Set(sub.results.filter((r) => r.passed).map((r) => r.name));
  const passed = tests.filter((t) => reported.has(t.name)).length;
  const total = tests.length;
  const named = new Set(tests.map((t) => t.name));
  const last = tests.map((t) => sub.results.find((r) => r.name === t.name) ?? { name: t.name, passed: false, message: "did not run" })
    .filter((r) => named.has(r.name))
    .map((r) => ({ name: r.name, passed: r.passed, message: r.message?.slice(0, 500) }));
  const done = passed === total;
  const rows = await query<Row>(
    `UPDATE drill_attempts
        SET submissions = submissions + 1, best_passed = GREATEST(best_passed, $2), source = $3, last_results = $5::jsonb,
            finished_at = CASE WHEN $4::boolean THEN now() ELSE finished_at END,
            outcome = CASE WHEN $4::boolean THEN 'passed' ELSE outcome END
      WHERE id = $1 AND finished_at IS NULL
      RETURNING ${COLUMNS}`,
    [id, passed, sub.source.slice(0, 50_000), done, JSON.stringify(last)],
  );
  if (!rows[0]) return { ok: false, error: "This attempt has already ended. Start a new one to try again." };
  return { ok: true, passed, total, attempt: toAttempt(rows[0]) };
}

export async function giveUp(id: number): Promise<Attempt | null> {
  await ensureTable();
  const rows = await query<Row>(
    `UPDATE drill_attempts SET finished_at = now(), outcome = 'gave_up' WHERE id = $1 AND finished_at IS NULL RETURNING ${COLUMNS}`,
    [id],
  );
  return rows[0] ? toAttempt(rows[0]) : null;
}

/** The reference solution is shown only once an attempt at the drill has ended, so it never spoils a first try. */
export async function canSeeSolution(drillId: string): Promise<boolean> {
  await ensureTable();
  const rows = await query<{ n: number }>(
    "SELECT count(*)::int AS n FROM drill_attempts WHERE drill_id = $1 AND variant_id IS NULL AND finished_at IS NOT NULL",
    [drillId],
  );
  return (rows[0]?.n ?? 0) > 0;
}

/** A variant's reference solution, once an attempt at that variant has ended. */
export async function variantSolution(variantId: number): Promise<string | null> {
  await ensureTable();
  const rows = await query<{ n: number }>(
    "SELECT count(*)::int AS n FROM drill_attempts WHERE variant_id = $1 AND finished_at IS NOT NULL",
    [variantId],
  );
  if ((rows[0]?.n ?? 0) === 0) return null;
  return (await getVariant(variantId))?.solution ?? null;
}

/** The last program submitted in an attempt and its hidden tests' results, for Parton. */
export async function lastSubmission(attemptId: number): Promise<{ source: string; results: Result[] } | null> {
  await ensureTable();
  const rows = await query<{ source: string | null; last_results: unknown }>("SELECT source, last_results FROM drill_attempts WHERE id = $1", [attemptId]);
  if (!rows[0]?.source) return null;
  return { source: rows[0].source, results: results(rows[0].last_results) };
}


export async function attemptsFor(drillId: string | null, limit = 50): Promise<Attempt[]> {
  await ensureTable();
  const rows = drillId
    ? await query<Row>(`SELECT ${COLUMNS} FROM drill_attempts WHERE drill_id = $1 ORDER BY started_at DESC LIMIT $2`, [drillId, limit])
    : await query<Row>(`SELECT ${COLUMNS} FROM drill_attempts ORDER BY started_at DESC LIMIT $1`, [limit]);
  return rows.map(toAttempt);
}

export type DrillStats = {
  drillId: string;
  /** Attempts that ended: passed, gave up or abandoned. */
  finished: number;
  passes: number;
  passesInTime: number;
  /** Passes over finished attempts, or null before any attempt has ended. */
  passRate: number | null;
  bestSeconds: number | null;
  lastSeconds: number | null;
  lastOutcome: Outcome | null;
  open: boolean;
};

export function summarise(drillId: string, attempts: Attempt[]): DrillStats {
  const mine = attempts.filter((a) => a.drillId === drillId);
  const done = mine.filter((a) => a.finishedAt);
  const passes = done.filter((a) => a.outcome === "passed");
  const latest = done.sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!))[0];
  const lastPass = passes.sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!))[0];
  return {
    drillId,
    finished: done.length,
    passes: passes.length,
    passesInTime: passes.filter(inTime).length,
    passRate: done.length ? passes.length / done.length : null,
    bestSeconds: passes.length ? Math.min(...passes.map((a) => a.seconds!)) : null,
    lastSeconds: lastPass?.seconds ?? null,
    lastOutcome: latest?.outcome ?? null,
    open: mine.some((a) => !a.finishedAt),
  };
}

export async function allStats(): Promise<{ drills: DrillStats[]; attempts: Attempt[] }> {
  await ensureTable();
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM drill_attempts ORDER BY started_at DESC`);
  const attempts = rows.map(toAttempt);
  return { drills: DRILLS.map((d) => summarise(d.id, attempts)), attempts };
}

/**
 * Evidence for the readiness scorecard: each drill passed at least once, with its fastest pass and whether
 * that pass was within the time limit. Drills never passed are left out.
 */
export async function drillEvidence(): Promise<{
  drillId: string; title: string; skills: string[]; bestSeconds: number; limitMinutes: number; inTime: boolean;
  passes: number; passRate: number; lastPassedAt: string;
}[]> {
  const { drills, attempts } = await allStats();
  return drills.filter((s) => s.passes > 0).map((s) => {
    const drill = DRILL_BY_ID.get(s.drillId)!;
    const passes = attempts.filter((a) => a.drillId === s.drillId && a.outcome === "passed");
    const best = passes.reduce((x, y) => (y.seconds! < x.seconds! ? y : x));
    return {
      drillId: s.drillId,
      title: drill.title,
      skills: drill.skills,
      bestSeconds: best.seconds!,
      limitMinutes: best.limitMinutes,
      inTime: passes.some(inTime),
      passes: s.passes,
      passRate: s.passRate!,
      lastPassedAt: passes.map((a) => a.finishedAt!).sort().at(-1)!,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// The plan

/** Skills from the readiness scorecard, when there is one; an empty list otherwise. */
async function readinessSkills(): Promise<ReadinessSkill[]> {
  try {
    const exists = await query<{ t: string | null }>("SELECT to_regclass('readiness_skills')::text AS t");
    if (!exists[0]?.t) return [];
    const rows = await query<{ name: string; area: string; level: number; frequency: number }>(
      "SELECT name, area, level, frequency FROM readiness_skills WHERE frequency > 0",
    );
    return rows.map((r) => ({ name: r.name, area: r.area, level: Number(r.level), frequency: Number(r.frequency) }));
  } catch {
    return [];
  }
}

export async function drillPlan(): Promise<{ next: Pick | null; queue: Pick[]; skills: SkillRow[]; usesReadiness: boolean }> {
  const [{ attempts }, readiness] = await Promise.all([allStats(), readinessSkills()]);
  const plan = planDrills(DRILLS, attempts, readiness, Date.now(), await blocks(attempts));
  return { ...plan, usesReadiness: readiness.length > 0 };
}

/** Why drills can't be started now: lessons not yet mastered, or a miss that sent the learner back to a lesson. */
async function blocks(attempts: Attempt[]): Promise<Map<string, string>> {
  const { drillBlocks, drillGuide } = await import("./guide/store");
  return drillBlocks(await drillGuide(attempts));
}

/** Why this drill can't be started now, or null if it can. */
export async function drillBlocked(drillId: string): Promise<string | null> {
  const { attempts } = await allStats();
  return (await blocks(attempts)).get(drillId) ?? null;
}
