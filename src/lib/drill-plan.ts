/**
 * The adaptive drill plan. Pure functions, so they can be tested without a database or the API.
 *
 * Three ideas:
 * - Levels. Each drill climbs a ladder as the learner passes it inside the time: the clock tightens, then the
 *   scaffold goes, then Parton writes a fresh variant every time so the drill never repeats. Two misses in a row
 *   step it back down a level.
 * - Resurfacing. A drill comes back on a spaced schedule: a miss returns the next day, a slow pass in two days,
 *   and each pass in time doubles the gap.
 * - Weak skills first. Each skill tag is scored from the drills that exercise it (and from the readiness
 *   scorecard, when there is one), and the next drill is the one that is due and covers the weakest skills.
 */

export type PlanOutcome = "passed" | "gave_up" | "abandoned";

/** One attempt as the planner reads it. */
export type PlanAttempt = {
  drillId: string;
  level: number;
  limitMinutes: number;
  startedAt: string;
  finishedAt: string | null;
  outcome: PlanOutcome | null;
  seconds: number | null;
  /** Names of the hidden tests that failed on the last submission, if any were recorded. */
  failedTests?: string[];
};

export type PlanDrill = { id: string; title: string; minutes: number; skills: string[] };

/** A skill from the readiness scorecard: level 0 (none) to 4 (published), and how often postings ask for it. */
export type ReadinessSkill = { name: string; area: string; level: number; frequency: number };

export type Level = {
  level: number;
  name: string;
  /** The time limit as a share of the drill's own minutes. */
  timeFactor: number;
  /** "scaffold" opens the editor on the drill's starter; "bare" on an empty file; "variant" on a fresh variant. */
  editor: "scaffold" | "bare" | "variant";
  about: string;
};

export const LEVELS: readonly Level[] = [
  { level: 1, name: "Standard", timeFactor: 1, editor: "scaffold", about: "The full time, with the function signatures written for you." },
  { level: 2, name: "Tight", timeFactor: 0.75, editor: "scaffold", about: "Three quarters of the time." },
  { level: 3, name: "Bare", timeFactor: 0.6, editor: "bare", about: "Under two thirds of the time, from an empty file: write every signature from the brief." },
  { level: 4, name: "Variant", timeFactor: 1, editor: "variant", about: "A new variant Parton writes for you each time, with a twist on the original, so it never repeats." },
] as const;

export const MAX_LEVEL = LEVELS.length;

export const levelInfo = (level: number): Level => LEVELS[Math.min(MAX_LEVEL, Math.max(1, Math.round(level))) - 1];

/** The time limit for a drill at a level, in whole minutes, never under five. */
export function limitFor(minutes: number, level: number): number {
  return Math.max(5, Math.round(minutes * levelInfo(level).timeFactor));
}

/** What the editor opens with at level 3: nothing but the import, so the learner writes every signature. */
export const BARE_STARTER = `import numpy as np

# Bare level: no scaffold. Write every function and class the brief names, from memory.
`;

const DAY = 86_400_000;
const finished = (attempts: PlanAttempt[]) =>
  attempts.filter((a) => a.finishedAt && a.outcome).sort((a, b) => Date.parse(a.finishedAt!) - Date.parse(b.finishedAt!));
export const inTimeAttempt = (a: PlanAttempt) => a.outcome === "passed" && a.seconds !== null && a.seconds <= a.limitMinutes * 60;

/**
 * The level of a drill's next attempt, from its finished attempts. A pass in time climbs one level; a pass over
 * time stays; two misses in a row (give up or abandon) at a level step down one.
 */
export function nextLevel(attempts: PlanAttempt[]): number {
  let level = 1;
  let misses = 0;
  for (const a of finished(attempts)) {
    const at = Math.min(MAX_LEVEL, Math.max(1, a.level || 1));
    if (inTimeAttempt(a)) { level = Math.min(MAX_LEVEL, at + 1); misses = 0; }
    else if (a.outcome === "passed") { level = at; misses = 0; }
    else {
      misses += 1;
      level = at;
      if (misses >= 2) { level = Math.max(1, at - 1); misses = 0; }
    }
  }
  return level;
}

