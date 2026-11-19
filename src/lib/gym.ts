import "server-only";
import { query } from "./db";
import { CASES, CASE_BY_ID, caseTests } from "@/content/gym";
import { functionsIn, type GymCase } from "@/content/gym/types";
import type { CodeSubmission } from "./check";
import type { CodeTest } from "./types";
import {
  DIAGNOSIS, gymLevel, gymLimit, gymNextLevel, judgeDiagnosis, planGym, type Diagnosis, type GymOutcome, type GymPick, type KindRow,
} from "./gym-plan";
import { KIND_BY_ID } from "@/content/gym/types";
import { renderBrief } from "./parton/render";

// The Debugging gym's attempts, the fresh cases Parton writes, and Parton's hints, in their own tables, created on
// first use. An attempt is timed by the server from Start to the fix that passes every hidden test (or to Give up).
// The learner must name the cause before a fix is accepted; every wrong guess is kept.
let ready: Promise<void> | null = null;
function ensureTables() {
  ready ??= (async () => {
    await query(`CREATE TABLE IF NOT EXISTS gym_attempts (
      id SERIAL PRIMARY KEY,
      case_id TEXT NOT NULL,
      variant_id INTEGER,
      level INTEGER NOT NULL DEFAULT 1,
      limit_minutes INTEGER NOT NULL,
      total_tests INTEGER NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      outcome TEXT,
      diagnosed_at TIMESTAMPTZ,
      guesses JSONB NOT NULL DEFAULT '[]',
      wrong_guesses INTEGER NOT NULL DEFAULT 0,
      submissions INTEGER NOT NULL DEFAULT 0,
      best_passed INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      last_results JSONB
    )`);
    await query("CREATE INDEX IF NOT EXISTS gym_attempts_case ON gym_attempts (case_id, started_at)");
    await query(`CREATE TABLE IF NOT EXISTS gym_variants (
      id SERIAL PRIMARY KEY,
      case_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      symptom TEXT NOT NULL,
      program TEXT NOT NULL,
      fixed TEXT NOT NULL,
      suspect TEXT NOT NULL,
      explanation TEXT NOT NULL,
      prelude TEXT NOT NULL DEFAULT '',
      tests JSONB NOT NULL,
      minutes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      problem TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await query(`CREATE TABLE IF NOT EXISTS gym_hints (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER NOT NULL,
      rung INTEGER NOT NULL,
      body TEXT NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  })().catch((error) => { ready = null; throw error; });
  return ready;
}

export async function gymQuery<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureTables();
  return query<T>(text, params);
}

export type GymAttempt = {
  id: number;
  caseId: string;
  variantId: number | null;
  level: number;
  limitMinutes: number;
  totalTests: number;
  startedAt: string;
  finishedAt: string | null;
  outcome: GymOutcome | null;
  diagnosed: boolean;
  wrongGuesses: number;
  submissions: number;
  bestPassed: number;
  seconds: number | null;
  failedTests: string[];
};

type Row = {
  id: number; case_id: string; variant_id: number | null; level: number; limit_minutes: number; total_tests: number;
  started_at: Date | string; finished_at: Date | string | null; outcome: string | null; diagnosed_at: Date | string | null;
  wrong_guesses: number; submissions: number; best_passed: number; last_results: unknown;
};

const COLUMNS = "id, case_id, variant_id, level, limit_minutes, total_tests, started_at, finished_at, outcome, diagnosed_at, wrong_guesses, submissions, best_passed, last_results";
const iso = (v: Date | string) => new Date(v).toISOString();
const json = <T>(v: unknown, fallback: T): T => {
  if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return fallback; } }
  return (v as T) ?? fallback;
};
type Result = { name: string; passed: boolean; message?: string };

function toAttempt(r: Row): GymAttempt {
  const finished = r.finished_at ? iso(r.finished_at) : null;
  return {
    id: Number(r.id),
    caseId: r.case_id,
    variantId: r.variant_id === null || r.variant_id === undefined ? null : Number(r.variant_id),
    level: Number(r.level ?? 1) || 1,
    limitMinutes: Number(r.limit_minutes),
    totalTests: Number(r.total_tests),
    startedAt: iso(r.started_at),
    finishedAt: finished,
    outcome: (r.outcome as GymOutcome | null) ?? null,
    diagnosed: r.diagnosed_at !== null && r.diagnosed_at !== undefined,
    wrongGuesses: Number(r.wrong_guesses ?? 0),
    submissions: Number(r.submissions ?? 0),
    bestPassed: Number(r.best_passed ?? 0),
    seconds: finished ? Math.max(0, Math.round((Date.parse(finished) - Date.parse(iso(r.started_at))) / 1000)) : null,
    failedTests: json<Result[]>(r.last_results, []).filter((x) => x && !x.passed).map((x) => x.name),
  };
}

