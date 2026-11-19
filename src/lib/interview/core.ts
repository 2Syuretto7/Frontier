/**
 * The mock interview engine's rules. Pure functions, so they can be tested without a database or the API.
 *
 * - Locks. A question opens only once every lesson it rests on is mastered through Learn, and once the learner's
 *   own work gives it something to talk about (a project with results, a Readiness check). A mode opens with its
 *   first question. Nothing here ever pulls a lesson the learner could not open yet.
 * - Spacing. A question comes back on a schedule set by its last score: a weak answer the next day, a fair one in
 *   three days, a strong one in a week, doubling with each strong answer in a row.
 * - Repair. Each rubric criterion names the lessons behind it. A criterion scored weak sends the learner to them:
 *   a lesson not yet mastered (but open) is queued in Learn, a mastered one is to be reread. The question waits
 *   until that is done.
 * - Rhythm. One interview session joins the daily queue every two days, in the mode that most needs practice.
 */
import { isUnlocked, type Graph } from "../graph";
import type { Pull } from "../guide/core";
import { CONCEPTS } from "../../content/concepts";
import type { InterviewMode, InterviewQuestion, Need } from "../../content/interview/types";

export type { InterviewMode, InterviewQuestion } from "../../content/interview/types";

export const MODE_ORDER: readonly InterviewMode[] = ["fundamentals", "coding", "design", "research", "values"];

export const MODES: Record<InterviewMode, { title: string; short: string; about: string }> = {
  fundamentals: {
    title: "ML fundamentals",
    short: "Fundamentals",
    about: "Explain the why behind the methods: normalisation, optimisers, attention, losses, generalisation.",
  },
  coding: {
    title: "Coding",
    short: "Coding",
    about: "Write working code while talking through your approach, its complexity and how you would test it.",
  },
  design: {
    title: "Systems design at scale",
    short: "Design",
    about: "Design training and inference systems with real numbers: memory, throughput, failures, parallelism.",
  },
  research: {
    title: "Research discussion",
    short: "Research",
    about: "Walk through your own project, defend your choices, judge other people's claims and plan what comes next.",
  },
  values: {
    title: "Values and motivation",
    short: "Values",
    about: "Why this lab, how you handle being wrong, and how you weigh safety against shipping.",
  },
};

export const isMode = (v: unknown): v is InterviewMode => typeof v === "string" && (MODE_ORDER as readonly string[]).includes(v);

/** Questions in a session, at most. */
export const SESSION_QUESTIONS = 3;
/** Follow-up questions the interviewer may ask on one question before moving on. */
export const MAX_FOLLOW_UPS = 2;
/** Days between interview sessions in the daily queue. */
export const SESSION_GAP_DAYS = 2;
/** A criterion score at or below this is weak and sends the learner back to its lessons. Scores run 0 to 3. */
export const WEAK = 1;
export const SCORE_MAX = 3;

const DAY = 86_400_000;

// ---------------------------------------------------------------------------------------------
// Locks

/** What the learner's own work offers, for questions that need it. */
export type Context = { mastered: ReadonlySet<string>; hasProject: boolean; hasReadiness: boolean };

export type Lock = { locked: boolean; missing: string[]; needs: Need["kind"][] };

export function questionLock(q: Pick<InterviewQuestion, "lessons" | "needs">, ctx: Context): Lock {
  const missing = q.lessons.filter((id) => !ctx.mastered.has(id));
  const needs = (q.needs ?? [])
    .filter((n) => (n.kind === "project" ? !ctx.hasProject : !ctx.hasReadiness))
    .map((n) => n.kind);
  return { locked: missing.length > 0 || needs.length > 0, missing, needs };
}

const NEED_TEXT: Record<Need["kind"], string> = {
  project: "a project with at least one experiment result",
  readiness: "a Readiness check of real job postings",
};

/** Why a question is locked, in one sentence. */
export function lockReason(lock: Lock, titleOf: (id: string) => string, authored: (id: string) => boolean): string {
  const parts: string[] = [];
  if (lock.missing.length) {
    const unwritten = lock.missing.filter((id) => !authored(id)).length;
    const note = unwritten ? ` (${unwritten === lock.missing.length ? "not written yet" : "some not written yet"})` : "";
    parts.push(`you have mastered ${lock.missing.map(titleOf).join(", ")}${note}`);
  }
  for (const n of lock.needs) parts.push(`you have ${NEED_TEXT[n]}`);
  return `Opens once ${parts.join(" and ")}.`;
}

// ---------------------------------------------------------------------------------------------
// Scores and spacing

export type CriterionScore = { criterion: string; score: number };

/** One scored answer to a question, as the planner reads it. */
export type GradedAnswer = { questionId: string; sessionId: number; at: string; scores: CriterionScore[] };

/** An answer's score from 0 to 1: the mean of its criteria over the maximum. */
export function answerScore(scores: readonly CriterionScore[]): number {
  if (!scores.length) return 0;
  return scores.reduce((s, c) => s + Math.max(0, Math.min(SCORE_MAX, c.score)), 0) / (scores.length * SCORE_MAX);
}

