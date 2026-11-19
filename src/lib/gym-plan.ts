/**
 * The Debugging gym's adaptive plan. Pure functions, so they can be tested without a database or the API.
 *
 * - Levels. A case climbs as the learner solves it cleanly: the cause named first time, the fix passing every hidden
 *   test, inside the time. Level 1 offers four candidate causes; level 2 offers none, and the learner names the kind of
 *   bug and the function it lives in, in less time; level 3 is a fresh case Parton writes with the same kind of bug,
 *   so it never repeats. Two misses in a row step a case back down.
 * - Resurfacing. A miss comes back the next day, a solve with a wrong guess in two, and each clean solve doubles the
 *   gap.
 * - Weak kinds first. Each kind of bug (leakage, schedules, masking, dtypes, accumulation) is scored from the cases
 *   that plant it, and the next case is the one that is due and plants the weakest kind.
 */

export type GymOutcome = "solved" | "gave_up" | "abandoned";

/** One attempt as the planner reads it. */
export type GymPlanAttempt = {
  caseId: string;
  level: number;
  limitMinutes: number;
  startedAt: string;
  finishedAt: string | null;
  outcome: GymOutcome | null;
  seconds: number | null;
  /** Causes named before the right one. */
  wrongGuesses: number;
  /** Whether the right cause was named before the attempt ended. */
  diagnosed: boolean;
  /** Hidden tests that failed on the last submitted fix. */
  failedTests: string[];
};

export type GymPlanCase = { id: string; title: string; minutes: number; kind: string };

export type GymLevel = { level: number; name: string; timeFactor: number; about: string };

export const GYM_LEVELS: readonly GymLevel[] = [
  { level: 1, name: "Guided", timeFactor: 1, about: "Pick the cause from four candidates, then fix it." },
  { level: 2, name: "Unguided", timeFactor: 0.75, about: "No candidates: name the kind of bug and the function it lives in, then fix it, in three quarters of the time." },
  { level: 3, name: "Fresh case", timeFactor: 1, about: "A new script Parton writes with the same kind of bug, checked in this browser first, so it never repeats." },
] as const;

export const GYM_MAX_LEVEL = GYM_LEVELS.length;

export const gymLevel = (level: number): GymLevel => GYM_LEVELS[Math.min(GYM_MAX_LEVEL, Math.max(1, Math.round(level))) - 1];

export const gymLimit = (minutes: number, level: number) => Math.max(5, Math.round(minutes * gymLevel(level).timeFactor));

const DAY = 86_400_000;

const finished = (attempts: readonly GymPlanAttempt[]) =>
  attempts.filter((a) => a.finishedAt && a.outcome).sort((a, b) => Date.parse(a.finishedAt!) - Date.parse(b.finishedAt!));

/** Solved with the cause named first time, inside the time. */
export const cleanSolve = (a: GymPlanAttempt) =>
  a.outcome === "solved" && a.wrongGuesses === 0 && a.seconds !== null && a.seconds <= a.limitMinutes * 60;

/** Anything short of a solve, or a solve after a wrong guess: the attempt shows something to go back to. */
export const showsGap = (a: GymPlanAttempt) => a.outcome !== "solved" || a.wrongGuesses > 0;

/** The level of a case's next attempt. A clean solve climbs; any other solve stays; two misses in a row step down. */
export function gymNextLevel(attempts: readonly GymPlanAttempt[]): number {
  let level = 1;
  let misses = 0;
  for (const a of finished(attempts)) {
    const at = Math.min(GYM_MAX_LEVEL, Math.max(1, a.level || 1));
    if (cleanSolve(a)) { level = Math.min(GYM_MAX_LEVEL, at + 1); misses = 0; }
    else if (a.outcome === "solved") { level = at; misses = 0; }
    else {
      misses += 1;
      level = at;
      if (misses >= 2) { level = Math.max(1, at - 1); misses = 0; }
    }
  }
  return level;
}

/** How well a case is held, 0 to 1, or null before any attempt has ended. The newest attempts count most. */
export function caseMastery(attempts: readonly GymPlanAttempt[]): number | null {
  const done = finished(attempts).reverse().slice(0, 4);
  if (!done.length) return null;
  const weights = [1, 0.7, 0.5, 0.35];
  let sum = 0;
  let total = 0;
  done.forEach((a, i) => {
    const score = cleanSolve(a) ? Math.min(1, 0.7 + 0.1 * (a.level || 1)) : a.outcome === "solved" ? (a.wrongGuesses ? 0.3 : 0.5) : 0;
    sum += weights[i] * score;
    total += weights[i];
  });
  return sum / total;
}

/** When a case is next due, or null if it has never been finished. */
export function gymDueAt(attempts: readonly GymPlanAttempt[]): Date | null {
  const done = finished(attempts);
  const last = done.at(-1);
  if (!last) return null;
  const end = Date.parse(last.finishedAt!);
  if (last.outcome !== "solved") return new Date(end + DAY);
  if (!cleanSolve(last)) return new Date(end + 2 * DAY);
  let streak = 0;
  for (let i = done.length - 1; i >= 0 && cleanSolve(done[i]); i--) streak++;
  return new Date(end + Math.min(60, 4 * 2 ** (streak - 1)) * DAY);
}

export type KindRow = {
  kind: string;
  /** Mean mastery over the cases of this kind that can open, untried ones counting as zero. */
  mastery: number;
  tried: boolean;
  /** 0 (strong) to 1 (weakest). */
  weakness: number;
  cases: string[];
};