/**
 * How well a drill is held, from 0 to 1, or null before any attempt has ended. The newest attempts count most.
 * A pass in time scores more at higher levels; a pass over time scores less; a miss scores nothing.
 */
export function drillMastery(attempts: PlanAttempt[]): number | null {
  const done = finished(attempts).reverse().slice(0, 4);
  if (!done.length) return null;
  const weights = [1, 0.7, 0.5, 0.35];
  let sum = 0;
  let total = 0;
  done.forEach((a, i) => {
    const score = inTimeAttempt(a) ? Math.min(1, 0.7 + 0.1 * (a.level || 1)) : a.outcome === "passed" ? 0.45 : 0;
    sum += weights[i] * score;
    total += weights[i];
  });
  return sum / total;
}

/** When a drill is next due, by the spaced schedule, or null if it has never been finished. */
export function dueAt(attempts: PlanAttempt[]): Date | null {
  const done = finished(attempts);
  const last = done.at(-1);
  if (!last) return null;
  const end = Date.parse(last.finishedAt!);
  if (last.outcome !== "passed") return new Date(end + DAY);
  if (!inTimeAttempt(last)) return new Date(end + 2 * DAY);
  let streak = 0;
  for (let i = done.length - 1; i >= 0 && inTimeAttempt(done[i]); i--) streak++;
  return new Date(end + Math.min(60, 4 * 2 ** (streak - 1)) * DAY);
}

// ---------------------------------------------------------------------------------------------
// Skills

const STOP = new Set(["and", "of", "the", "for", "in", "with", "a", "an", "to", "on", "ml", "data", "structures"]);

/** The meaningful words of a skill name, lower case and singular, so "Transformers" matches "transformer". */
export function skillWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .map((w) => w.replace(/isation$|ization$/, "is"));
}

/** Readiness skills that a drill skill tag speaks to: every meaningful word of the tag appears in the skill. */
export function matchReadiness(tag: string, readiness: readonly ReadinessSkill[]): ReadinessSkill[] {
  const words = skillWords(tag);
  if (!words.length) return [];
  return readiness.filter((r) => {
    const have = new Set(skillWords(`${r.name} ${r.area}`));
    return words.every((w) => have.has(w));
  });
}

export type SkillRow = {
  skill: string;
  /** Mean mastery over the drills with this tag, untried drills counting as zero. */
  mastery: number;
  /** Whether any drill with this tag has been finished. */
  tried: boolean;
  /** How far short of "Built" the matching readiness skills are, 0 to 1, or null when none match. */
  readinessGap: number | null;
  /** 0 (strong) to 1 (weakest): what the plan sorts by. */
  weakness: number;
  drills: string[];
};

export function skillProfile(drills: readonly PlanDrill[], attempts: PlanAttempt[], readiness: readonly ReadinessSkill[] = []): SkillRow[] {
  const byDrill = new Map(drills.map((d) => [d.id, drillMastery(attempts.filter((a) => a.drillId === d.id))]));
  const tags = [...new Set(drills.flatMap((d) => d.skills))];
  return tags
    .map((skill) => {
      const ids = drills.filter((d) => d.skills.includes(skill)).map((d) => d.id);
      const ms = ids.map((id) => byDrill.get(id) ?? null);
      const mastery = ms.reduce<number>((s, m) => s + (m ?? 0), 0) / ms.length;
      const matches = matchReadiness(skill, readiness);
      const readinessGap = matches.length ? Math.max(...matches.map((r) => Math.max(0, 3 - r.level) / 3)) : null;
      const weakness = readinessGap === null ? 1 - mastery : 0.7 * (1 - mastery) + 0.3 * readinessGap;
      return { skill, mastery, tried: ms.some((m) => m !== null), readinessGap, weakness, drills: ids };
    })
    .sort((a, b) => b.weakness - a.weakness || Number(b.tried) - Number(a.tried) || a.skill.localeCompare(b.skill));
}

