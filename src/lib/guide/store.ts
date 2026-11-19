import "server-only";
import { query } from "@/lib/db";
import { GRAPH } from "@/lib/curriculum";
import { frontier } from "@/lib/graph";
import { STAGE_INFO, nextStage, type Project, type Stage } from "@/lib/pipeline";
import { partonConnected, structured } from "@/lib/parton/claude";
import { shortHash } from "@/lib/project-assist/core";
import { chooseNextStep } from "@/lib/scheduler";
import { DRILLS, DRILL_BY_ID } from "@/content/drills";
import { CASES, CASE_BY_ID } from "@/content/gym";
import {
  buildToday,
  drillLock,
  drillPulls,
  gymLessons,
  gymMiss,
  gymPulls,
  makeWeeklyPlan,
  matchLessons,
  needStates,
  needsReplan,
  projectPulls,
  readinessPulls,
  remedies,
  troublePulls,
  weekKey,
  type FailedDrill,
  type Need,
  type NeedState,
  type Pull,
  type Remedy,
  type TodayItem,
  type Trouble,
  type WeeklyPlan,
} from "./core";
import {
  NEEDS_SCHEMA,
  NEEDS_SYSTEM,
  TROUBLE_SCHEMA,
  TROUBLE_SYSTEM,
  acceptLessons,
  needsRequest,
  troubleRequest,
  type LessonOption,
  type NeedsOutput,
  type TroubleOutput,
} from "./prompts";

/**
 * Guidance's storage, and how it reaches Learn. Tables are created here, on first use, so the feature stays in its
 * own files. Every pull it hands Learn is filtered again by the scheduler to lessons already unlocked by mastery.
 */