/** Each kind of bug, weakest first, from the cases that are open (or have been attempted). */
export function kindProfile(cases: readonly GymPlanCase[], attempts: readonly GymPlanAttempt[], locked: ReadonlySet<string> = new Set()): KindRow[] {
  const kinds = [...new Set(cases.map((c) => c.kind))];
  return kinds
    .map((kind) => {
      const ids = cases.filter((c) => c.kind === kind).map((c) => c.id);
      const counted = ids.filter((id) => !locked.has(id) || attempts.some((a) => a.caseId === id));
      const ms = counted.map((id) => caseMastery(attempts.filter((a) => a.caseId === id)));
      const mastery = ms.length ? ms.reduce<number>((s, m) => s + (m ?? 0), 0) / ms.length : 0;
      return { kind, mastery, tried: ms.some((m) => m !== null), weakness: 1 - mastery, cases: ids };
    })
    .sort((a, b) => b.weakness - a.weakness || Number(b.tried) - Number(a.tried) || a.kind.localeCompare(b.kind));
}

export type GymPickKind = "open" | "retry" | "due" | "new" | "later" | "locked";

export type GymPick = {
  caseId: string;
  kind: GymPickKind;
  score: number;
  level: number;
  limitMinutes: number;
  due: string | null;
  mastery: number | null;
  /** One plain sentence on why the case is where it is. */
  reason: string;
};

const ago = (iso: string, now: number) => {
  const d = Math.round((now - Date.parse(iso)) / DAY);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

export function planGym(
  cases: readonly GymPlanCase[],
  attempts: readonly GymPlanAttempt[],
  now = Date.now(),
  /** Cases that can't be started now, with the reason. An attempt already under way is never blocked. */
  blocked: ReadonlyMap<string, string> = new Map(),
  kindName: (kind: string) => string = (k) => k,
): { next: GymPick | null; queue: GymPick[]; kinds: KindRow[] } {
  const kinds = kindProfile(cases, attempts, new Set(blocked.keys()));
  const weak = new Map(kinds.map((k) => [k.kind, k]));
  const queue = cases.map((c): GymPick => {
    const mine = attempts.filter((a) => a.caseId === c.id);
    const last = finished(mine).at(-1);
    const level = gymNextLevel(mine);
    const due = gymDueAt(mine);
    const k = weak.get(c.kind)!;
    const base = { caseId: c.id, level, limitMinutes: gymLimit(c.minutes, level), due: due?.toISOString() ?? null, mastery: caseMastery(mine) };

    if (mine.some((a) => !a.finishedAt)) return { ...base, kind: "open", score: 1000, reason: "You have an attempt under way. Finish it first." };
    const block = blocked.get(c.id);
    if (block) return { ...base, kind: "locked", score: -1 + k.weakness / 10, reason: block };
    if (!last) {
      return {
        ...base, kind: "new", score: 50 + 30 * k.weakness,
        reason: `New. It plants a ${kindName(c.kind).toLowerCase()} bug, ${k.tried ? "one of your weaker kinds" : "a kind you have not debugged here yet"}.`,
      };
    }
    const overdue = due ? Math.max(0, (now - due.getTime()) / DAY) : 0;
    if (due && due.getTime() <= now) {
      if (last.outcome !== "solved") {
        const what = last.outcome === "gave_up" ? "You gave up on this" : "You left this unfinished";
        return { ...base, kind: "retry", score: 100 + 20 * k.weakness + Math.min(10, overdue), reason: `${what} ${ago(last.finishedAt!, now)}. It is back for another go.` };
      }
      const how = cleanSolve(last) ? "cleanly" : last.wrongGuesses ? "after a wrong guess at the cause" : "over time";
      return { ...base, kind: "due", score: 60 + 25 * k.weakness + Math.min(10, overdue), reason: `Due again: you solved it ${how} ${ago(last.finishedAt!, now)}. Check it has stuck.` };
    }
    return {
      ...base, kind: "later", score: 10 + 10 * k.weakness,
      reason: `Not due until ${due!.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}.`,
    };
  });
  queue.sort((a, b) => b.score - a.score || a.caseId.localeCompare(b.caseId));
  const next = queue[0] && queue[0].kind !== "later" && queue[0].kind !== "locked" ? queue[0] : null;
  return { next, queue, kinds };
}

// ---------------------------------------------------------------------------------------------
// Diagnosis

/** What the learner names as the cause: one of the four candidates at level 1, or a kind and a function at 2 and 3. */
export type Diagnosis = { cause: number } | { kind: string; fn: string };

/** Whether a diagnosis is right, and what was wrong with it, in words that do not give the answer away. */
export function judgeDiagnosis(
  d: Diagnosis,
  truth: { rightCause: number | null; kind: string; suspect: string },
): { right: boolean; note: string } {
  if ("cause" in d) {
    if (truth.rightCause === null) return { right: false, note: "Name the kind of bug and the function it lives in." };
    return d.cause === truth.rightCause
      ? { right: true, note: "That is the cause." }
      : { right: false, note: "Not this one. Run the script, look at what it logs, and test your idea before you guess again." };
  }
  const kindRight = d.kind === truth.kind;
  const fnRight = d.fn === truth.suspect;
  if (kindRight && fnRight) return { right: true, note: "That is the cause." };
  if (kindRight) return { right: false, note: "The kind of bug is right, but it does not live in that function." };
  if (fnRight) return { right: false, note: "The bug is in that function, but it is a different kind of bug." };
  return { right: false, note: "Neither the kind nor the function is right. Run the script, and test your idea before you guess again." };
}

/** The pseudo-test a misdiagnosis is recorded as, so the lessons behind the bug can be found like a failed test's. */
export const DIAGNOSIS = "naming the cause";