export async function getAttempt(id: number): Promise<GymAttempt | null> {
  const rows = await gymQuery<Row>(`SELECT ${COLUMNS} FROM gym_attempts WHERE id = $1`, [id]);
  return rows[0] ? toAttempt(rows[0]) : null;
}

export async function openAttempt(caseId: string): Promise<GymAttempt | null> {
  const rows = await gymQuery<Row>(`SELECT ${COLUMNS} FROM gym_attempts WHERE case_id = $1 AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1`, [caseId]);
  return rows[0] ? toAttempt(rows[0]) : null;
}

export async function allAttempts(limit = 2000): Promise<GymAttempt[]> {
  const rows = await gymQuery<Row>(`SELECT ${COLUMNS} FROM gym_attempts ORDER BY started_at DESC LIMIT $1`, [limit]);
  return rows.map(toAttempt);
}

// ---------------------------------------------------------------------------------------------
// Fresh cases Parton writes

export type GymVariant = {
  id: number;
  caseId: string;
  title: string;
  summary: string;
  /** What the learner is told, in light Markdown. */
  symptom: string;
  program: string;
  fixed: string;
  suspect: string;
  explanation: string;
  prelude: string;
  tests: CodeTest[];
  minutes: number;
  status: "pending" | "ready" | "rejected";
  problem: string | null;
  createdAt: string;
};

type VariantRow = {
  id: number; case_id: string; title: string; summary: string; symptom: string; program: string; fixed: string; suspect: string;
  explanation: string; prelude: string; tests: unknown; minutes: number; status: string; problem: string | null; created_at: Date | string;
};

function toVariant(r: VariantRow): GymVariant {
  return {
    id: Number(r.id), caseId: r.case_id, title: r.title, summary: r.summary, symptom: r.symptom, program: r.program, fixed: r.fixed,
    suspect: r.suspect, explanation: r.explanation, prelude: r.prelude, tests: json<CodeTest[]>(r.tests, []), minutes: Number(r.minutes),
    status: r.status as GymVariant["status"], problem: r.problem, createdAt: iso(r.created_at),
  };
}

export async function getVariant(id: number): Promise<GymVariant | null> {
  const rows = await gymQuery<VariantRow>("SELECT * FROM gym_variants WHERE id = $1", [id]);
  return rows[0] ? toVariant(rows[0]) : null;
}

export async function variantsFor(caseId: string): Promise<GymVariant[]> {
  const rows = await gymQuery<VariantRow>("SELECT * FROM gym_variants WHERE case_id = $1 ORDER BY created_at DESC", [caseId]);
  return rows.map(toVariant);
}

async function unusedVariant(caseId: string): Promise<GymVariant | null> {
  const rows = await gymQuery<VariantRow>(
    `SELECT * FROM gym_variants v WHERE v.case_id = $1 AND v.status = 'ready'
       AND NOT EXISTS (SELECT 1 FROM gym_attempts a WHERE a.variant_id = v.id)
     ORDER BY v.created_at LIMIT 1`,
    [caseId],
  );
  return rows[0] ? toVariant(rows[0]) : null;
}

export async function saveVariant(v: Omit<GymVariant, "id" | "status" | "problem" | "createdAt">): Promise<GymVariant> {
  const rows = await gymQuery<VariantRow>(
    `INSERT INTO gym_variants (case_id, title, summary, symptom, program, fixed, suspect, explanation, prelude, tests, minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11) RETURNING *`,
    [v.caseId, v.title, v.summary, v.symptom, v.program, v.fixed, v.suspect, v.explanation, v.prelude, JSON.stringify(v.tests), v.minutes],
  );
  return toVariant(rows[0]);
}