const SCHEMA = [
  // The lessons Parton found a project's next stage needs, and the run that found them.
  `CREATE TABLE IF NOT EXISTS guide_needs (
     project_id INTEGER NOT NULL,
     stage TEXT NOT NULL,
     lesson_id TEXT NOT NULL,
     why TEXT NOT NULL DEFAULT '',
     PRIMARY KEY (project_id, stage, lesson_id)
   )`,
  `CREATE TABLE IF NOT EXISTS guide_need_runs (
     project_id INTEGER NOT NULL,
     stage TEXT NOT NULL,
     fingerprint TEXT NOT NULL,
     status TEXT NOT NULL,
     at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (project_id, stage)
   )`,
  // Lessons that trouble in a project's lab notebook pointed to.
  `CREATE TABLE IF NOT EXISTS guide_trouble (
     id SERIAL PRIMARY KEY,
     project_id INTEGER NOT NULL,
     lesson_id TEXT NOT NULL,
     note TEXT NOT NULL,
     at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // When each lesson was last opened, so a failed drill knows its mastered lessons have been revisited.
  `CREATE TABLE IF NOT EXISTS guide_visits (
     lesson_id TEXT PRIMARY KEY,
     at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

const shared = globalThis as typeof globalThis & { __frontierGuide?: Promise<void> };

function ready(): Promise<void> {
  shared.__frontierGuide ??= (async () => {
    for (const statement of SCHEMA) await query(statement);
  })().catch((error) => {
    shared.__frontierGuide = undefined;
    throw error;
  });
  return shared.__frontierGuide;
}

async function q<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return query<T>(text, params);
}

const TZ = "Asia/Kolkata";
const title = (id: string) => GRAPH.nodes.get(id)?.title ?? id;
const iso = (v: unknown) => new Date(v as string).toISOString();
const istDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

async function masteredNow(): Promise<Set<string>> {
  const rows = await query<{ lesson_id: string }>("SELECT lesson_id FROM progress WHERE status = 'mastered'");
  return new Set(rows.map((r) => r.lesson_id));
}

// ---------------------------------------------------------------------------------------------
// Readiness: the weekly plan

const PLAN_KEY = "weekly_plan";

export type PlanView = { plan: WeeklyPlan | null; begun: number; scorecard: boolean };

/**
 * This week's plan, made afresh at the start of each week and after each new check of postings. Null until the
 * scorecard has had its first check.
 */
export async function weeklyPlan(mastered: ReadonlySet<string>, pace: number): Promise<PlanView> {
  const { latestCheckId, readinessGaps } = await import("@/lib/readiness/store");
  const check = await latestCheckId();
  if (check === null) return { plan: null, begun: 0, scorecard: false };
  const basis = `check:${check}`;
  const now = new Date();
  const week = weekKey(now);
  const rows = await query<{ value: WeeklyPlan | string }>("SELECT value FROM settings WHERE key = $1", [PLAN_KEY]);
  let plan = rows[0] ? (typeof rows[0].value === "string" ? (JSON.parse(rows[0].value) as WeeklyPlan) : rows[0].value) : null;
  if (needsReplan(plan, week, basis)) {
    const gaps = await readinessGaps();
    plan = makeWeeklyPlan(
      gaps.map((g) => ({ key: g.key, name: g.name, gap: g.gap, lessons: g.lessons?.length ? g.lessons : matchLessons(g.name, GRAPH.nodes.values()) })),
      mastered,
      { week, basis, pace, now },
    );
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [PLAN_KEY, JSON.stringify(plan)],
    );
  }
  const begun = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM progress
      WHERE guided = 'readiness' AND started_at >= (date_trunc('week', now() AT TIME ZONE '${TZ}') AT TIME ZONE '${TZ}')`,
  );
  return { plan, begun: begun[0]?.n ?? 0, scorecard: true };
}

// ---------------------------------------------------------------------------------------------
// Projects: what the next stage needs, and trouble in the lab notebook

const authoredOptions = (filter: (id: string) => boolean = () => true): LessonOption[] =>
  GRAPH.order
    .map((id) => GRAPH.nodes.get(id)!)
    .filter((n) => n.authored && filter(n.id))
    .map((n) => ({ id: n.id, title: n.title, course: n.courseTitle }));

const needsFingerprint = (p: Project, next: Stage) => shortHash([next, p.question, p.why, p.plan].join("\n"));

/** Whether the lessons the project's next stage needs should be worked out again, because the stage or its text changed. */
export async function needsStale(p: Project): Promise<boolean> {
  const next = nextStage(p.stage);
  if (p.status !== "active" || !next || !p.question.trim() || !partonConnected()) return false;
  const runs = await q<{ fingerprint: string }>("SELECT fingerprint FROM guide_need_runs WHERE project_id = $1 AND stage = $2", [p.id, next]);
  return runs[0]?.fingerprint !== needsFingerprint(p, next);
}

/** Parton works out which lessons the project's next stage needs. Run in the background after a save. */
export async function refreshNeeds(projectId: number): Promise<void> {
  const { getProject } = await import("@/lib/projects");
  const p = await getProject(projectId);
  if (!p || !(await needsStale(p))) return;
  const next = nextStage(p.stage)!;
  const print = needsFingerprint(p, next);
  await q(
    `INSERT INTO guide_need_runs (project_id, stage, fingerprint, status) VALUES ($1, $2, $3, 'pending')
     ON CONFLICT (project_id, stage) DO UPDATE SET fingerprint = EXCLUDED.fingerprint, status = 'pending', at = now()`,
    [p.id, next, print],
  );
  try {
    const options = authoredOptions();
    const out = await structured<NeedsOutput>({
      system: NEEDS_SYSTEM,
      messages: [{ role: "user", content: needsRequest(p, STAGE_INFO[next], options) }],
      schema: NEEDS_SCHEMA,
      effort: "low",
    });
    const needs = acceptLessons(out.needs, new Set(options.map((o) => o.id)), 4);
    await q("DELETE FROM guide_needs WHERE project_id = $1 AND stage = $2", [p.id, next]);
    for (const n of needs) {
      await q("INSERT INTO guide_needs (project_id, stage, lesson_id, why) VALUES ($1, $2, $3, $4)", [p.id, next, n.lesson, n.why.trim().slice(0, 300)]);
    }
    await q("UPDATE guide_need_runs SET status = 'ready', at = now() WHERE project_id = $1 AND stage = $2 AND fingerprint = $3", [p.id, next, print]);
  } catch (error) {
    console.error("Project needs:", error);
    await q("UPDATE guide_need_runs SET status = 'failed', at = now() WHERE project_id = $1 AND stage = $2 AND fingerprint = $3", [p.id, next, print]);
  }
}

export type ProjectGuide = {
  next: Stage | null;
  status: "none" | "pending" | "ready" | "failed";
  needs: (Need & { state: NeedState; title: string })[];
  troubles: (Trouble & { title: string; at: string; mastered: boolean })[];
};

export async function projectGuide(p: Project, mastered?: ReadonlySet<string>): Promise<ProjectGuide> {
  const have = mastered ?? (await masteredNow());
  const next = p.status === "active" ? nextStage(p.stage) : null;
  const [needRows, runs, troubleRows] = await Promise.all([
    next ? q<{ lesson_id: string; why: string }>("SELECT lesson_id, why FROM guide_needs WHERE project_id = $1 AND stage = $2", [p.id, next]) : Promise.resolve([]),
    next ? q<{ status: string }>("SELECT status FROM guide_need_runs WHERE project_id = $1 AND stage = $2", [p.id, next]) : Promise.resolve([]),
    q<{ lesson_id: string; note: string; at: unknown }>(
      "SELECT lesson_id, note, at FROM guide_trouble WHERE project_id = $1 AND at > now() - interval '30 days' ORDER BY at DESC LIMIT 6",
      [p.id],
    ),
  ]);
  const needs = needStates(needRows.map((r) => ({ lessonId: r.lesson_id, why: r.why })), GRAPH, have)
    .sort((a, b) => GRAPH.order.indexOf(a.lessonId) - GRAPH.order.indexOf(b.lessonId))
    .map((n) => ({ ...n, title: title(n.lessonId) }));
  const status = (runs[0]?.status as ProjectGuide["status"] | undefined) ?? "none";
  const troubles = troubleRows.map((t) => ({ lessonId: t.lesson_id, note: t.note, title: title(t.lesson_id), at: iso(t.at), mastered: have.has(t.lesson_id) }));
  return { next, status, needs, troubles };
}

/**
 * Why the project can't move on yet, or null if it can: a lesson the next stage needs whose prerequisites are
 * mastered, but which is not mastered itself. Needs still waiting on prerequisites lock nothing.
 */
export async function stageLock(p: Project): Promise<string | null> {
  const guide = await projectGuide(p);
  const active = guide.needs.filter((n) => n.state === "active");
  if (!guide.next || active.length === 0) return null;
  const names = active.map((n) => n.title).join(", ");
  return `The ${STAGE_INFO[guide.next].title.toLowerCase()} stage needs ${active.length === 1 ? "a lesson" : "lessons"} you haven't mastered yet: ${names}. Learn has put ${active.length === 1 ? "it" : "them"} first.`;
}