// ---------------------------------------------------------------------------------------------
// The plan

/** "locked": its lessons are not all mastered, or a miss has sent the learner back to a lesson first. */
export type PickKind = "open" | "retry" | "due" | "new" | "later" | "locked";

export type Pick = {
  drillId: string;
  kind: PickKind;
  score: number;
  level: number;
  limitMinutes: number;
  due: string | null;
  mastery: number | null;
  /** One plain sentence on why this drill is where it is. */
  reason: string;
  /** Hidden tests that failed on the last missed attempt, to look out for. */
  watch: string[];
};

const days = (ms: number) => Math.round(ms / DAY);
const ago = (iso: string, now: number) => {
  const d = days(now - Date.parse(iso));
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

export function planDrills(
  drills: readonly PlanDrill[],
  attempts: PlanAttempt[],
  readiness: readonly ReadinessSkill[] = [],
  now = Date.now(),
  /** Drills that can't be started now, with the reason. An attempt already under way is never blocked. */
  blocked: ReadonlyMap<string, string> = new Map(),
): { next: Pick | null; queue: Pick[]; skills: SkillRow[] } {
  const skills = skillProfile(drills, attempts, readiness);
  const weak = new Map(skills.map((s) => [s.skill, s]));
  const queue = drills.map((d): Pick => {
    const mine = attempts.filter((a) => a.drillId === d.id);
    const done = finished(mine);
    const last = done.at(-1);
    const level = nextLevel(mine);
    const due = dueAt(mine);
    const mastery = drillMastery(mine);
    const tags = d.skills.map((s) => weak.get(s)!).sort((a, b) => b.weakness - a.weakness);
    const weakness = tags.reduce((s, t) => s + t.weakness, 0) / tags.length;
    const weakest = tags[0];
    const watch = last && last.outcome !== "passed" ? (last.failedTests ?? []).slice(0, 3) : [];
    const base = { drillId: d.id, level, limitMinutes: limitFor(d.minutes, level), due: due?.toISOString() ?? null, mastery, watch };

    if (mine.some((a) => !a.finishedAt)) {
      return { ...base, kind: "open", score: 1000, reason: "You have an attempt under way. Finish it first." };
    }
    const block = blocked.get(d.id);
    if (block) return { ...base, kind: "locked", score: -1 + weakness / 10, reason: block };
    if (!last) {
      return { ...base, kind: "new", score: 50 + 30 * weakness, reason: `New. It works on ${weakest.skill}, ${weakest.tried ? "one of your weaker drill skills" : "a skill no drill has tested yet"}.` };
    }
    const overdue = due ? Math.max(0, (now - due.getTime()) / DAY) : 0;
    if (due && due.getTime() <= now) {
      if (last.outcome !== "passed") {
        const what = last.outcome === "gave_up" ? "You gave up on this" : "You left this unfinished";
        return { ...base, kind: "retry", score: 100 + 20 * weakness + Math.min(10, overdue), reason: `${what} ${ago(last.finishedAt!, now)}. It is back for another go.` };
      }
      const how = inTimeAttempt(last) ? "in time" : "over time";
      return { ...base, kind: "due", score: 60 + 25 * weakness + Math.min(10, overdue), reason: `Due again: you passed it ${how} ${ago(last.finishedAt!, now)}. Check it has stuck.` };
    }
    return { ...base, kind: "later", score: 10 + 10 * weakness, reason: `Not due until ${due!.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}.` };
  });
  queue.sort((a, b) => b.score - a.score || a.drillId.localeCompare(b.drillId));
  const next = queue[0] && queue[0].kind !== "later" && queue[0].kind !== "locked" ? queue[0] : null;
  return { next, queue, skills };
}
