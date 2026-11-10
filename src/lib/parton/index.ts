import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { query } from "@/lib/db";
import { EXERCISES, GRAPH, LESSON_BY_ID, exerciseId, type ExerciseRef } from "@/lib/curriculum";
import { PartonError, partonConnected, structured } from "./claude";
import { toPlainText } from "./plaintext";
import {
  CHECK_SCHEMA,
  CHECK_SYSTEM,
  HINT_RULES,
  HINT_SCHEMA,
  MARK_RULES,
  MARK_SCHEMA,
  RUNGS,
  TEACHBACK_RULES,
  TEACHBACK_SCHEMA,
  VOICE,
  describeAnswer,
  rungFor,
  type CheckOutput,
  type HintOutput,
  type MarkOutput,
  type TeachBackOutput,
} from "./prompts";
import { renderParton } from "./render";

export { PartonError, partonConnected };

const HISTORY_TURNS = 16;
const FALLBACK_HINT =
  "Let's slow down. Which definition or rule in the theory section does this question lean on? Write it out in your own words first, then try the question again.";

// ---------------------------------------------------------------------------------------------
// What Parton knows about a lesson. Built once per lesson per server process; never includes answers.

const briefs = new Map<string, string>();

export function exerciseLabel(ref: ExerciseRef): string {
  const lesson = LESSON_BY_ID.get(ref.lessonId)!;
  const n = lesson.practice.findIndex((e) => e.key === ref.exercise.key) + 1;
  return `practice question ${n}`;
}

function exerciseText(ref: ExerciseRef): string {
  const a = ref.exercise.answer;
  const lines = [`${capitalise(exerciseLabel(ref))} (${ref.exercise.rung}): ${toPlainText(ref.exercise.prompt)}`];
  if (a.kind === "choice") lines.push(`Options: ${a.options.map((o, i) => `(${String.fromCharCode(97 + i)}) ${o}`).join("; ")}`);
  if (a.kind === "expression") lines.push(`The answer is an expression in ${a.variables.join(", ")}.`);
  if (a.kind === "written") lines.push("The learner writes a full proof or argument.");
  return lines.join("\n");
}

export function lessonBrief(lessonId: string): string {
  const cached = briefs.get(lessonId);
  if (cached) return cached;
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const node = GRAPH.nodes.get(lessonId)!;
  const buildsOn = GRAPH.edges
    .filter((e) => e.to === lessonId && e.kind !== "foreshadows")
    .map((e) => GRAPH.nodes.get(e.from)!)
    .map((n) => `- ${n.title} (${n.course} ${n.courseTitle})`);
  const practice = lesson.practice.map((e) => exerciseText(EXERCISES.get(exerciseId(lessonId, e.key))!));
  const brief = [
    `# The lesson the learner is studying`,
    `"${node.title}", in ${node.course} ${node.courseTitle}, chapter ${node.chapter} (${node.chapterTitle}). Track: ${node.track}.`,
    buildsOn.length ? `It builds on these earlier lessons, which you may point back to:\n${buildsOn.join("\n")}` : "It is one of the first lessons; it builds on nothing earlier.",
    `## Puzzle\n${toPlainText(lesson.puzzle)}`,
    `## Intuition\n${toPlainText(lesson.intuition)}`,
    `## Theory\n${toPlainText(lesson.theory)}`,
    `## Practice questions (answers are deliberately not shown to you)\n${practice.join("\n\n")}`,
    `## Teach-back prompt\n${lesson.teachBack}`,
  ].join("\n\n");
  briefs.set(lessonId, brief);
  return brief;
}

function protectedAnswers(lessonId: string): string {
  const lesson = LESSON_BY_ID.get(lessonId)!;
  return lesson.practice
    .map((e) => {
      const ref = EXERCISES.get(exerciseId(lessonId, e.key))!;
      return `${exerciseText(ref)}\nProtected answer: ${describeAnswer(e.answer)}`;
    })
    .join("\n\n");
}

/** Misconceptions Parton has noted in this lesson and in the lessons it builds on. */
async function notesFor(lessonId: string): Promise<string[]> {
  const related = [lessonId, ...GRAPH.edges.filter((e) => e.to === lessonId && e.kind !== "foreshadows").map((e) => e.from)];
  const rows = await query<{ lesson_id: string; body: string }>(
    "SELECT lesson_id, body FROM parton_notes WHERE kind = 'misconception' AND lesson_id = ANY($1) ORDER BY at DESC LIMIT 8",
    [related],
  );
  return rows.map((r) => (r.lesson_id === lessonId ? r.body : `${r.body} (in "${GRAPH.nodes.get(r.lesson_id)?.title ?? r.lesson_id}")`));
}