/**
 * Parton reads a new lab notebook entry or experiment result for gaps in understanding. A lesson it points to that
 * is mastered comes back in the next Review, written around what went wrong; one that is unlocked but not mastered
 * is queued in Learn. Lessons the learner cannot open yet are never offered.
 */
export async function recordTrouble(projectId: number, entry: string): Promise<void> {
  if (!partonConnected() || !entry.trim()) return;
  const { getProject } = await import("@/lib/projects");
  const p = await getProject(projectId);
  if (!p || p.status !== "active") return;
  const mastered = await masteredNow();
  const open = new Set(frontier(GRAPH, mastered).map((n) => n.id));
  const options = authoredOptions((id) => mastered.has(id) || open.has(id));
  if (options.length === 0) return;
  try {
    const out = await structured<TroubleOutput>({
      system: TROUBLE_SYSTEM,
      messages: [{ role: "user", content: troubleRequest(p, entry, options) }],
      schema: TROUBLE_SCHEMA,
      effort: "low",
    });
    for (const t of acceptLessons(out.troubles, new Set(options.map((o) => o.id)), 2)) {
      const note = t.note.trim().slice(0, 300);
      await q("INSERT INTO guide_trouble (project_id, lesson_id, note) VALUES ($1, $2, $3)", [p.id, t.lesson, note]);
      if (mastered.has(t.lesson)) {
        // Two of the lesson's review cards fall due now, and the review writer leans on what went wrong.
        await query(
          `UPDATE review_cards SET due = now() WHERE exercise_id IN (
             SELECT exercise_id FROM review_cards WHERE lesson_id = $1 AND due > now() ORDER BY due LIMIT 2)`,
          [t.lesson],
        );
        await query("INSERT INTO parton_notes (lesson_id, kind, body) VALUES ($1, 'misconception', $2)", [
          t.lesson, `From the project lab notebook: ${note}`,
        ]);
      }
    }
  } catch (error) {
    console.error("Notebook trouble:", error);
  }
}