export const band = (score: number): "weak" | "fair" | "strong" => (score < 0.5 ? "weak" : score < 0.75 ? "fair" : "strong");

const sorted = (answers: readonly GradedAnswer[]) => [...answers].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

/** When a question is next due, from its scored answers, or null before its first. */
export function questionDue(answers: readonly GradedAnswer[]): Date | null {
  const done = sorted(answers);
  const last = done.at(-1);
  if (!last) return null;
  const at = Date.parse(last.at);
  const b = band(answerScore(last.scores));
  if (b === "weak") return new Date(at + DAY);
  if (b === "fair") return new Date(at + 3 * DAY);
  let streak = 0;
  for (let i = done.length - 1; i >= 0 && band(answerScore(done[i].scores)) === "strong"; i--) streak++;
  return new Date(at + Math.min(60, 7 * 2 ** (streak - 1)) * DAY);
}

// ---------------------------------------------------------------------------------------------
// Repair: weak criteria send the learner back to their lessons

export type InterviewRemedy = {
  questionId: string;
  criterion: string;
  lessonId: string;
  /** "learn": open but not mastered, so Learn begins it; "revisit": mastered, so the learner rereads it. */
  mode: "learn" | "revisit";
  since: string;
};

/**
 * What a question's last answer asks of the learner before the question comes back: each lesson behind a weak
 * criterion whose prerequisites are mastered. A lesson not yet mastered must be mastered; a mastered one must be
 * reopened after the interview. Lessons the learner cannot open yet are left alone.
 */
export function interviewRemedies(
  q: Pick<InterviewQuestion, "id" | "rubric">,
  last: GradedAnswer | null,
  graph: Graph,
  mastered: ReadonlySet<string>,
  visitedSince: (lessonId: string, since: string) => boolean,
): InterviewRemedy[] {
  if (!last) return [];
  const out: InterviewRemedy[] = [];
  const seen = new Set<string>();
  for (const s of last.scores) {
    if (s.score > WEAK) continue;
    const criterion = q.rubric.find((c) => c.id === s.criterion);
    for (const lessonId of criterion?.lessons ?? []) {
      if (seen.has(lessonId) || !graph.nodes.get(lessonId)?.authored) continue;
      if (!mastered.has(lessonId) && !isUnlocked(graph, lessonId, mastered)) continue;
      const mode = mastered.has(lessonId) ? ("revisit" as const) : ("learn" as const);
      if (mode === "revisit" && visitedSince(lessonId, last.at)) continue;
      seen.add(lessonId);
      out.push({ questionId: q.id, criterion: s.criterion, lessonId, mode, since: last.at });
    }
  }
  return out;
}

export const interviewPulls = (open: readonly InterviewRemedy[], criterionText: (r: InterviewRemedy) => string): Pull[] =>
  open
    .filter((r) => r.mode === "learn")
    .map((r) => ({ lessonId: r.lessonId, source: "interview" as const, weight: 1, why: `A mock interview answer fell short here: ${criterionText(r)}` }));

// ---------------------------------------------------------------------------------------------
// The plan

export type QuestionKind = "locked" | "blocked" | "new" | "due" | "later";

export type QuestionState = {
  id: string;
  mode: InterviewMode;
  kind: QuestionKind;
  /** The last answer's score, 0 to 1, or null before any. */
  score: number | null;
  due: string | null;
  answers: number;
  /** Lessons and pieces of the learner's own work still missing, for a locked question. */
  missing: number;
  reason: string;
};

export type PlanInput = {
  questions: readonly InterviewQuestion[];
  answers: readonly GradedAnswer[];
  ctx: Context;
  remedies: readonly InterviewRemedy[];
  titleOf: (id: string) => string;
  authored: (id: string) => boolean;
  now: number;
};

const shortDate = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export function planQuestions(input: PlanInput): QuestionState[] {
  const { questions, answers, ctx, remedies, titleOf, authored, now } = input;
  return questions.map((q): QuestionState => {
    const mine = sorted(answers.filter((a) => a.questionId === q.id));
    const last = mine.at(-1) ?? null;
    const score = last ? answerScore(last.scores) : null;
    const due = questionDue(mine);
    const lock = questionLock(q, ctx);
    const base = { id: q.id, mode: q.mode, score, due: due?.toISOString() ?? null, answers: mine.length, missing: lock.missing.length + lock.needs.length };
    if (lock.locked) return { ...base, kind: "locked", reason: lockReason(lock, titleOf, authored) };
    const waits = remedies.filter((r) => r.questionId === q.id);
    if (waits.length) {
      const parts = [...new Set(waits.map((r) => `${r.mode === "learn" ? "master" : "reread"} ${titleOf(r.lessonId)}`))];
      return { ...base, kind: "blocked", reason: `Your last answer was weak on what ${waits.length === 1 ? "this lesson teaches" : "these lessons teach"}. It comes back once you ${parts.join(" and ")}.` };
    }
    if (!last) return { ...base, kind: "new", reason: "Not asked yet." };
    if (due && due.getTime() <= now) return { ...base, kind: "due", reason: `Due again: last time you scored ${Math.round(score! * 100)} per cent.` };
    return { ...base, kind: "later", reason: `Comes back on ${shortDate(due!)}.` };
  });
}

