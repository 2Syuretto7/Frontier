import "server-only";
import { query } from "@/lib/db";
import { GRAPH } from "@/lib/curriculum";
import { partonConnected, structured } from "@/lib/parton/claude";
import { QUESTIONS, QUESTION_BY_ID } from "@/content/interview";
import type { InterviewMode, InterviewQuestion } from "@/content/interview/types";
import {
  MAX_FOLLOW_UPS,
  MODES,
  SESSION_QUESTIONS,
  WEAK,
  answerScore,
  interviewPulls,
  interviewRemedies,
  modeSummaries,
  nextMode,
  pickQuestions,
  planQuestions,
  questionLock,
  sessionWanted,
  untaughtIdeas,
  type Context,
  type GradedAnswer,
  type InterviewRemedy,
  type ModeSummary,
  type QuestionState,
} from "./core";
import {
  GRADER_SYSTEM,
  GRADE_SCHEMA,
  TURN_SCHEMA,
  WRITE_SCHEMA,
  acceptGrade,
  acceptWritten,
  gradeRequest,
  interviewerSystem,
  turnRequest,
  writeRequest,
  writerSystem,
  type Background,
  type GradeOutput,
  type Turn,
  type TurnOutput,
  type WriteOutput,
} from "./prompts";
import type { Pull, TodayItem } from "@/lib/guide/core";