async function projectGuidance(mastered: ReadonlySet<string>): Promise<Pull[]> {
  const { activeProject } = await import("@/lib/projects");
  const p = await activeProject();
  if (!p) return [];
  const guide = await projectGuide(p, mastered);
  const troubles = guide.troubles.map((t) => ({ lessonId: t.lessonId, note: t.note }));
  return [...(guide.next ? projectPulls(guide.needs, STAGE_INFO[guide.next].title) : []), ...troublePulls(troubles, GRAPH, mastered)];
}

// ---------------------------------------------------------------------------------------------
// Drills: locks, and lessons a failed drill sends the learner back to

export async function markVisited(lessonId: string): Promise<void> {
  await q("INSERT INTO guide_visits (lesson_id, at) VALUES ($1, now()) ON CONFLICT (lesson_id) DO UPDATE SET at = now()", [lessonId]);
}

type AttemptLike = { drillId: string; finishedAt: string | null; outcome: string | null; failedTests: string[] };

export type DrillGuide = {
  /** Drills whose lessons are not all mastered, with the ones missing. */
  locks: Map<string, string[]>;
  /** What each failed drill asks of the learner before it comes back. */
  remedies: Remedy[];
};

export async function drillGuide(attempts: readonly AttemptLike[], mastered?: ReadonlySet<string>): Promise<DrillGuide> {
  const have = mastered ?? (await masteredNow());
  const visits = new Map(
    (await q<{ lesson_id: string; at: unknown }>("SELECT lesson_id, at FROM guide_visits")).map((v) => [v.lesson_id, Date.parse(iso(v.at))]),
  );
  const visitedSince = (id: string, since: string) => (visits.get(id) ?? 0) > Date.parse(since);
  const locks = new Map<string, string[]>();
  const all: Remedy[] = [];
  for (const d of DRILLS) {
    const lock = drillLock(d, have);
    if (lock.locked) locks.set(d.id, lock.missing);
    const last = attempts
      .filter((a) => a.drillId === d.id && a.finishedAt && a.outcome)
      .sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!))[0];
    const failed: FailedDrill | null = last && last.outcome !== "passed" ? { drillId: d.id, finishedAt: last.finishedAt!, failedTests: last.failedTests } : null;
    all.push(...remedies(d, failed, GRAPH, have, visitedSince));
  }
  return { locks, remedies: all };
}

/** Why each drill can't be started now, for the drill plan: its lessons aren't mastered, or a miss sent the learner back. */
export function drillBlocks(guide: DrillGuide): Map<string, string> {
  const out = new Map<string, string>();
  for (const [id, missing] of guide.locks) {
    const unwritten = missing.filter((m) => !GRAPH.nodes.get(m)?.authored);
    const names = missing.map(title).join(", ");
    out.set(id, `Opens once you have mastered ${names}${unwritten.length ? ` (${unwritten.length === missing.length ? "not written yet" : "some not written yet"})` : ""}.`);
  }
  for (const r of guide.remedies) {
    if (out.has(r.drillId)) continue;
    const same = guide.remedies.filter((x) => x.drillId === r.drillId);
    const parts = same.map((x) => `${x.mode === "learn" ? "master" : "revisit"} ${title(x.lessonId)}`);
    out.set(r.drillId, `Your last attempt failed on what ${same.length === 1 ? "this lesson teaches" : "these lessons teach"}. It comes back once you ${parts.join(" and ")}.`);
  }
  return out;
}

async function drillGuidance(mastered: ReadonlySet<string>): Promise<Pull[]> {
  const { allStats } = await import("@/lib/drills");
  const { attempts } = await allStats();
  const guide = await drillGuide(attempts, mastered);
  return drillPulls(guide.remedies, (id) => DRILL_BY_ID.get(id)?.title ?? id);
}

// ---------------------------------------------------------------------------------------------
// The Debugging gym: locks, and lessons a missed bug sends the learner back to

type GymAttemptLike = { caseId: string; finishedAt: string | null; outcome: string | null; wrongGuesses: number; diagnosed: boolean; failedTests: string[] };

/**
 * Cases whose lessons are not all mastered, and what each case's last miss asks of the learner. A wrong guess at the
 * cause counts as a miss even when the fix then passed, so the lessons behind the bug come back.
 */