export async function settleVariant(id: number, ok: boolean, problem: string | null): Promise<GymVariant | null> {
  const rows = await gymQuery<VariantRow>(
    "UPDATE gym_variants SET status = $2, problem = $3 WHERE id = $1 AND status = 'pending' RETURNING *",
    [id, ok ? "ready" : "rejected", problem],
  );
  return rows[0] ? toVariant(rows[0]) : null;
}

// ---------------------------------------------------------------------------------------------
// Sessions

/** What the case page needs to run an attempt. Never the fix, the right cause or the explanation. */
export type GymSessionMeta = {
  title: string;
  /** A fresh case's symptom as HTML, or null to show the case's own. */
  symptomHtml: string | null;
  program: string;
  testCount: number;
  limitMinutes: number;
  level: number;
  levelName: string;
  variantId: number | null;
  /** Level 1: the four candidate causes. Otherwise null, and the learner names a kind and a function. */
  causes: string[] | null;
  functions: string[];
};

export function sessionMeta(c: GymCase, level: number, variant: GymVariant | null): GymSessionMeta {
  const info = gymLevel(level);
  if (variant) {
    return {
      title: variant.title, symptomHtml: renderBrief(variant.symptom), program: variant.program, testCount: variant.tests.length,
      limitMinutes: variant.minutes, level, levelName: info.name, variantId: variant.id, causes: null, functions: functionsIn(variant.program),
    };
  }
  return {
    title: c.title, symptomHtml: null, program: c.program, testCount: c.tests.length, limitMinutes: gymLimit(c.minutes, level), level,
    levelName: info.name, variantId: null, causes: level === 1 ? c.causes.map((x) => x.text) : null, functions: functionsIn(c.program),
  };
}

export async function sessionFor(a: GymAttempt): Promise<GymSessionMeta> {
  const c = CASE_BY_ID.get(a.caseId)!;
  const variant = a.variantId ? await getVariant(a.variantId) : null;
  return { ...sessionMeta(c, a.level, variant), limitMinutes: a.limitMinutes, testCount: a.totalTests };
}

export async function levelOf(caseId: string): Promise<number> {
  return gymNextLevel((await allAttempts()).filter((a) => a.caseId === caseId));
}

export type GymStartResult =
  | { ok: true; attempt: GymAttempt; session: GymSessionMeta }
  | { ok: false; needsVariant: true; level: number }
  | { ok: false; needsVariant?: false; error: string };

/**
 * Starts an attempt at the case's current level. Level 3 uses a ready fresh case nobody has attempted, and asks for a
 * new one when there is none; `fallback` starts the case itself at level 2 when none can be made.
 */