async function note(lessonId: string, exercise: string | null, kind: "misconception" | "teachback", body: string) {
  const text = body.trim();
  if (!text) return;
  await query("INSERT INTO parton_notes (lesson_id, exercise_id, kind, body) VALUES ($1, $2, $3, $4)", [lessonId, exercise, kind, text.slice(0, 2000)]);
}

// ---------------------------------------------------------------------------------------------
// The give-away check. A separate pass that sees the answers and judges only the draft.

async function guard(draft: string, answers: string, maxRung: number): Promise<string> {
  let reply = draft;
  for (let pass = 0; pass < 2; pass++) {
    const verdict = await structured<CheckOutput>({
      system: CHECK_SYSTEM,
      schema: CHECK_SCHEMA,
      effort: "low",
      maxTokens: 6000,
      messages: [{
        role: "user",
        content: `Protected answers:\n${answers}\n\nIf you rewrite, go no further than: ${RUNGS[maxRung - 1]}\n\nDraft reply:\n<<<\n${reply}\n>>>`,
      }],
    });
    if (!verdict.gives_away) return reply;
    if (!verdict.safer_reply.trim()) break;
    reply = verdict.safer_reply;
  }
  return FALLBACK_HINT;
}

// ---------------------------------------------------------------------------------------------
// Conversation

export type PartonMessage = { id: number; role: "user" | "parton"; html: string; rung: number | null; exerciseLabel: string | null };

type MessageRow = { id: number; role: "user" | "parton"; body: string; rung: number | null; exercise_id: string | null };

function toMessage(r: MessageRow): PartonMessage {
  const ref = r.exercise_id ? EXERCISES.get(r.exercise_id) : undefined;
  const html = renderParton(r.body);
  return { id: r.id, role: r.role, html, rung: r.rung, exerciseLabel: ref ? capitalise(exerciseLabel(ref)) : null };
}

export async function conversation(lessonId: string): Promise<PartonMessage[]> {
  const rows = await query<MessageRow>(
    "SELECT id, role, body, rung, exercise_id FROM parton_messages WHERE lesson_id = $1 ORDER BY at, id",
    [lessonId],
  );
  return rows.map(toMessage);
}

export type AskResult = { ok: true; question: PartonMessage; reply: PartonMessage } | { ok: false; error: string; offline?: boolean };