export async function gymGuide(attempts: readonly GymAttemptLike[], mastered?: ReadonlySet<string>): Promise<DrillGuide> {
  const { DIAGNOSIS } = await import("@/lib/gym-plan");
  const have = mastered ?? (await masteredNow());
  const visits = new Map(
    (await q<{ lesson_id: string; at: unknown }>("SELECT lesson_id, at FROM guide_visits")).map((v) => [v.lesson_id, Date.parse(iso(v.at))]),
  );
  const visitedSince = (id: string, since: string) => (visits.get(id) ?? 0) > Date.parse(since);
  const locks = new Map<string, string[]>();
  const all: Remedy[] = [];
  for (const c of CASES) {
    const lock = drillLock({ id: c.id, title: c.title, lessons: c.lessons }, have);
    if (lock.locked) locks.set(c.id, lock.missing);
    const last = attempts
      .filter((a) => a.caseId === c.id && a.finishedAt && a.outcome)
      .sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!))[0];
    all.push(...remedies(gymLessons(c, DIAGNOSIS), last ? gymMiss(last, DIAGNOSIS) : null, GRAPH, have, visitedSince));
  }
  return { locks, remedies: all };
}

/** Why each case can't be started now: its lessons aren't mastered, or a miss sent the learner back. */
export const gymBlocks = (guide: DrillGuide): Map<string, string> => drillBlocks(guide);

async function gymGuidance(mastered: ReadonlySet<string>): Promise<Pull[]> {
  const { allAttempts } = await import("@/lib/gym");
  const guide = await gymGuide(await allAttempts(), mastered);
  return gymPulls(guide.remedies, (id) => CASE_BY_ID.get(id)?.title ?? id);
}

// ---------------------------------------------------------------------------------------------
// Everything together

/** Every lesson Readiness, Projects, Drills and the gym want Learn to favour. Each source fails on its own without stopping the rest. */
export async function guidePulls(mastered: ReadonlySet<string>, pace: number): Promise<Pull[]> {
  const safe = async (name: string, f: () => Promise<Pull[]>) => {
    try {
      return await f();
    } catch (error) {
      console.error(`Guidance from ${name} unavailable:`, error);
      return [];
    }
  };
  const [readiness, project, drill, gym] = await Promise.all([
    safe("Readiness", async () => {
      const { plan, begun } = await weeklyPlan(mastered, pace);
      return readinessPulls(plan, begun, mastered);
    }),
    safe("Projects", () => projectGuidance(mastered)),
    safe("Drills", () => drillGuidance(mastered)),
    safe("Debugging gym", () => gymGuidance(mastered)),
  ]);
  return [...project, ...drill, ...gym, ...readiness];
}

/**
 * The day's queue: what is open, Review, lessons a failed drill or gym case sent the learner back to, the day's new
 * lessons at their pace, one drill, one gym case and one project step. The Learn button opens its first item.
 */
