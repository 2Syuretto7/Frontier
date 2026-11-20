import "server-only";
import { query } from "./db";
import { EXERCISES, GRAPH, LESSON_BY_ID } from "./curriculum";
import { checkAnswer, type CheckResult } from "./check";
import { PartonError, partonConnected, structured } from "./parton/claude";
import { toPlainText } from "./parton/plaintext";
import {
  RECALL_COUNT,
  RECALL_SCHEMA,
  RECALL_SYSTEM,
  acceptRecall,
  recallRequest,
  type RecallAnswer,
  type RecallDraft,
  type RecallOutput,
  type RecallSource,
} from "./parton/recall";

/** A set stays on the page for one sitting: until each question is tried, or for two hours. */
const SITTING_HOURS = 2;
const SOURCE_CHARS = 12000;
const ASKED_SHOWN = 150;

export const RECALL_PREFIX = "recall:";

type Purpose = "recall";

export type RecallItem = { id: string; prompt: string; sourceTitle: string; sourceCourse: string; answer: RecallAnswer };
export type RecallSet = { questions: RecallItem[]; error?: string };

type Row = { id: number; source_lesson_id: string; prompt: string; answer: RecallAnswer };

/** The mastered lessons this one requires, revisits or applies: what recall draws on. */
export function recallSources(lessonId: string, mastered: Set<string>): string[] {
  return [
    ...new Set(
      GRAPH.edges
        .filter((e) => e.to === lessonId && (e.kind === "requires" || e.kind === "revisits" || e.kind === "applies"))
        .map((e) => e.from)
        .filter((id) => mastered.has(id) && LESSON_BY_ID.has(id)),
    ),
  ];
}

const toItem = (r: Row): RecallItem => ({
  id: `${RECALL_PREFIX}${r.id}`,
  prompt: r.prompt,
  sourceTitle: GRAPH.nodes.get(r.source_lesson_id)?.title ?? r.source_lesson_id,
  sourceCourse: GRAPH.nodes.get(r.source_lesson_id)?.course ?? "",
  answer: r.answer,
});

/** The questions of the current sitting that have not been tried yet. */
async function openSet(purpose: Purpose, lessonId: string | null): Promise<Row[]> {
  return query<Row>(
    `SELECT id, source_lesson_id, prompt, answer FROM recall_questions
     WHERE purpose = $1 AND ($2::text IS NULL OR lesson_id = $2) AND attempts = 0 AND NOT retired
       AND created_at > now() - make_interval(hours => $3)
     ORDER BY id`,
    [purpose, lessonId, SITTING_HOURS],
  );
}

const PARTON_MISSING = "are written by Parton, who is not connected yet.";

/** Runs a generation, turning Parton's failures into a message for the page. */
async function generate(kind: string, write: () => Promise<Row[]>): Promise<RecallSet> {
  if (!partonConnected()) return { questions: [], error: `Fresh ${kind} questions ${PARTON_MISSING}` };
  try {
    const rows = await write();
    if (rows.length === 0) return { questions: [], error: `Parton couldn't write new ${kind} questions this time. Reload the page to try again.` };
    return { questions: rows.map(toItem) };
  } catch (error) {
    if (error instanceof PartonError) return { questions: [], error: `${error.message} Reload the page to try again.` };
    throw error;
  }
}

async function save(purpose: Purpose, lessonId: string | null, drafts: RecallDraft[]): Promise<Row[]> {
  const saved: Row[] = [];
  for (const d of drafts) {
    const rows = await query<Row>(
      `INSERT INTO recall_questions (lesson_id, source_lesson_id, prompt, answer, purpose, card_exercise_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, source_lesson_id, prompt, answer`,
      [lessonId ?? d.sourceLessonId, d.sourceLessonId, d.prompt, JSON.stringify(d.answer), purpose, null],
    );
    saved.push(rows[0]);
  }
  return saved;
}

/**
 * The recall questions for this visit to a lesson. Each sitting gets questions Parton has just written;
 * a question is never shown again once it has been tried, and never repeats an earlier recall or review
 * question or a practice question from the lesson it recalls.
 */