export async function askParton(lessonId: string, exercise: string | null, message: string): Promise<AskResult> {
  if (!partonConnected()) return { ok: false, offline: true, error: "Parton is not connected yet." };
  const ref = exercise ? EXERCISES.get(exercise) : undefined;
  if (exercise && (!ref || ref.lessonId !== lessonId)) return { ok: false, error: "That question isn't part of this lesson." };

  const history = await query<MessageRow>(
    `SELECT id, role, body, rung, exercise_id FROM (
       SELECT * FROM parton_messages WHERE lesson_id = $1 ORDER BY at DESC, id DESC LIMIT ${HISTORY_TURNS}
     ) recent ORDER BY at, id`,
    [lessonId],
  );
  const previousHints = ref
    ? (await query<{ n: number }>("SELECT count(*)::int AS n FROM parton_messages WHERE exercise_id = $1 AND role = 'parton'", [ref.id]))[0].n
    : 0;
  const rung = ref ? rungFor(previousHints) : 2;

  const context: string[] = [];
  if (ref) {
    const state = (await query<{ solved: boolean }>("SELECT solved FROM exercise_state WHERE exercise_id = $1", [ref.id]))[0];
    const attempts = await query<{ response: string; correct: boolean }>(
      "SELECT response, correct FROM attempt_log WHERE exercise_id = $1 ORDER BY at DESC LIMIT 5",
      [ref.id],
    );
    context.push(`The learner is asking about ${exerciseLabel(ref)}.`);
    context.push(state?.solved ? "They have already solved it; they may want to understand it better. Still do not state the answer." : "They have not solved it yet.");
    if (attempts.length) {
      context.push(`Their recent attempts, newest first:\n${attempts.map((a) => `- "${a.response.slice(0, 600)}" (${a.correct ? "correct" : "not correct"})`).join("\n")}`);
      const misses = attempts.filter((a) => !a.correct).length;
      if (misses >= 3) context.push("They have missed it several times. Look for the misunderstanding behind the wrong answers, and name it in your notes.");
    }
    context.push(`This is hint number ${previousHints + 1} on this question. Allowed level: ${RUNGS[rung - 1]} Go no further than this level.`);
  } else {
    context.push("The learner is asking a general question, not tied to one practice question. If it does touch a practice question, give at most a rung 2 hint.");
  }
  const notes = await notesFor(lessonId);
  if (notes.length) context.push(`Your earlier notes on this learner's misunderstandings (revisit them if relevant):\n${notes.map((n) => `- ${n}`).join("\n")}`);

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((h) => ({
    role: h.role === "user" ? "user" : "assistant",
    content: h.body,
  }));
  messages.push({ role: "user", content: `[Context for Parton, not written by the learner]\n${context.join("\n")}\n\n[The learner writes]\n${message}` });
  if (messages[0].role !== "user") messages.shift();

  try {
    const draft = await structured<HintOutput>({
      system: `${VOICE}\n\n${HINT_RULES}\n\nThe hint ladder:\n${RUNGS.map((r) => `- ${r}`).join("\n")}\n\n${lessonBrief(lessonId)}`,
      schema: HINT_SCHEMA,
      effort: "medium",
      maxTokens: 12000,
      messages,
    });
    const reply = await guard(draft.reply, protectedAnswers(lessonId), rung);
    const q = await query<MessageRow>(
      "INSERT INTO parton_messages (lesson_id, exercise_id, role, body) VALUES ($1, $2, 'user', $3) RETURNING id, role, body, rung, exercise_id",
      [lessonId, ref?.id ?? null, message],
    );
    const r = await query<MessageRow>(
      "INSERT INTO parton_messages (lesson_id, exercise_id, role, body, rung) VALUES ($1, $2, 'parton', $3, $4) RETURNING id, role, body, rung, exercise_id",
      [lessonId, ref?.id ?? null, reply, ref ? rung : null],
    );
    await note(lessonId, ref?.id ?? null, "misconception", draft.misconception);
    return { ok: true, question: toMessage(q[0]), reply: toMessage(r[0]) };
  } catch (error) {
    if (error instanceof PartonError) return { ok: false, error: error.message };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------
// Marking written work

export type Marking = { accepted: boolean; feedback: string };

export async function markWritten(ref: ExerciseRef, response: string): Promise<Marking> {
  const answer = ref.exercise.answer;
  if (answer.kind !== "written") throw new Error("Only written answers are marked by Parton.");
  const out = await structured<MarkOutput>({
    system: `${VOICE}\n\n${MARK_RULES}\n\n${lessonBrief(ref.lessonId)}`,
    schema: MARK_SCHEMA,
    effort: "high",
    maxTokens: 16000,
    messages: [{
      role: "user",
      content: `${exerciseText(ref)}\n\nRubric:\n${answer.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nThe learner's answer:\n<<<\n${response}\n>>>`,
    }],
  });
  const accepted = out.criteria.length >= answer.rubric.length && out.criteria.every((c) => c.met);
  const feedback = accepted ? out.feedback : await guard(out.feedback, describeAnswer(answer), 3);
  await note(ref.lessonId, ref.id, "misconception", out.misconception);
  return { accepted, feedback };
}

// ---------------------------------------------------------------------------------------------
// Teach-back

export type TeachBackReview = { strength: string; questions: string[] };

export async function reviewTeachBack(lessonId: string, body: string): Promise<TeachBackReview> {
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const out = await structured<TeachBackOutput>({
    system: `${VOICE}\n\n${TEACHBACK_RULES}\n\n${lessonBrief(lessonId)}`,
    schema: TEACHBACK_SCHEMA,
    effort: "medium",
    maxTokens: 8000,
    messages: [{ role: "user", content: `The teach-back prompt was: ${lesson.teachBack}\n\nThe learner's explanation:\n<<<\n${body}\n>>>` }],
  });
  const review = { strength: out.strength.trim(), questions: out.questions.map((q) => q.trim()).filter(Boolean).slice(0, 1) };
  await note(lessonId, null, "teachback", JSON.stringify(review));
  await note(lessonId, null, "misconception", out.misconception);
  return review;
}

export async function latestTeachBackReview(lessonId: string): Promise<TeachBackReview | null> {
  const rows = await query<{ body: string }>(
    "SELECT body FROM parton_notes WHERE lesson_id = $1 AND kind = 'teachback' ORDER BY at DESC, id DESC LIMIT 1",
    [lessonId],
  );
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].body) as TeachBackReview;
  } catch {
    return null;
  }
}

/** Renders a teach-back review for the browser. */
export function renderReview(r: TeachBackReview) {
  return { strength: renderParton(r.strength), questions: r.questions.map(renderParton) };
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