export async function today({ afterReview = false }: { afterReview?: boolean } = {}): Promise<TodayItem[]> {
  const { learnInputs } = await import("@/lib/learning");
  const input = await learnInputs({ afterReview });

  const head: TodayItem[] = [];
  if (input.openLesson) {
    head.push({ kind: "continue", lessonId: input.openLesson.id, title: input.openLesson.title, why: null });
  }
  if (!input.reviewedSinceLesson && input.dueReviews >= 1) head.push({ kind: "review", count: input.dueReviews });

  // New lessons up to today's pace, picked one after another as Learn would pick them.
  const lessons: TodayItem[] = [];
  let remaining = [...input.frontier].filter((n) => n.id !== input.openLesson?.id);
  let lastTrack = input.lastTrack;
  const slots = Math.max(0, input.pace - input.newLessonsToday - (input.openLesson ? 1 : 0));
  for (let k = 0; k < slots; k++) {
    const step = chooseNextStep({ ...input, openLesson: null, dueReviews: 0, frontier: remaining, lastTrack, newLessonsToday: input.newLessonsToday + k });
    if (step.kind !== "begin") break;
    lessons.push({ kind: "begin", lessonId: step.lesson.id, title: step.lesson.title, why: step.why ?? null, pastPace: false });
    remaining = remaining.filter((n) => n.id !== step.lesson.id);
    lastTrack = step.lesson.track;
  }

  const [{ allStats, drillPlan }, { activeProject }] = await Promise.all([import("@/lib/drills"), import("@/lib/projects")]);
  const [{ attempts }, plan, project] = await Promise.all([allStats(), drillPlan(), activeProject()]);
  const todayIst = istDay(new Date());
  const have = await masteredNow();
  const guide = await drillGuide(attempts, have);

  const revisits: TodayItem[] = [];
  for (const r of guide.remedies.filter((x) => x.mode === "revisit")) {
    if (revisits.some((i) => i.kind === "revisit" && i.lessonId === r.lessonId)) continue;
    const drill = DRILL_BY_ID.get(r.drillId)?.title ?? r.drillId;
    revisits.push({
      kind: "revisit", lessonId: r.lessonId, title: title(r.lessonId),
      why: `The ${drill} drill failed${r.tests.length ? ` on "${r.tests[0]}"` : ""}. Reread this, then the drill comes back.`,
    });
  }

  let drill: TodayItem | null = null;
  const drilledToday = attempts.some((a) => istDay(a.startedAt) === todayIst);
  if (plan.next && (plan.next.kind === "open" || !drilledToday)) {
    drill = { kind: "drill", drillId: plan.next.drillId, title: DRILL_BY_ID.get(plan.next.drillId)?.title ?? plan.next.drillId, why: plan.next.reason };
  }

  const gym = await gymToday(have, todayIst, revisits).catch((error) => {
    console.error("Debugging gym unavailable for today:", error);
    return null;
  });

  let step: TodayItem | null = null;
  if (project) {
    const touched =
      project.history.some((h) => istDay(h.at) === todayIst) ||
      project.experiments.some((e) => istDay(e.at) === todayIst) ||
      project.notebook.some((n) => istDay(n.at) === todayIst);
    if (!touched) {
      const lock = await stageLock(project);
      step = {
        kind: "project", projectId: project.id, title: project.title,
        why: `${STAGE_INFO[project.stage].title}: ${STAGE_INFO[project.stage].ask}${lock ? ` ${lock}` : ""}`,
      };
    }
  }

  const queue = buildToday({ head, revisits, lessons, drill, gym, project: step });
  if (queue.length === 0) {
    // Everything for today is done. Learn never stops at the pace: offer the next lesson anyway.
    const next = chooseNextStep({ ...input, openLesson: null, dueReviews: 0 });
    if (next.kind === "begin") queue.push({ kind: "begin", lessonId: next.lesson.id, title: next.lesson.title, why: next.why ?? null, pastPace: true });
  }
  return queue.map((i) => (i.kind === "begin" ? { ...i, guided: guidedOf(i, input.pulls ?? []) } : i));
}

/** Which feature steered Learn to a lesson, from the pulls that apply to it. */
function guidedOf(item: Extract<TodayItem, { kind: "begin" }>, pulls: readonly Pull[]): string | null {
  return item.why ? pulls.find((p) => p.lessonId === item.lessonId && p.why === item.why)?.source ?? null : null;
}

/**
 * The gym's part of the day: lessons a missed case sent the learner back to (added to `revisits`), and one case, if
 * one is due and none was started today. A case under way always shows.
 */
async function gymToday(have: ReadonlySet<string>, todayIst: string, revisits: TodayItem[]): Promise<TodayItem | null> {
  const { gymPlan } = await import("@/lib/gym");
  const plan = await gymPlan();
  const guide = await gymGuide(plan.attempts, have);
  for (const r of guide.remedies.filter((x) => x.mode === "revisit")) {
    if (revisits.some((i) => i.kind === "revisit" && i.lessonId === r.lessonId)) continue;
    const name = CASE_BY_ID.get(r.drillId)?.title ?? r.drillId;
    revisits.push({
      kind: "revisit", lessonId: r.lessonId, title: title(r.lessonId),
      why: `In the Debugging gym, "${name}" showed a gap here. Reread this, then the case comes back.`,
    });
  }
  const startedToday = plan.attempts.some((a) => istDay(a.startedAt) === todayIst);
  if (!plan.next || (plan.next.kind !== "open" && startedToday)) return null;
  return { kind: "gym", caseId: plan.next.caseId, title: CASE_BY_ID.get(plan.next.caseId)?.title ?? plan.next.caseId, why: plan.next.reason };
}
