import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { query } from "@/lib/db";
import { EXERCISES, GRAPH, LESSON_BY_ID, exerciseId, type ExerciseRef } from "@/lib/curriculum";
import { PartonError, partonConnected, structured } from "./claude";
import { toPlainText } from "./plaintext";
import { parseCodeSubmission } from "@/lib/check";
import {
  CHECK_SCHEMA,
  CHECK_SYSTEM,
  HINT_RULES,
  HINT_SCHEMA,
  RUNGS,
  OVER_TO_YOU,
  OVER_TO_YOU_RUNG,
  SOLUTION_RUNG,
  VOICE,
  describeAnswer,
  rungFor,
  solutionAllowed,
  type CheckOutput,
  type HintOutput,
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
  if (a.kind === "code") {
    lines.push(`The learner writes Python that runs in the browser and must pass these checks: ${a.tests.map((t) => t.name).join("; ")}.`);
    lines.push(`The editor starts with:\n${a.starter}`);
    if (a.setup) lines.push(`Before their code runs, this setup runs:\n${a.setup}`);
  }
  return lines.join("\n");
}

/** One past attempt as Parton reads it. Code attempts show the program and the checks that failed. */
function attemptText(ref: ExerciseRef, response: string): string {
  if (ref.exercise.answer.kind !== "code") return `"${response.slice(0, 600)}"`;
  const sub = parseCodeSubmission(response);
  if (!sub) return `"${response.slice(0, 1500)}"`;
  const failed = sub.results.filter((r) => !r.passed).map((r) => `${r.name}${r.message ? ` (${r.message})` : ""}`);
  return `program:\n${sub.source.slice(0, 1500)}\nfailed checks: ${failed.join("; ") || "none"}`;
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
  ].join("\n\n");
  briefs.set(lessonId, brief);
  return brief;
}