export async function startAttempt(caseId: string, opts: { variantId?: number; fallback?: boolean } = {}): Promise<GymStartResult> {
  const c = CASE_BY_ID.get(caseId);
  if (!c) return { ok: false, error: `Unknown case ${caseId}` };
  const blocked = await caseBlocked(caseId);
  if (blocked) return { ok: false, error: blocked };
  let level = await levelOf(caseId);
  let variant: GymVariant | null = null;
  if (opts.variantId) {
    variant = await getVariant(opts.variantId);
    if (!variant || variant.caseId !== caseId || variant.status !== "ready") return { ok: false, error: "That fresh case is not ready." };
    const used = await gymQuery<{ n: number }>("SELECT count(*)::int AS n FROM gym_attempts WHERE variant_id = $1", [variant.id]);
    if ((used[0]?.n ?? 0) > 0) return { ok: false, error: "That fresh case has already been attempted. Ask for a new one." };
    level = Math.max(level, 3);
  } else if (level >= 3) {
    if (opts.fallback) level = 2;
    else {
      variant = await unusedVariant(caseId);
      if (!variant) return { ok: false, needsVariant: true, level };
    }
  }
  const meta = sessionMeta(c, level, variant);
  await gymQuery("UPDATE gym_attempts SET finished_at = now(), outcome = 'abandoned' WHERE case_id = $1 AND finished_at IS NULL", [caseId]);
  const rows = await gymQuery<Row>(
    `INSERT INTO gym_attempts (case_id, variant_id, level, limit_minutes, total_tests) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
    [caseId, variant?.id ?? null, level, meta.limitMinutes, meta.testCount],
  );
  return { ok: true, attempt: toAttempt(rows[0]), session: meta };
}

export type DiagnoseResult = { ok: false; error: string } | { ok: true; right: boolean; note: string; attempt: GymAttempt };

/** Records a guess at the cause. A right one unlocks the fix; a wrong one is counted, and the learner may guess again. */
export async function diagnose(attemptId: number, d: Diagnosis): Promise<DiagnoseResult> {
  const a = await getAttempt(attemptId);
  if (!a) return { ok: false, error: "That attempt no longer exists." };
  if (a.finishedAt) return { ok: false, error: "This attempt has ended." };
  if (a.diagnosed) return { ok: true, right: true, note: "You have already named the cause. Now fix it.", attempt: a };
  const c = CASE_BY_ID.get(a.caseId)!;
  const variant = a.variantId ? await getVariant(a.variantId) : null;
  const truth = variant
    ? { rightCause: null, kind: c.kind, suspect: variant.suspect }
    : { rightCause: a.level === 1 ? c.causes.findIndex((x) => x.right) : null, kind: c.kind, suspect: c.suspect };
  if ("cause" in d && a.level !== 1) return { ok: false, error: "Name the kind of bug and the function it lives in." };
  if (!("cause" in d) && a.level === 1) return { ok: false, error: "Pick one of the four candidate causes." };
  const verdict = judgeDiagnosis(d, truth);
  const rows = await gymQuery<Row>(
    `UPDATE gym_attempts
        SET guesses = guesses || $2::jsonb,
            wrong_guesses = wrong_guesses + CASE WHEN $3::boolean THEN 0 ELSE 1 END,
            diagnosed_at = CASE WHEN $3::boolean THEN now() ELSE diagnosed_at END
      WHERE id = $1 AND finished_at IS NULL RETURNING ${COLUMNS}`,
    [attemptId, JSON.stringify([{ ...d, right: verdict.right, at: new Date().toISOString() }]), verdict.right],
  );
  if (!rows[0]) return { ok: false, error: "This attempt has ended." };
  return { ok: true, right: verdict.right, note: verdict.note, attempt: toAttempt(rows[0]) };
}

/** The hidden tests of an attempt under way, sent only once the cause has been named. */
export async function testsForOpen(caseId: string): Promise<CodeTest[] | null> {
  const open = await openAttempt(caseId);
  if (!open || !open.diagnosed) return null;
  if (open.variantId) {
    const v = await getVariant(open.variantId);
    if (!v) return null;
    return caseTests(v);
  }
  return caseTests(CASE_BY_ID.get(caseId)!);
}

export type GymSubmitResult = { ok: false; error: string } | { ok: true; passed: number; total: number; attempt: GymAttempt };

/** Records one fix. The hidden tests ran in the learner's browser; the attempt is solved when every one passed. */
export async function submitFix(id: number, sub: CodeSubmission): Promise<GymSubmitResult> {
  const a = await getAttempt(id);
  if (!a) return { ok: false, error: "That attempt no longer exists. Start the case again." };
  if (a.finishedAt) return { ok: false, error: "This attempt has already ended. Start a new one to try again." };
  if (!a.diagnosed) return { ok: false, error: "Name the cause first. The fix is checked once you have." };
  if (!sub.source.trim()) return { ok: false, error: "The script is empty." };
  const c = CASE_BY_ID.get(a.caseId);
  if (!c) return { ok: false, error: "This case no longer exists." };
  const variant = a.variantId ? await getVariant(a.variantId) : null;
  if (a.variantId && !variant) return { ok: false, error: "This fresh case no longer exists." };
  const tests = variant ? variant.tests : c.tests;
  const passedNames = new Set(sub.results.filter((r) => r.passed).map((r) => r.name));
  const passed = tests.filter((t) => passedNames.has(t.name)).length;
  const last = tests.map((t) => {
    const r = sub.results.find((x) => x.name === t.name);
    return { name: t.name, passed: r?.passed === true, message: r?.message?.slice(0, 500) ?? (r ? undefined : "did not run") };
  });
  const done = passed === tests.length;
  const rows = await gymQuery<Row>(
    `UPDATE gym_attempts
        SET submissions = submissions + 1, best_passed = GREATEST(best_passed, $2), source = $3, last_results = $5::jsonb,
            finished_at = CASE WHEN $4::boolean THEN now() ELSE finished_at END,
            outcome = CASE WHEN $4::boolean THEN 'solved' ELSE outcome END
      WHERE id = $1 AND finished_at IS NULL RETURNING ${COLUMNS}`,
    [id, passed, sub.source.slice(0, 50_000), done, JSON.stringify(last)],
  );
  if (!rows[0]) return { ok: false, error: "This attempt has already ended. Start a new one to try again." };
  return { ok: true, passed, total: tests.length, attempt: toAttempt(rows[0]) };
}

export async function giveUp(id: number): Promise<GymAttempt | null> {
  const rows = await gymQuery<Row>(
    `UPDATE gym_attempts SET finished_at = now(), outcome = 'gave_up' WHERE id = $1 AND finished_at IS NULL RETURNING ${COLUMNS}`,
    [id],
  );
  return rows[0] ? toAttempt(rows[0]) : null;
}

/** The last fix submitted in an attempt and its hidden tests' results, for Parton. */
export async function lastSubmission(attemptId: number): Promise<{ source: string; results: Result[] } | null> {
  const rows = await gymQuery<{ source: string | null; last_results: unknown }>("SELECT source, last_results FROM gym_attempts WHERE id = $1", [attemptId]);
  if (!rows[0]?.source) return null;
  return { source: rows[0].source, results: json<Result[]>(rows[0].last_results, []) };
}

/** The guesses made in an attempt, oldest first, for Parton. */
export async function guessesOf(attemptId: number): Promise<{ cause?: number; kind?: string; fn?: string; right: boolean }[]> {
  const rows = await gymQuery<{ guesses: unknown }>("SELECT guesses FROM gym_attempts WHERE id = $1", [attemptId]);
  return json(rows[0]?.guesses, []);
}

/**
 * What the learner may see once an attempt at this case (or this fresh case) has ended: the cause, why the curve
 * looked as it did, and the fix. Never before, so it never spoils a first try.
 */
export async function canSeeAnswer(caseId: string, variantId: number | null): Promise<boolean> {
  const rows = variantId
    ? await gymQuery<{ n: number }>("SELECT count(*)::int AS n FROM gym_attempts WHERE variant_id = $1 AND finished_at IS NOT NULL", [variantId])
    : await gymQuery<{ n: number }>("SELECT count(*)::int AS n FROM gym_attempts WHERE case_id = $1 AND variant_id IS NULL AND finished_at IS NOT NULL", [caseId]);
  return (rows[0]?.n ?? 0) > 0;
}

// ---------------------------------------------------------------------------------------------
// Stats and the plan

export type CaseStats = {
  caseId: string;
  finished: number;
  solves: number;
  /** Solves with the cause named first time. */
  firstGuess: number;
  bestSeconds: number | null;
  open: boolean;
  lastOutcome: GymOutcome | null;
};

export function summarise(caseId: string, attempts: readonly GymAttempt[]): CaseStats {
  const mine = attempts.filter((a) => a.caseId === caseId);
  const done = mine.filter((a) => a.finishedAt).sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!));
  const solves = done.filter((a) => a.outcome === "solved");
  return {
    caseId,
    finished: done.length,
    solves: solves.length,
    firstGuess: solves.filter((a) => a.wrongGuesses === 0).length,
    bestSeconds: solves.length ? Math.min(...solves.map((a) => a.seconds!)) : null,
    open: mine.some((a) => !a.finishedAt),
    lastOutcome: done[0]?.outcome ?? null,
  };
}

export const kindName = (kind: string) => KIND_BY_ID.get(kind as never)?.name ?? kind;

export async function gymPlan(): Promise<{ next: GymPick | null; queue: GymPick[]; kinds: KindRow[]; attempts: GymAttempt[] }> {
  const attempts = await allAttempts();
  const plan = planGym(CASES, attempts, Date.now(), await blocks(attempts), kindName);
  return { ...plan, attempts };
}

async function blocks(attempts: readonly GymAttempt[]): Promise<Map<string, string>> {
  const { gymBlocks, gymGuide } = await import("./guide/store");
  return gymBlocks(await gymGuide(attempts));
}

/** Why this case can't be started now, or null if it can. */
export async function caseBlocked(caseId: string): Promise<string | null> {
  return (await blocks(await allAttempts())).get(caseId) ?? null;
}

export { DIAGNOSIS };
