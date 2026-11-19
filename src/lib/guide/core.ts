/**
 * Guidance: how Readiness, Projects, Drills and the Debugging gym steer what Learn does next. Pure functions, so they can be tested
 * without a database or the API.
 *
 * The one rule over all of it: guidance only ever acts on lessons whose prerequisites are already mastered through
 * the learner's own path through Learn. It never pulls a locked lesson forward, never queues one, and never locks
 * anything on a lesson the learner could not open yet. Until the prerequisites are met, a skill, project stage or
 * drill simply waits, and Learn carries on as it would without it.
 */
import { isUnlocked, type Graph, type LessonNode } from "../graph";
import { skillWords } from "../drill-plan";

// ---------------------------------------------------------------------------------------------
// Pulls: lessons that Readiness, Projects or Drills want Learn to favour

export type PullSource = "project" | "drill" | "gym" | "readiness";

/** A lesson some feature wants Learn to favour, with how strongly and why. */
export type Pull = { lessonId: string; source: PullSource; weight: number; why: string };

/** A project waiting on a lesson comes first, then a drill or gym case that failed on it, then the weekly Readiness plan. */
export const SOURCE_RANK: Record<PullSource, number> = { project: 3, drill: 2, gym: 2, readiness: 1 };

/** Whether a lesson's prerequisites are met through mastery, so guidance may act on it. */
export const reachable = (graph: Graph, id: string, mastered: ReadonlySet<string>) =>
  graph.nodes.get(id)?.authored === true && isUnlocked(graph, id, mastered);

/**
 * The pulled lesson Learn should begin, from the lessons it could begin anyway (the frontier), or null when no pull
 * lands on the frontier. Pulls on any other lesson are ignored.
 */
export function topPull(frontier: readonly LessonNode[], pulls: readonly Pull[]): { lesson: LessonNode; pull: Pull } | null {
  const at = new Map(frontier.map((n, i) => [n.id, i]));
  const best = pulls
    .filter((p) => at.has(p.lessonId))
    .sort((a, b) => SOURCE_RANK[b.source] - SOURCE_RANK[a.source] || b.weight - a.weight || at.get(a.lessonId)! - at.get(b.lessonId)!)[0];
  return best ? { lesson: frontier[at.get(best.lessonId)!], pull: best } : null;
}

// ---------------------------------------------------------------------------------------------
// Readiness: the weekly plan

/** How many of the weakest job skills a week's plan works on. */
export const FOCUS_SKILLS = 3;
/** How many lessons each skill brings into a plan. */
export const LESSONS_PER_SKILL = 6;

