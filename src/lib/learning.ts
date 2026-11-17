import "server-only";
import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { query } from "./db";
import { EXERCISES, GRAPH, LESSON_BY_ID, exerciseId, masteryExercises, reviewable } from "./curriculum";
import { checkAnswer, type CheckResult } from "./check";
import { frontier } from "./graph";
import { chooseNextStep, type LearnStep } from "./scheduler";
import type { Track } from "./types";
import { RECALL_PREFIX, recallAttempt } from "./recall";

const scheduler = fsrs({ enable_fuzz: true, request_retention: 0.9 });
const TZ = "Asia/Kolkata";
export const MASTERY_THRESHOLD = 0.8;
export const REVIEW_SESSION_SIZE = 12;

type ProgressRow = { lesson_id: string; status: string; mastery: number };

export async function loadProgress() {
  return query<ProgressRow>("SELECT lesson_id, status, mastery FROM progress");
}

export async function getPace(): Promise<number> {
  const rows = await query<{ value: number }>("SELECT value FROM settings WHERE key = 'pace'");
  return rows[0]?.value ?? 2;
}

export async function setPace(pace: number) {
  await query(
    "INSERT INTO settings (key, value) VALUES ('pace', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(pace)],
  );
}

export async function dueReviewCount(): Promise<number> {
  const rows = await query<{ n: number }>("SELECT count(*)::int AS n FROM review_cards WHERE due <= now()");
  return rows[0]?.n ?? 0;
}

export async function nextStep(): Promise<LearnStep> {
  const [progress, due, pace, today, last] = await Promise.all([
    loadProgress(),
    dueReviewCount(),
    getPace(),
    query<{ n: number }>(
      `SELECT count(*)::int AS n FROM progress WHERE (started_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date`,
    ),
    query<{ lesson_id: string }>("SELECT lesson_id FROM progress ORDER BY started_at DESC LIMIT 1"),
  ]);
  const mastered = new Set(progress.filter((p) => p.status === "mastered").map((p) => p.lesson_id));
  const open = await query<{ lesson_id: string }>(
    "SELECT lesson_id FROM progress WHERE status = 'in_progress' ORDER BY updated_at DESC LIMIT 1",
  );
  const openNode = open[0] ? GRAPH.nodes.get(open[0].lesson_id) ?? null : null;
  const lastTrack: Track | null = last[0] ? GRAPH.nodes.get(last[0].lesson_id)?.track ?? null : null;
  return chooseNextStep({
    openLesson: openNode && LESSON_BY_ID.has(openNode.id) ? openNode : null,
    dueReviews: due,
    frontier: frontier(GRAPH, mastered),
    lastTrack,
    newLessonsToday: today[0]?.n ?? 0,
    pace,
  });
}

export async function masteredSet(): Promise<Set<string>> {
  const rows = await query<{ lesson_id: string }>("SELECT lesson_id FROM progress WHERE status = 'mastered'");
  return new Set(rows.map((r) => r.lesson_id));
}

export async function startLesson(lessonId: string) {
  await query(
    `INSERT INTO progress (lesson_id, status) VALUES ($1, 'in_progress')
     ON CONFLICT (lesson_id) DO UPDATE SET updated_at = now()`,
    [lessonId],
  );
}

export type ExerciseStateRow = {
  exercise_id: string;
  attempts: number;
  solved: boolean;
  response: string | null;
};

export async function exerciseStates(lessonIds: string[]): Promise<Map<string, ExerciseStateRow>> {
  if (lessonIds.length === 0) return new Map();
  const rows = await query<ExerciseStateRow>(
    "SELECT exercise_id, attempts, solved, response FROM exercise_state WHERE lesson_id = ANY($1)",
    [lessonIds],
  );
  return new Map(rows.map((r) => [r.exercise_id, r]));
}

export type Context = "lesson" | "recall" | "review";

export type AttemptResult = CheckResult & { lessonMastered?: boolean };

/**
 * Checks an answer, records it, and updates mastery and the review schedule.
 * In review, the first attempt of the session decides the review rating.
 */