export async function recallFor(lessonId: string, mastered: Set<string>): Promise<RecallSet> {
  const sourceIds = recallSources(lessonId, mastered);
  if (sourceIds.length === 0) return { questions: [] };
  const open = await openSet("recall", lessonId);
  if (open.length > 0) return { questions: open.map(toItem) };
  const lessonTitle = GRAPH.nodes.get(lessonId)?.title ?? lessonId;
  return generate("recall", async () =>
    save("recall", lessonId, await writeQuestions({ sourceIds, count: RECALL_COUNT, request: { lessonTitle } })),
  );
}

async function writeQuestions({
  sourceIds,
  count,
  request,
}: {
  sourceIds: string[];
  count: number;
  request: { lessonTitle?: string };
}): Promise<RecallDraft[]> {
  const sources: RecallSource[] = sourceIds.map((id) => {
    const lesson = LESSON_BY_ID.get(id)!;
    const text = [lesson.puzzle, lesson.intuition, lesson.theory].map(toPlainText).join("\n\n");
    return {
      id,
      title: GRAPH.nodes.get(id)?.title ?? id,
      text: text.length > SOURCE_CHARS ? `${text.slice(0, SOURCE_CHARS)}\n[…]` : text,
      practice: lesson.practice.map((e) => toPlainText(e.prompt)),
    };
  });

  const [askedRows, missedRecall, missedPractice, notes] = await Promise.all([
    query<{ prompt: string }>("SELECT prompt FROM recall_questions WHERE source_lesson_id = ANY($1) ORDER BY id DESC", [sourceIds]),
    query<{ prompt: string }>(
      "SELECT prompt FROM recall_questions WHERE source_lesson_id = ANY($1) AND attempts > 0 AND NOT solved ORDER BY id DESC LIMIT 6",
      [sourceIds],
    ),
    query<{ exercise_id: string }>(
      `SELECT exercise_id FROM attempt_log WHERE split_part(exercise_id, ':', 1) = ANY($1) AND NOT correct
       GROUP BY exercise_id HAVING count(*) >= 2 ORDER BY max(at) DESC LIMIT 6`,
      [sourceIds],
    ),
    query<{ body: string }>(
      "SELECT body FROM parton_notes WHERE kind = 'misconception' AND lesson_id = ANY($1) ORDER BY at DESC LIMIT 6",
      [sourceIds],
    ),
  ]);
  const asked = askedRows.map((r) => r.prompt);
  const hard = [
    ...missedRecall.map((r) => `Missed in an earlier recall or review: ${r.prompt}`),
    ...missedPractice.flatMap((r) => {
      const ref = EXERCISES.get(r.exercise_id);
      return ref ? [`Missed more than once in practice: ${toPlainText(ref.exercise.prompt)}`] : [];
    }),
    ...notes.map((n) => `Misconception Parton noted: ${n.body}`),
  ];

  const kept: RecallDraft[] = [];
  // Two tries at most: questions that repeat anything, or whose answer key fails its own check, are dropped.
  for (let round = 0; round < 2 && kept.length < count; round++) {
    const seen = [...asked, ...kept.map((k) => k.prompt)];
    const want = count - kept.length;
    const output = await structured<RecallOutput>({
      system: RECALL_SYSTEM,
      messages: [{ role: "user", content: recallRequest({ ...request, sources, asked: seen.slice(0, ASKED_SHOWN), hard, count: want }) }],
      schema: RECALL_SCHEMA,
      effort: "medium",
    });
    kept.push(...acceptRecall(output, { sources, asked: seen, count: want }));
  }
  return kept;
}

/** Checks an answer to a recall question and records it. */
export async function recallAttempt(id: string, input: string, context: Purpose): Promise<CheckResult> {
  const n = Number(id.slice(RECALL_PREFIX.length));
  if (!Number.isInteger(n)) return { correct: false, message: "Unknown question." };
  const rows = await query<{ answer: RecallAnswer; purpose: string }>("SELECT answer, purpose FROM recall_questions WHERE id = $1", [n]);
  if (!rows[0] || rows[0].purpose !== context) return { correct: false, message: "Unknown question." };
  const result = checkAnswer(rows[0].answer, input);
  if (result.message && !result.correct) return result;
  await query("UPDATE recall_questions SET attempts = attempts + 1, solved = solved OR $2 WHERE id = $1", [n, result.correct]);
  await query("INSERT INTO attempt_log (exercise_id, response, correct, context) VALUES ($1, $2, $3, $4)", [id, input.slice(0, 4000), result.correct, context]);
  return { correct: result.correct, message: result.message };
}