/** "2026-W47": the ISO week, in India time. Plans run Monday to Sunday. */
export function weekKey(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Half of a week's new lessons, at the learner's pace, go to the plan; the rest keep rotating the three tracks. */
export const weeklyQuota = (pace: number) => Math.max(1, Math.ceil((pace * 7) / 2));

export type GapSkill = { key: string; name: string; gap: number; lessons: string[] };

export type PlanSkill = { key: string; name: string; gap: number; lessons: string[] };

export type WeeklyPlan = {
  week: string;
  /** The Readiness check the plan was made from. A new check (the quarterly refresh) means a new plan. */
  basis: string;
  quota: number;
  skills: PlanSkill[];
  madeAt: string;
};

/** The plan for a week: the weakest skills, each with the unmastered lessons that teach it. */
export function makeWeeklyPlan(
  gaps: readonly GapSkill[],
  mastered: ReadonlySet<string>,
  opts: { week: string; basis: string; pace: number; now: Date },
): WeeklyPlan {
  const skills = gaps
    .map((g) => ({ key: g.key, name: g.name, gap: g.gap, lessons: g.lessons.filter((id) => !mastered.has(id)).slice(0, LESSONS_PER_SKILL) }))
    .filter((g) => g.gap > 0 && g.lessons.length > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, FOCUS_SKILLS);
  return { week: opts.week, basis: opts.basis, quota: weeklyQuota(opts.pace), skills, madeAt: opts.now.toISOString() };
}

/** A plan is redone each week, and whenever a fresh Readiness check changes what labs ask for. */
export const needsReplan = (plan: WeeklyPlan | null, week: string, basis: string) => !plan || plan.week !== week || plan.basis !== basis;

/**
 * What the weekly plan pulls: its lessons not yet mastered, weighted by how far short the skill is, until the week's
 * quota of plan lessons has been begun.
 */
export function readinessPulls(plan: WeeklyPlan | null, begunThisWeek: number, mastered: ReadonlySet<string>): Pull[] {
  if (!plan || begunThisWeek >= plan.quota) return [];
  return plan.skills.flatMap((s) =>
    s.lessons
      .filter((id) => !mastered.has(id))
      .map((lessonId) => ({ lessonId, source: "readiness" as const, weight: s.gap, why: `Builds ${s.name}, one of the job skills you are furthest from.` })),
  );
}

/**
 * Lessons whose titles speak to a skill, for a skill Parton has not yet matched to lessons. A lesson's own title
 * counts twice its chapter's. At least two matching words are needed, or the only word of a one-word skill.
 */
export function matchLessons(skill: string, nodes: Iterable<LessonNode>, limit = LESSONS_PER_SKILL): string[] {
  const want = new Set(skillWords(skill));
  if (want.size === 0) return [];
  const need = Math.min(2, want.size) * 2;
  const scored: { id: string; score: number; at: number }[] = [];
  let at = 0;
  for (const n of nodes) {
    at++;
    if (!n.authored) continue;
    const title = new Set(skillWords(n.title));
    const chapter = new Set(skillWords(n.chapterTitle));
    let score = 0;
    for (const w of want) score += (title.has(w) ? 2 : 0) + (chapter.has(w) ? 1 : 0);
    if (score >= need) scored.push({ id: n.id, score, at });
  }
  return scored.sort((a, b) => b.score - a.score || a.at - b.at).slice(0, limit).sort((a, b) => a.at - b.at).map((s) => s.id);
}

// ---------------------------------------------------------------------------------------------
// Projects: the lessons the next stage needs

export type NeedState = "met" | "active" | "waiting";

export type Need = { lessonId: string; why: string };

/**
 * Where each need stands: met once mastered; active when its prerequisites are mastered, so Learn queues it and
 * the stage stays locked until it is mastered; waiting while its prerequisites are not yet mastered, when it neither
 * queues nor locks anything.
 */
export function needStates(needs: readonly Need[], graph: Graph, mastered: ReadonlySet<string>): (Need & { state: NeedState })[] {
  return needs
    .filter((n) => graph.nodes.has(n.lessonId))
    .map((n) => ({ ...n, state: mastered.has(n.lessonId) ? "met" : reachable(graph, n.lessonId, mastered) ? "active" : "waiting" }));
}

export const projectPulls = (needs: readonly (Need & { state: NeedState })[], stageTitle: string): Pull[] =>
  needs
    .filter((n) => n.state === "active")
    .map((n) => ({ lessonId: n.lessonId, source: "project" as const, weight: 1, why: `Your project's ${stageTitle.toLowerCase()} stage needs it: ${n.why}` }));

/** Lessons trouble in the lab notebook points to. Mastered ones come back in Review; open ones are queued. */
export type Trouble = { lessonId: string; note: string };

export const troublePulls = (troubles: readonly Trouble[], graph: Graph, mastered: ReadonlySet<string>): Pull[] =>
  troubles
    .filter((t) => !mastered.has(t.lessonId) && reachable(graph, t.lessonId, mastered))
    .map((t) => ({ lessonId: t.lessonId, source: "project" as const, weight: 0.5, why: `Something in your lab notebook points here: ${t.note}` }));

// ---------------------------------------------------------------------------------------------
// Drills: unlocking, and sending a failed drill back to its lessons

export type DrillLessons = { id: string; title: string; lessons: string[]; testLessons?: Record<string, string[]> };

/** A drill opens once every lesson it tests is mastered. Lists the ones still to master. */
export function drillLock(drill: DrillLessons, mastered: ReadonlySet<string>): { locked: boolean; missing: string[] } {
  const missing = drill.lessons.filter((id) => !mastered.has(id));
  return { locked: missing.length > 0, missing };
}

/** The lessons behind the hidden tests that failed, or the drill's own lessons when none are named. */
export function lessonsBehind(drill: DrillLessons, failedTests: readonly string[]): string[] {
  const named = failedTests.flatMap((t) => drill.testLessons?.[t] ?? []);
  return [...new Set(named.length ? named : drill.lessons)];
}

export type FailedDrill = { drillId: string; finishedAt: string; failedTests: string[] };

export type Remedy = {
  drillId: string;
  lessonId: string;
  /** "learn": not yet mastered, so Learn begins it; "revisit": mastered, so the learner reopens it. */
  mode: "learn" | "revisit";
  /** The failed tests that point to this lesson. */
  tests: string[];
  since: string;
};

/**
 * What a drill's last miss asks of the learner before the drill comes back: each lesson behind the failed tests,
 * if its prerequisites are mastered. A lesson not yet mastered must be mastered; a mastered one must be reopened
 * after the miss. Lessons whose prerequisites are not met are left alone.
 */
export function remedies(
  drill: DrillLessons,
  failed: FailedDrill | null,
  graph: Graph,
  mastered: ReadonlySet<string>,
  visitedSince: (lessonId: string, since: string) => boolean,
): Remedy[] {
  if (!failed) return [];
  return lessonsBehind(drill, failed.failedTests)
    .filter((id) => graph.nodes.get(id)?.authored && (mastered.has(id) || isUnlocked(graph, id, mastered)))
    .map((lessonId) => ({
      drillId: drill.id,
      lessonId,
      mode: mastered.has(lessonId) ? ("revisit" as const) : ("learn" as const),
      tests: failed.failedTests.filter((t) => (drill.testLessons?.[t] ?? drill.lessons).includes(lessonId)),
      since: failed.finishedAt,
    }))
    .filter((r) => r.mode === "learn" || !visitedSince(r.lessonId, r.since));
}

export const drillPulls = (open: readonly Remedy[], titleOf: (drillId: string) => string): Pull[] =>
  open
    .filter((r) => r.mode === "learn")
    .map((r) => ({ lessonId: r.lessonId, source: "drill" as const, weight: 1, why: `The ${titleOf(r.drillId)} drill failed on it${r.tests.length ? ` (${r.tests[0]})` : ""}. It comes back once you have this.` }));

// ---------------------------------------------------------------------------------------------
// The Debugging gym: the same locks and remedies as drills, with a misdiagnosis counting as a failed test

/** The lessons a gym case sends the learner back to: those behind its bug, and behind each hidden test. */
export const gymLessons = (c: { id: string; title: string; bugLessons: string[]; testLessons?: Record<string, string[]> }, diagnosis: string): DrillLessons => ({
  id: c.id,
  title: c.title,
  lessons: c.bugLessons,
  testLessons: { ...c.testLessons, [diagnosis]: c.bugLessons },
});

/**
 * What a finished gym attempt reports as missed, or null when it shows no gap: a wrong guess at the cause (or never
 * naming it) counts as the diagnosis failing; a fix that never passed counts its failing hidden tests.
 */
export function gymMiss(
  a: { caseId: string; finishedAt: string | null; outcome: string | null; wrongGuesses: number; diagnosed: boolean; failedTests: string[] },
  diagnosis: string,
): FailedDrill | null {
  if (!a.finishedAt || !a.outcome) return null;
  const solved = a.outcome === "solved";
  if (solved && a.wrongGuesses === 0) return null;
  const missed = [...(a.wrongGuesses > 0 || !a.diagnosed ? [diagnosis] : []), ...(solved ? [] : a.failedTests)];
  return { drillId: a.caseId, finishedAt: a.finishedAt, failedTests: missed };
}

export const gymPulls = (open: readonly Remedy[], titleOf: (caseId: string) => string): Pull[] =>
  open
    .filter((r) => r.mode === "learn")
    .map((r) => ({ lessonId: r.lessonId, source: "gym" as const, weight: 1, why: `In the Debugging gym, "${titleOf(r.drillId)}" showed a gap here. The case comes back once you have this.` }));

// ---------------------------------------------------------------------------------------------
// The daily queue

export type TodayItem =
  | { kind: "continue"; lessonId: string; title: string; why: string | null }
  | { kind: "review"; count: number }
  | { kind: "revisit"; lessonId: string; title: string; why: string }
  | { kind: "begin"; lessonId: string; title: string; why: string | null; pastPace: boolean; guided?: string | null }
  | { kind: "drill"; drillId: string; title: string; why: string }
  | { kind: "gym"; caseId: string; title: string; why: string }
  | { kind: "project"; projectId: number; title: string; why: string };

/** Items that open a lesson, which is where the learner goes after a Review session. */
export const isLessonItem = (i: TodayItem) => i.kind === "continue" || i.kind === "revisit" || i.kind === "begin";

/**
 * One queue for the day: whatever is open first, then Review, then lessons a failed drill or gym case sent the
 * learner back to, then new lessons with the day's drill, gym case and project step woven in after the first of them.
 */
export function buildToday(input: {
  head: TodayItem[];
  revisits: TodayItem[];
  lessons: TodayItem[];
  drill: TodayItem | null;
  gym?: TodayItem | null;
  project: TodayItem | null;
}): TodayItem[] {
  const [first, ...rest] = input.lessons;
  const practice = [input.drill, input.gym ?? null, input.project].filter((i): i is TodayItem => i !== null);
  return [...input.head, ...input.revisits, ...(first ? [first] : []), ...practice, ...rest];
}
