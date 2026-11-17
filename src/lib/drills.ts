import "server-only";
import { query } from "./db";
import { DRILLS, DRILL_BY_ID } from "@/content/drills";
import type { CodeSubmission } from "./check";

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
};

type Row = {
  id: number; drill_id: string; limit_minutes: number; total_tests: number; started_at: Date | string;
  finished_at: Date | string | null; outcome: string | null; submissions: number; best_passed: number;
};

const COLUMNS = "id, drill_id, limit_minutes, total_tests, started_at, finished_at, outcome, submissions, best_passed";
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

export async function startAttempt(drillId: string): Promise<Attempt> {
  const drill = DRILL_BY_ID.get(drillId);
  if (!drill) throw new Error(`Unknown drill ${drillId}`);
  await ensureTable();
  await query(
    "UPDATE drill_attempts SET finished_at = now(), outcome = 'abandoned' WHERE drill_id = $1 AND finished_at IS NULL",
    [drillId],
  );
  const rows = await query<Row>(
    `INSERT INTO drill_attempts (drill_id, limit_minutes, total_tests) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
    [drillId, drill.minutes, drill.tests.length],
  );
  return toAttempt(rows[0]);
}

async function getAttempt(id: number): Promise<Attempt | null> {
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
  const reported = new Set(sub.results.filter((r) => r.passed).map((r) => r.name));
  const passed = drill.tests.filter((t) => reported.has(t.name)).length;
  const total = drill.tests.length;
  const done = passed === total;
  const rows = await query<Row>(
    `UPDATE drill_attempts
        SET submissions = submissions + 1, best_passed = GREATEST(best_passed, $2), source = $3,
            finished_at = CASE WHEN $4::boolean THEN now() ELSE finished_at END,
            outcome = CASE WHEN $4::boolean THEN 'passed' ELSE outcome END
      WHERE id = $1 AND finished_at IS NULL
      RETURNING ${COLUMNS}`,
    [id, passed, sub.source.slice(0, 50_000), done],
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
    "SELECT count(*)::int AS n FROM drill_attempts WHERE drill_id = $1 AND finished_at IS NOT NULL",
    [drillId],
  );
  return (rows[0]?.n ?? 0) > 0;
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