/** The questions for a session in a mode: due ones first, weakest first, then new ones in bank order. */
export function pickQuestions(states: readonly QuestionState[], mode: InterviewMode, n = SESSION_QUESTIONS): string[] {
  const inMode = states.filter((s) => s.mode === mode);
  const due = inMode.filter((s) => s.kind === "due").sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const fresh = inMode.filter((s) => s.kind === "new");
  return [...due, ...fresh].slice(0, n).map((s) => s.id);
}

export type ModeSummary = {
  mode: InterviewMode;
  open: number;
  total: number;
  ready: number;
  /** Mean of the last score of each answered question, or null. */
  mean: number | null;
  lastAt: string | null;
};

export function modeSummaries(states: readonly QuestionState[], sessions: readonly { mode: InterviewMode; finishedAt: string | null }[]): ModeSummary[] {
  return MODE_ORDER.map((mode) => {
    const inMode = states.filter((s) => s.mode === mode);
    const scored = inMode.filter((s) => s.score !== null);
    const last = sessions.filter((s) => s.mode === mode && s.finishedAt).map((s) => s.finishedAt!).sort().at(-1) ?? null;
    return {
      mode,
      open: inMode.filter((s) => s.kind !== "locked").length,
      total: inMode.length,
      ready: inMode.filter((s) => s.kind === "due" || s.kind === "new").length,
      mean: scored.length ? scored.reduce((t, s) => t + s.score!, 0) / scored.length : null,
      lastAt: last,
    };
  });
}

/**
 * The mode for the next session, or null when none is ready: modes with due questions come first, weakest
 * first; then modes not practised for longest. Never one with nothing ready.
 */
export function nextMode(summaries: readonly ModeSummary[], states: readonly QuestionState[]): { mode: InterviewMode; why: string } | null {
  const ready = summaries.filter((m) => m.ready > 0);
  if (!ready.length) return null;
  const dueIn = (mode: InterviewMode) => states.filter((s) => s.mode === mode && s.kind === "due").length;
  const pick = [...ready].sort((a, b) => {
    const d = Number(dueIn(b.mode) > 0) - Number(dueIn(a.mode) > 0);
    if (d) return d;
    if (dueIn(a.mode) > 0) return (a.mean ?? 0) - (b.mean ?? 0);
    return (a.lastAt ? Date.parse(a.lastAt) : 0) - (b.lastAt ? Date.parse(b.lastAt) : 0) || MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode);
  })[0];
  const due = dueIn(pick.mode);
  const why = due
    ? `${due} ${MODES[pick.mode].short.toLowerCase()} ${due === 1 ? "question is" : "questions are"} due again${pick.mean !== null ? `; your average there is ${Math.round(pick.mean * 100)} per cent` : ""}.`
    : pick.lastAt
      ? `${MODES[pick.mode].title} is the mode you have practised least recently.`
      : `${MODES[pick.mode].title} has opened: you have mastered what its first questions rest on.`;
  return { mode: pick.mode, why };
}

/** Whether a session belongs in today's queue: one is under way, or none has finished in the last two days. */
export function sessionWanted(lastFinishedAt: string | null, open: boolean, now: number): boolean {
  if (open) return true;
  return !lastFinishedAt || now - Date.parse(lastFinishedAt) >= SESSION_GAP_DAYS * DAY - 2 * 3_600_000;
}

// ---------------------------------------------------------------------------------------------
// Ideas not yet taught

const MATCHERS = CONCEPTS.map((c) => ({
  concept: c,
  rxs: [
    ...(c.patterns.some((p) => !p.startsWith("=")) ? [new RegExp(c.patterns.filter((p) => !p.startsWith("=")).map((p) => `(?:${p})`).join("|"), "i")] : []),
    ...(c.patterns.some((p) => p.startsWith("=")) ? [new RegExp(c.patterns.filter((p) => p.startsWith("=")).map((p) => `(?:${p.slice(1)})`).join("|"))] : []),
  ],
}));

/**
 * Ideas a piece of interviewer text uses that no mastered lesson teaches. Used to keep Parton's follow-ups and
 * fresh questions inside what the learner has been taught, as the question bank is by its tests.
 */
export function untaughtIdeas(text: string, mastered: ReadonlySet<string>): string[] {
  return MATCHERS.filter(({ concept, rxs }) => rxs.some((rx) => rx.test(text)) && !concept.taughtIn.some((t) => mastered.has(t))).map(({ concept }) => concept.name);
}