export async function attempt(id: string, input: string, context: Context, attemptInSession: number): Promise<AttemptResult> {
  // Recall questions are written fresh by Parton, so they live in their own table rather than the curriculum.
  if (id.startsWith(RECALL_PREFIX)) return context === "recall" ? recallAttempt(id, input) : { correct: false, message: "Unknown exercise." };
  const ref = EXERCISES.get(id);
  if (!ref) return { correct: false, message: "Unknown exercise." };
  const result = checkAnswer(ref.exercise.answer, input);
  if (result.message && !result.correct) return result;
  const correct = result.correct;

  await query(
    `INSERT INTO exercise_state (exercise_id, lesson_id, attempts, solved, first_try, response)
     VALUES ($1, $2, 1, $3, $3, $4)
     ON CONFLICT (exercise_id) DO UPDATE SET
       attempts = exercise_state.attempts + 1,
       solved = exercise_state.solved OR EXCLUDED.solved,
       response = EXCLUDED.response,
       updated_at = now()`,
    [id, ref.lessonId, correct, input],
  );
  await query("INSERT INTO attempt_log (exercise_id, response, correct, context) VALUES ($1, $2, $3, $4)", [id, input.slice(0, ref.exercise.answer.kind === "code" ? 20000 : 4000), correct, context]);

  if (context !== "lesson" && attemptInSession === 1) {
    await rateCard(id, correct ? Rating.Good : Rating.Again);
  }

  const lessonMastered = context === "lesson" ? await evaluateMastery(ref.lessonId) : undefined;
  return { correct, message: result.message, lessonMastered };
}

async function rateCard(id: string, rating: Rating.Again | Rating.Good) {
  const rows = await query<{ card: Card }>("SELECT card FROM review_cards WHERE exercise_id = $1", [id]);
  if (!rows[0]) return;
  const stored = rows[0].card;
  const card: Card = { ...stored, due: new Date(stored.due), last_review: stored.last_review ? new Date(stored.last_review) : undefined };
  const next = scheduler.next(card, new Date(), rating).card;
  await query("UPDATE review_cards SET card = $2, due = $3 WHERE exercise_id = $1", [id, JSON.stringify(next), next.due.toISOString()]);
}

export type MasteryReport = { score: number; mastered: boolean };

export async function masteryReport(lessonId: string): Promise<MasteryReport> {
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const required = masteryExercises(lesson);
  const states = await exerciseStates([lessonId]);
  const solved = required.filter((e) => states.get(exerciseId(lessonId, e.key))?.solved).length;
  const score = required.length ? solved / required.length : 1;
  return { score, mastered: score >= MASTERY_THRESHOLD };
}

/**
 * A lesson is mastered when at least 80% of its check and apply exercises are solved.
 */
export async function evaluateMastery(lessonId: string): Promise<boolean> {
  const report = await masteryReport(lessonId);
  await query("UPDATE progress SET mastery = $2, updated_at = now() WHERE lesson_id = $1", [lessonId, report.score]);
  if (!report.mastered) return false;
  const changed = await query(
    "UPDATE progress SET status = 'mastered' WHERE lesson_id = $1 AND status <> 'mastered' RETURNING lesson_id",
    [lessonId],
  );
  if (changed.length > 0) {
    const now = new Date();
    const struggled = await struggledWith(lessonId);
    for (const e of reviewable(LESSON_BY_ID.get(lessonId)!)) {
      // Practice counts as the first successful review; the first spaced review comes a day later.
      // Repair: a question missed three or more times comes back sooner, after twelve hours.
      const id = exerciseId(lessonId, e.key);
      const hard = struggled.has(id);
      const card = scheduler.next(createEmptyCard(now), now, hard ? Rating.Hard : Rating.Good).card;
      card.due = new Date(now.getTime() + (hard ? 12 : 24) * 60 * 60 * 1000);
      await query(
        "INSERT INTO review_cards (exercise_id, lesson_id, card, due) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
        [id, lessonId, JSON.stringify(card), card.due.toISOString()],
      );
    }
  }
  return true;
}

/** Exercises in these lessons that the learner has missed at least `misses` times. */
async function struggledWith(lessonId: string, misses = 3): Promise<Set<string>> {
  const rows = await query<{ exercise_id: string }>(
    `SELECT exercise_id FROM attempt_log WHERE exercise_id LIKE $1 AND NOT correct
     GROUP BY exercise_id HAVING count(*) >= $2`,
    [`${lessonId}:%`, misses],
  );
  return new Set(rows.map((r) => r.exercise_id));
}

/** Due review questions, mixed across lessons so related ideas interleave. */
export async function dueReviews(limit = REVIEW_SESSION_SIZE) {
  const rows = await query<{ exercise_id: string }>(
    "SELECT exercise_id FROM review_cards WHERE due <= now() ORDER BY due LIMIT $1",
    [limit],
  );
  const refs = rows.map((r) => EXERCISES.get(r.exercise_id)).filter((r) => r !== undefined);
  // Interleave: alternate lessons rather than grouping one lesson's questions together.
  return refs.sort((a, b) => hash(a.id) - hash(b.id));
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export async function overallStats() {
  const progress = await loadProgress();
  return {
    mastered: progress.filter((p) => p.status === "mastered").length,
    started: progress.length,
  };
}