/** The answers the give-away check protects, leaving out a question whose worked solution is allowed. */
function protectedAnswers(lessonId: string, except: string | null = null): string {
  const lesson = LESSON_BY_ID.get(lessonId)!;
  return lesson.practice
    .filter((e) => exerciseId(lessonId, e.key) !== except)
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

async function note(lessonId: string, exercise: string | null, kind: "misconception", body: string) {
  const text = body.trim();
  if (!text) return;
  await query("INSERT INTO parton_notes (lesson_id, exercise_id, kind, body) VALUES ($1, $2, $3, $4)", [lessonId, exercise, kind, text.slice(0, 2000)]);
}

// ---------------------------------------------------------------------------------------------
// The give-away check. A separate pass that sees the answers and judges only the draft.

export async function guard(draft: string, answers: string, maxLevel: string, fallback = FALLBACK_HINT): Promise<string> {
  let reply = draft;
  if (!answers.trim()) return reply;
  for (let pass = 0; pass < 2; pass++) {
    const verdict = await structured<CheckOutput>({
      system: CHECK_SYSTEM,
      schema: CHECK_SCHEMA,
      effort: "low",
      maxTokens: 6000,
      messages: [{
        role: "user",
        content: `Protected answers:\n${answers}\n\nIf you rewrite, go no further than: ${maxLevel}\n\nDraft reply:\n<<<\n${reply}\n>>>`,
      }],
    });
    if (!verdict.gives_away) return reply;
    if (!verdict.safer_reply.trim()) break;
    reply = verdict.safer_reply;
  }
  return fallback;
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

/** What is in the learner's code editor when they ask, for code exercises. */
export type EditorSnapshot = { source: string; error: string | null; output: string };

export async function askParton(lessonId: string, exercise: string | null, message: string, editor: EditorSnapshot | null = null): Promise<AskResult> {
  if (!partonConnected()) return { ok: false, offline: true, error: "Parton is not connected yet." };
  const ref = exercise ? EXERCISES.get(exercise) : undefined;
  if (exercise && (!ref || ref.lessonId !== lessonId)) return { ok: false, error: "That question isn't part of this lesson." };

  const history = await query<MessageRow>(
    `SELECT id, role, body, rung, exercise_id FROM (
       SELECT * FROM parton_messages WHERE lesson_id = $1 ORDER BY at DESC, id DESC LIMIT ${HISTORY_TURNS}
     ) recent ORDER BY at, id`,
    [lessonId],
  );
  // How far Parton has already nudged on this question. Over-to-you replies (rung 0) do not count.
  const highestRung = ref
    ? (await query<{ n: number }>("SELECT coalesce(max(rung), 0)::int AS n FROM parton_messages WHERE exercise_id = $1 AND role = 'parton'", [ref.id]))[0].n
    : 0;
  const rung = ref ? rungFor(highestRung) : 2;
  const mayGiveSolution = ref ? solutionAllowed(highestRung) : false;

  const context: string[] = [];
  if (ref) {
    const solved = Boolean((await query<{ solved: boolean }>("SELECT solved FROM exercise_state WHERE exercise_id = $1", [ref.id]))[0]?.solved);
    const attempts = await query<{ response: string; correct: boolean }>(
      "SELECT response, correct FROM attempt_log WHERE exercise_id = $1 ORDER BY at DESC LIMIT 5",
      [ref.id],
    );
    context.push(`The learner is asking about ${exerciseLabel(ref)}.`);
    context.push(solved ? "They have already solved it; they may want to understand it better." : "They have not solved it yet.");
    if (attempts.length) {
      context.push(`Their recent attempts, newest first:\n${attempts.map((a) => `- ${attemptText(ref, a.response)} (${a.correct ? "correct" : "not correct"})`).join("\n")}`);
      const misses = attempts.filter((a) => !a.correct).length;
      if (misses >= 3) context.push("They have missed it several times. Look for the misunderstanding behind the wrong answers, and name it in your notes.");
    }
    if (editor && ref.exercise.answer.kind === "code") {
      context.push(`Their code in the editor right now:\n<<<\n${editor.source}\n>>>`);
      if (editor.error) context.push(`Their last run stopped with this error:\n${editor.error}`);
      else if (editor.output) context.push(`Their last run printed:\n${editor.output}`);
      context.push(mayGiveSolution
        ? "If you nudge, point to a line of their code and ask a question about it. Write corrected code only as part of a worked solution, if you give one."
        : "If you nudge, point to a line of their code and ask a question about it. Do not write the corrected code for them.");
    }
    context.push(`First judge whether the learner can solve this question on their own.`);
    context.push(`If they can: ${OVER_TO_YOU}`);
    context.push(`If they cannot: nudge them towards the solution with a hint. Allowed level: ${RUNGS[rung - 1]} Go no further than this level.`);
    if (mayGiveSolution) {
      context.push(`Every rung of the hint ladder has already been given on this question, so a worked solution is now allowed. Still prefer a hint: give the solution only if you judge another hint will not be enough. The reference answer, for a solution only (never let it leak into a hint):\n${describeAnswer(ref.exercise.answer)}`);
    } else {
      context.push("A worked solution is not allowed yet for this question: not every rung of the hint ladder has been given.");
    }
  } else {
    context.push("The learner is asking a general question, not tied to one practice question. If it does touch a practice question, judge whether they can solve it on their own: if they can, do not nudge them towards the solution; if they cannot, give at most a rung 2 hint.");
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
    const solution = Boolean(ref && mayGiveSolution && draft.gives_solution && !draft.learner_can_solve);
    const overToYou = Boolean(ref && draft.learner_can_solve);
    const storedRung = solution ? SOLUTION_RUNG : overToYou ? OVER_TO_YOU_RUNG : rung;
    const reply = await guard(draft.reply, protectedAnswers(lessonId, solution ? ref!.id : null), overToYou ? OVER_TO_YOU : RUNGS[rung - 1]);
    const q = await query<MessageRow>(
      "INSERT INTO parton_messages (lesson_id, exercise_id, role, body) VALUES ($1, $2, 'user', $3) RETURNING id, role, body, rung, exercise_id",
      [lessonId, ref?.id ?? null, message],
    );
    const r = await query<MessageRow>(
      "INSERT INTO parton_messages (lesson_id, exercise_id, role, body, rung) VALUES ($1, $2, 'parton', $3, $4) RETURNING id, role, body, rung, exercise_id",
      [lessonId, ref?.id ?? null, reply, ref ? storedRung : null],
    );
    await note(lessonId, ref?.id ?? null, "misconception", draft.misconception);
    return { ok: true, question: toMessage(q[0]), reply: toMessage(r[0]) };
  } catch (error) {
    if (error instanceof PartonError) return { ok: false, error: error.message };
    throw error;
  }
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