/**
 * The mock interview engine's storage, and how it reaches Learn and the daily queue. Tables are created here, on
 * first use, so the feature stays in its own files.
 */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS interview_sessions (
     id SERIAL PRIMARY KEY,
     mode TEXT NOT NULL,
     questions JSONB NOT NULL,
     current INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'open',
     started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     finished_at TIMESTAMPTZ
   )`,
  // Every line of every interview, so answers can be read back later.
  `CREATE TABLE IF NOT EXISTS interview_turns (
     id SERIAL PRIMARY KEY,
     session_id INTEGER NOT NULL,
     question_id TEXT NOT NULL,
     role TEXT NOT NULL,
     body TEXT NOT NULL DEFAULT '',
     code TEXT,
     checks JSONB,
     seconds INTEGER,
     at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS interview_turns_session ON interview_turns (session_id, id)`,
  `CREATE TABLE IF NOT EXISTS interview_grades (
     session_id INTEGER NOT NULL,
     question_id TEXT NOT NULL,
     criterion TEXT NOT NULL,
     score INTEGER NOT NULL,
     evidence TEXT NOT NULL DEFAULT '',
     note TEXT NOT NULL DEFAULT '',
     at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (session_id, question_id, criterion)
   )`,
  `CREATE TABLE IF NOT EXISTS interview_reports (
     session_id INTEGER NOT NULL,
     question_id TEXT NOT NULL,
     score REAL NOT NULL,
     feedback TEXT NOT NULL DEFAULT '',
     outline TEXT NOT NULL DEFAULT '',
     at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (session_id, question_id)
   )`,
  // Questions Parton wrote on mastered lessons, kept so they can come back on the same schedule as the bank's.
  `CREATE TABLE IF NOT EXISTS interview_written (
     id SERIAL PRIMARY KEY,
     mode TEXT NOT NULL,
     prompt TEXT NOT NULL,
     lessons JSONB NOT NULL,
     notes TEXT NOT NULL DEFAULT '',
     minutes INTEGER NOT NULL DEFAULT 5,
     rubric JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Shared with guidance: when each lesson was last opened.
  `CREATE TABLE IF NOT EXISTS guide_visits (
     lesson_id TEXT PRIMARY KEY,
     at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

const shared = globalThis as typeof globalThis & { __frontierInterview?: Promise<void> };

function ready(): Promise<void> {
  shared.__frontierInterview ??= (async () => {
    for (const statement of SCHEMA) await query(statement);
  })().catch((error) => {
    shared.__frontierInterview = undefined;
    throw error;
  });
  return shared.__frontierInterview;
}

async function q<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return query<T>(text, params);
}

const iso = (v: unknown) => new Date(v as string).toISOString();
const json = <T,>(v: unknown, fallback: T): T => {
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return fallback; }
  }
  return (v as T) ?? fallback;
};
const title = (id: string) => GRAPH.nodes.get(id)?.title ?? id;
const authored = (id: string) => GRAPH.nodes.get(id)?.authored === true;
const lessonLine = (id: string) => {
  const n = GRAPH.nodes.get(id);
  return n ? `${id}: ${n.title} (${n.courseTitle})` : id;
};

/** Modes Parton may write fresh questions for, and the courses those questions draw on. */
const WRITABLE: Partial<Record<InterviewMode, string[]>> = {
  fundamentals: ["L1", "L2", "L3", "L4", "L5", "M14"],
  design: ["E3", "E6", "E7", "E10", "E12"],
};

// ---------------------------------------------------------------------------------------------
// Loading

async function masteredNow(): Promise<Set<string>> {
  const rows = await query<{ lesson_id: string }>("SELECT lesson_id FROM progress WHERE status = 'mastered'");
  return new Set(rows.map((r) => r.lesson_id));
}

async function writtenQuestions(): Promise<InterviewQuestion[]> {
  const rows = await q<{ id: number; mode: string; prompt: string; lessons: unknown; notes: string; minutes: number; rubric: unknown }>(
    "SELECT id, mode, prompt, lessons, notes, minutes, rubric FROM interview_written ORDER BY id",
  );
  return rows.map((r) => ({
    id: `w${r.id}`,
    mode: r.mode as InterviewMode,
    prompt: r.prompt,
    lessons: json<string[]>(r.lessons, []),
    notes: r.notes,
    minutes: Number(r.minutes),
    rubric: json<InterviewQuestion["rubric"]>(r.rubric, []),
  }));
}

async function allQuestions(): Promise<InterviewQuestion[]> {
  return [...QUESTIONS, ...(await writtenQuestions())];
}

export async function getQuestion(id: string): Promise<InterviewQuestion | null> {
  return QUESTION_BY_ID.get(id) ?? (await writtenQuestions()).find((w) => w.id === id) ?? null;
}

async function gradedAnswers(): Promise<GradedAnswer[]> {
  const rows = await q<{ session_id: number; question_id: string; criterion: string; score: number; at: unknown }>(
    "SELECT session_id, question_id, criterion, score, at FROM interview_grades ORDER BY at",
  );
  const byKey = new Map<string, GradedAnswer>();
  for (const r of rows) {
    const key = `${r.session_id}:${r.question_id}`;
    const a = byKey.get(key) ?? { questionId: r.question_id, sessionId: Number(r.session_id), at: iso(r.at), scores: [] };
    a.scores.push({ criterion: r.criterion, score: Number(r.score) });
    byKey.set(key, a);
  }
  return [...byKey.values()];
}

async function learnerContext(mastered: ReadonlySet<string>): Promise<Context> {
  const [{ listProjects }, { latestCheckId }] = await Promise.all([import("@/lib/projects"), import("@/lib/readiness/store")]);
  const [projects, check] = await Promise.all([
    listProjects().catch(() => []),
    latestCheckId().catch(() => null),
  ]);
  return { mastered, hasProject: projects.some((p) => p.experiments.some((e) => e.result)), hasReadiness: check !== null };
}

async function background(): Promise<Background> {
  const [{ listProjects }, { loadScorecard }] = await Promise.all([import("@/lib/projects"), import("@/lib/readiness/store")]);
  const [projects, card] = await Promise.all([listProjects().catch(() => []), loadScorecard().catch(() => null)]);
  const withResults = projects.filter((p) => p.experiments.some((e) => e.result));
  // The open project if it has results, else the most recent one that does.
  const p = withResults.find((x) => x.status === "active") ?? withResults.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0] ?? null;
  return {
    role: card?.roleSet ? card.role : null,
    labs: card ? [...new Set(card.postings.map((x) => x.company))].slice(0, 8) : [],
    project: p && {
      title: p.title, question: p.question, why: p.why, plan: p.plan,
      experiments: p.experiments.map((e) => ({ title: e.title, expected: e.expected, result: e.result })),
      notebook: p.notebook.map((n) => n.body),
      writeupSummary: p.writeupSummary,
    },
  };
}

async function visitTimes(): Promise<Map<string, number>> {
  const rows = await q<{ lesson_id: string; at: unknown }>("SELECT lesson_id, at FROM guide_visits");
  return new Map(rows.map((v) => [v.lesson_id, Date.parse(iso(v.at))]));
}

export type SessionRow = { id: number; mode: InterviewMode; questions: string[]; current: number; status: string; startedAt: string; finishedAt: string | null };

const toSession = (r: { id: number; mode: string; questions: unknown; current: number; status: string; started_at: unknown; finished_at: unknown }): SessionRow => ({
  id: Number(r.id),
  mode: r.mode as InterviewMode,
  questions: json<string[]>(r.questions, []),
  current: Number(r.current),
  status: r.status,
  startedAt: iso(r.started_at),
  finishedAt: r.finished_at ? iso(r.finished_at) : null,
});

export async function listSessions(limit = 200): Promise<SessionRow[]> {
  const rows = await q<{ id: number; mode: string; questions: unknown; current: number; status: string; started_at: unknown; finished_at: unknown }>(
    "SELECT id, mode, questions, current, status, started_at, finished_at FROM interview_sessions ORDER BY started_at DESC LIMIT $1",
    [limit],
  );
  return rows.map(toSession);
}

export async function getSession(id: number): Promise<SessionRow | null> {
  const rows = await q<{ id: number; mode: string; questions: unknown; current: number; status: string; started_at: unknown; finished_at: unknown }>(
    "SELECT id, mode, questions, current, status, started_at, finished_at FROM interview_sessions WHERE id = $1",
    [id],
  );
  return rows[0] ? toSession(rows[0]) : null;
}

export async function openSession(): Promise<SessionRow | null> {
  const rows = await q<{ id: number; mode: string; questions: unknown; current: number; status: string; started_at: unknown; finished_at: unknown }>(
    "SELECT id, mode, questions, current, status, started_at, finished_at FROM interview_sessions WHERE status IN ('open', 'scoring') ORDER BY started_at DESC LIMIT 1",
  );
  return rows[0] ? toSession(rows[0]) : null;
}

// ---------------------------------------------------------------------------------------------
// The plan

export type InterviewState = {
  questions: InterviewQuestion[];
  states: QuestionState[];
  summaries: ModeSummary[];
  remedies: InterviewRemedy[];
  next: { mode: InterviewMode; why: string } | null;
  open: SessionRow | null;
  sessions: SessionRow[];
  ctx: Context;
};

export async function interviewState(mastered?: ReadonlySet<string>): Promise<InterviewState> {
  const have = mastered ?? (await masteredNow());
  const [questions, answers, ctx, visits, sessions] = await Promise.all([allQuestions(), gradedAnswers(), learnerContext(have), visitTimes(), listSessions()]);
  const visitedSince = (id: string, since: string) => (visits.get(id) ?? 0) > Date.parse(since);
  const remedies: InterviewRemedy[] = [];
  for (const question of questions) {
    if (questionLock(question, ctx).locked) continue;
    const last = answers.filter((a) => a.questionId === question.id).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).at(-1) ?? null;
    remedies.push(...interviewRemedies(question, last, GRAPH, have, visitedSince));
  }
  const states = planQuestions({ questions, answers, ctx, remedies, titleOf: title, authored, now: Date.now() });
  const summaries = modeSummaries(states, sessions);
  const open = sessions.find((s) => s.status === "open" || s.status === "scoring") ?? null;
  return { questions, states, summaries, remedies, next: nextMode(summaries, states), open, sessions, ctx };
}

const criterionOf = (questions: readonly InterviewQuestion[]) => (r: InterviewRemedy) =>
  questions.find((x) => x.id === r.questionId)?.rubric.find((c) => c.id === r.criterion)?.text.replace(/\.$/, "").toLowerCase() ?? "an idea this lesson teaches";

/** Lessons weak interview answers want Learn to begin: open, not yet mastered. */
export async function interviewGuidance(mastered: ReadonlySet<string>): Promise<Pull[]> {
  const s = await interviewState(mastered);
  return interviewPulls(s.remedies, criterionOf(s.questions));
}

/** For the daily queue: lessons to reread after weak answers, and the day's session if one is due. */
export async function interviewToday(mastered: ReadonlySet<string>): Promise<{ revisits: TodayItem[]; session: TodayItem | null }> {
  const s = await interviewState(mastered);
  const crit = criterionOf(s.questions);
  const revisits: TodayItem[] = [];
  for (const r of s.remedies.filter((x) => x.mode === "revisit")) {
    if (revisits.some((i) => i.kind === "revisit" && i.lessonId === r.lessonId)) continue;
    revisits.push({ kind: "revisit", lessonId: r.lessonId, title: title(r.lessonId), why: `A mock interview answer was weak here: ${crit(r)}. Reread this, then the question comes back.` });
  }
  let session: TodayItem | null = null;
  if (s.open) {
    session = { kind: "interview", sessionId: s.open.id, mode: s.open.mode, title: `${MODES[s.open.mode].title} interview`, why: "You have a mock interview under way. Finish it to get your scores." };
  } else if (s.next) {
    const lastDone = s.sessions.filter((x) => x.finishedAt && x.status === "done").map((x) => x.finishedAt!).sort().at(-1) ?? null;
    if (sessionWanted(lastDone, false, Date.now())) {
      session = { kind: "interview", sessionId: null, mode: s.next.mode, title: `${MODES[s.next.mode].title} interview`, why: s.next.why };
    }
  }
  return { revisits, session };
}

// ---------------------------------------------------------------------------------------------
// Sessions

export type Result = { ok: true; id: number } | { ok: false; error: string };

/** Parton writes one fresh question in a mode, on mastered lessons only. Returns its id, or null. */
async function writeQuestion(mode: InterviewMode, state: InterviewState): Promise<string | null> {
  const courses = WRITABLE[mode];
  if (!courses || !partonConnected()) return null;
  const options = GRAPH.order
    .map((id) => GRAPH.nodes.get(id)!)
    .filter((n) => n.authored && courses.includes(n.course) && state.ctx.mastered.has(n.id))
    .map((n) => ({ id: n.id, title: n.title, course: n.courseTitle }));
  if (options.length < 3) return null;
  const weak = state.remedies.map((r) => `${title(r.lessonId)}: ${criterionOf(state.questions)(r)}`).slice(0, 8);
  const earlier = state.questions.filter((x) => x.mode === mode).map((x) => x.prompt.slice(0, 200));
  const allowed = new Set(options.map((o) => o.id));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await structured<WriteOutput>({
        system: writerSystem(mode),
        messages: [{ role: "user", content: writeRequest(options, weak, earlier) }],
        schema: WRITE_SCHEMA,
        effort: "low",
        maxTokens: 8000,
      });
      const written = acceptWritten(out, allowed);
      if (!written) continue;
      const untaught = untaughtIdeas(`${written.prompt}\n${written.rubric.map((c) => c.text).join("\n")}`, state.ctx.mastered);
      if (untaught.length) continue;
      const rows = await q<{ id: number }>(
        "INSERT INTO interview_written (mode, prompt, lessons, notes, minutes, rubric) VALUES ($1, $2, $3::jsonb, $4, $5, $6::jsonb) RETURNING id",
        [mode, written.prompt, JSON.stringify(written.lessons), written.notes, written.minutes, JSON.stringify(written.rubric)],
      );
      return `w${rows[0].id}`;
    } catch (error) {
      console.error("Interview question writer:", error);
      return null;
    }
  }
  return null;
}

/**
 * Starts a session in a mode: up to three questions that are due or new, weakest first. When the bank has fewer
 * ready, Parton writes a fresh one on mastered lessons. An open session is returned instead of starting another.
 */
export async function startSession(mode: InterviewMode): Promise<Result> {
  const state = await interviewState();
  if (state.open) return { ok: true, id: state.open.id };
  if (!partonConnected()) return { ok: false, error: "Mock interviews need Parton, which is not connected yet." };
  const summary = state.summaries.find((m) => m.mode === mode)!;
  if (summary.open === 0) return { ok: false, error: `${MODES[mode].title} opens once you have mastered what its first questions rest on.` };
  const picked = pickQuestions(state.states, mode);
  if (picked.length < SESSION_QUESTIONS) {
    const fresh = await writeQuestion(mode, state);
    if (fresh) picked.push(fresh);
  }
  if (!picked.length) return { ok: false, error: `Nothing in ${MODES[mode].title.toLowerCase()} is due yet. Each card says when it comes back.` };
  const first = (await getQuestion(picked[0]))!;
  const rows = await q<{ id: number }>("INSERT INTO interview_sessions (mode, questions) VALUES ($1, $2::jsonb) RETURNING id", [mode, JSON.stringify(picked)]);
  const id = Number(rows[0].id);
  await q("INSERT INTO interview_turns (session_id, question_id, role, body) VALUES ($1, $2, 'interviewer', $3)", [id, first.id, first.prompt]);
  return { ok: true, id };
}

export type TurnRow = { id: number; questionId: string; role: "interviewer" | "candidate"; body: string; code: string | null; checks: Turn["checks"]; seconds: number | null; at: string };

export async function turnsFor(sessionId: number): Promise<TurnRow[]> {
  const rows = await q<{ id: number; question_id: string; role: string; body: string; code: string | null; checks: unknown; seconds: number | null; at: unknown }>(
    "SELECT id, question_id, role, body, code, checks, seconds, at FROM interview_turns WHERE session_id = $1 ORDER BY id",
    [sessionId],
  );
  return rows.map((r) => ({
    id: Number(r.id), questionId: r.question_id, role: r.role as TurnRow["role"], body: r.body, code: r.code,
    checks: json<Turn["checks"]>(r.checks, null), seconds: r.seconds === null ? null : Number(r.seconds), at: iso(r.at),
  }));
}

const asTurns = (rows: readonly TurnRow[]): Turn[] => rows.map((t) => ({ role: t.role, body: t.body, code: t.code, checks: t.checks }));

/** The interviewer's next line on a question, or null to move on. A follow-up that uses an idea not yet taught is rewritten once, then dropped. */
async function followUp(question: InterviewQuestion, mode: InterviewMode, turns: readonly TurnRow[], mastered: ReadonlySet<string>, bg: Background): Promise<string | null> {
  const asked = turns.filter((t) => t.role === "interviewer").length - 1;
  if (asked >= MAX_FOLLOW_UPS) return null;
  let extra = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await structured<TurnOutput>({
      system: interviewerSystem(mode),
      messages: [{ role: "user", content: turnRequest(question, question.lessons.map(lessonLine), bg, asTurns(turns), asked) + extra }],
      schema: TURN_SCHEMA,
      effort: "low",
      maxTokens: 6000,
    });
    if (out.action !== "follow_up" || !out.message?.trim()) return null;
    const untaught = untaughtIdeas(out.message, mastered);
    if (!untaught.length) return out.message.trim().slice(0, 1500);
    extra = `\n\nYour last follow-up used ideas the candidate has not been taught yet (${untaught.join(", ")}). Ask about something else, or move on.`;
  }
  return null;
}

export type AnswerInput = {
  body: string;
  code?: string | null;
  checks?: Turn["checks"];
  seconds?: number | null;
  /** Hand in the answer as it stands and go to the next question, with no follow-up. */
  moveOn?: boolean;
};

export type AnswerResult = { ok: true; done: boolean } | { ok: false; error: string };

export async function answer(sessionId: number, input: AnswerInput): Promise<AnswerResult> {
  const session = await getSession(sessionId);
  if (!session || session.status !== "open") return { ok: false, error: "This interview has ended." };
  const qid = session.questions[session.current];
  const question = await getQuestion(qid);
  if (!question) return { ok: false, error: "This question is no longer available." };
  const body = input.body.trim();
  if (!body && !input.code?.trim() && !input.moveOn) return { ok: false, error: "Say something first, or press Move on." };
  if (body || input.code?.trim()) {
    await q(
      "INSERT INTO interview_turns (session_id, question_id, role, body, code, checks, seconds) VALUES ($1, $2, 'candidate', $3, $4, $5::jsonb, $6)",
      [sessionId, qid, body, input.code?.trim() ? input.code : null, input.checks ? JSON.stringify(input.checks) : null, input.seconds ?? null],
    );
  }
  const turns = (await turnsFor(sessionId)).filter((t) => t.questionId === qid);
  if (!input.moveOn && turns.some((t) => t.role === "candidate")) {
    try {
      const [mastered, bg] = await Promise.all([masteredNow(), background()]);
      const line = await followUp(question, session.mode, turns, mastered, bg);
      if (line) {
        await q("INSERT INTO interview_turns (session_id, question_id, role, body) VALUES ($1, $2, 'interviewer', $3)", [sessionId, qid, line]);
        return { ok: true, done: false };
      }
    } catch (error) {
      // The interviewer is unavailable: move on rather than leave the session stuck.
      console.error("Interviewer:", error);
    }
  }
  return advance(session);
}

async function advance(session: SessionRow): Promise<AnswerResult> {
  const next = session.current + 1;
  if (next < session.questions.length) {
    const question = await getQuestion(session.questions[next]);
    await q("UPDATE interview_sessions SET current = $2 WHERE id = $1", [session.id, next]);
    if (question) {
      await q("INSERT INTO interview_turns (session_id, question_id, role, body) VALUES ($1, $2, 'interviewer', $3)", [session.id, question.id, question.prompt]);
      return { ok: true, done: false };
    }
    return advance({ ...session, current: next });
  }
  await finish(session.id);
  return { ok: true, done: true };
}

/** Ends the interview now. Answered questions are scored; questions not reached are dropped. */
export async function finish(sessionId: number): Promise<void> {
  await q("UPDATE interview_sessions SET status = 'scoring', finished_at = COALESCE(finished_at, now()) WHERE id = $1 AND status = 'open'", [sessionId]);
  await score(sessionId);
}

/** Scores every answered question in a session that is waiting for scores. Safe to call again after a failure. */
export async function score(sessionId: number): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession(sessionId);
  if (!session || session.status !== "scoring") return { ok: true };
  const turns = await turnsFor(sessionId);
  const done = new Set((await q<{ question_id: string }>("SELECT question_id FROM interview_reports WHERE session_id = $1", [sessionId])).map((r) => r.question_id));
  const answered = session.questions.filter((id) => !done.has(id) && turns.some((t) => t.questionId === id && t.role === "candidate"));
  const [bg, mastered] = await Promise.all([background(), masteredNow()]);
  const failures: string[] = [];
  await Promise.all(
    answered.map(async (qid) => {
      const question = await getQuestion(qid);
      if (!question) return;
      try {
        const out = await structured<GradeOutput>({
          system: GRADER_SYSTEM,
          messages: [{ role: "user", content: gradeRequest(question, question.lessons.map(lessonLine), bg, asTurns(turns.filter((t) => t.questionId === qid))) }],
          schema: GRADE_SCHEMA,
          effort: "medium",
          maxTokens: 12000,
        });
        const grade = acceptGrade(out, question);
        for (const c of grade.criteria) {
          await q(
            `INSERT INTO interview_grades (session_id, question_id, criterion, score, evidence, note) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (session_id, question_id, criterion) DO UPDATE SET score = EXCLUDED.score, evidence = EXCLUDED.evidence, note = EXCLUDED.note`,
            [sessionId, qid, c.id, c.score, c.evidence, c.note],
          );
        }
        await q(
          `INSERT INTO interview_reports (session_id, question_id, score, feedback, outline) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (session_id, question_id) DO NOTHING`,
          [sessionId, qid, answerScore(grade.criteria.map((c) => ({ criterion: c.id, score: c.score }))), grade.feedback, grade.outline],
        );
        await repair(question, grade, mastered);
      } catch (error) {
        console.error("Interview scoring:", error);
        failures.push(qid);
      }
    }),
  );
  if (failures.length) return { ok: false, error: "Parton could not score every answer. Try again in a minute." };
  await q("UPDATE interview_sessions SET status = 'done' WHERE id = $1", [sessionId]);
  return { ok: true };
}

/**
 * Weak criteria on mastered lessons bring two of each lesson's review cards due now, and leave Parton a note of
 * what went wrong, so Review and later lessons lean on it. Lessons not yet mastered are queued through guidance.
 */
async function repair(question: InterviewQuestion, grade: GradeOutput, mastered: ReadonlySet<string>): Promise<void> {
  for (const c of grade.criteria) {
    if (c.score > WEAK) continue;
    const criterion = question.rubric.find((r) => r.id === c.id);
    for (const lessonId of criterion?.lessons ?? []) {
      if (!mastered.has(lessonId)) continue;
      await query(
        `UPDATE review_cards SET due = now() WHERE exercise_id IN (
           SELECT exercise_id FROM review_cards WHERE lesson_id = $1 AND due > now() ORDER BY due LIMIT 2)`,
        [lessonId],
      ).catch((error) => console.error("Interview repair (review):", error));
      await query("INSERT INTO parton_notes (lesson_id, kind, body) VALUES ($1, 'misconception', $2)", [
        lessonId, `From a mock interview (${criterion!.text.replace(/\.$/, "").toLowerCase()}): ${c.note}`.slice(0, 1000),
      ]).catch((error) => console.error("Interview repair (note):", error));
    }
  }
}

export type Report = {
  questionId: string;
  score: number;
  feedback: string;
  outline: string;
  criteria: { id: string; text: string; score: number; evidence: string; note: string; lessons: { id: string; title: string }[] }[];
};

export async function reportsFor(sessionId: number): Promise<Report[]> {
  const [reports, grades] = await Promise.all([
    q<{ question_id: string; score: number; feedback: string; outline: string }>("SELECT question_id, score, feedback, outline FROM interview_reports WHERE session_id = $1", [sessionId]),
    q<{ question_id: string; criterion: string; score: number; evidence: string; note: string }>("SELECT question_id, criterion, score, evidence, note FROM interview_grades WHERE session_id = $1", [sessionId]),
  ]);
  const out: Report[] = [];
  for (const r of reports) {
    const question = await getQuestion(r.question_id);
    out.push({
      questionId: r.question_id,
      score: Number(r.score),
      feedback: r.feedback,
      outline: r.outline,
      criteria: (question?.rubric ?? []).map((c) => {
        const g = grades.find((x) => x.question_id === r.question_id && x.criterion === c.id);
        return { id: c.id, text: c.text, score: g ? Number(g.score) : 0, evidence: g?.evidence ?? "", note: g?.note ?? "", lessons: c.lessons.map((id) => ({ id, title: title(id) })) };
      }),
    });
  }
  return out;
}

/** Every scored answer to a question, newest first, for looking back. */
export async function historyFor(questionId: string): Promise<{ sessionId: number; at: string; score: number }[]> {
  const rows = await q<{ session_id: number; at: unknown; score: number }>(
    "SELECT session_id, at, score FROM interview_reports WHERE question_id = $1 ORDER BY at DESC",
    [questionId],
  );
  return rows.map((r) => ({ sessionId: Number(r.session_id), at: iso(r.at), score: Number(r.score) }));
}

/** Mean score of each finished session, for the history list. */
export async function sessionScores(): Promise<Map<number, number>> {
  const rows = await q<{ session_id: number; score: number }>("SELECT session_id, avg(score)::float AS score FROM interview_reports GROUP BY session_id");
  return new Map(rows.map((r) => [Number(r.session_id), Number(r.score)]));
}

export async function abandon(sessionId: number): Promise<void> {
  await q("UPDATE interview_sessions SET status = 'abandoned', finished_at = now() WHERE id = $1 AND status = 'open'", [sessionId]);
}
