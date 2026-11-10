import "server-only";
import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { query } from "./db";
import { EXERCISES, GRAPH, LESSON_BY_ID, exerciseId, masteryExercises, reviewable } from "./curriculum";
import { checkAnswer, type CheckResult } from "./check";
import { frontier } from "./graph";
import { chooseNextStep, type LearnStep } from "./scheduler";
import type { Track } from "./types";
import { PartonError, markWritten, partonConnected } from "./parton";
import { renderParton } from "./parton/render";

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

export type Verdict = "accepted" | "revise" | "pending";
export type ExerciseStateRow = {
  exercise_id: string;
  attempts: number;
  solved: boolean;
  response: string | null;
  verdict: Verdict | null;
  feedback: string | null;
};

export async function exerciseStates(lessonIds: string[]): Promise<Map<string, ExerciseStateRow>> {
  if (lessonIds.length === 0) return new Map();
  const rows = await query<ExerciseStateRow>(
    "SELECT exercise_id, attempts, solved, response, verdict, feedback FROM exercise_state WHERE lesson_id = ANY($1)",
    [lessonIds],
  );
  return new Map(rows.map((r) => [r.exercise_id, r]));
}

export type Context = "lesson" | "recall" | "review";

export type AttemptResult = CheckResult & { lessonMastered?: boolean; verdict?: Verdict; feedbackHtml?: string };

/**
 * Checks an answer, records it, and updates mastery and the review schedule.
 * In recall and review, the first attempt of the session decides the review rating.
 * Written proofs and arguments are marked by Parton against the rubric when Parton is connected;
 * until then they are provisionally accepted on submission.
 */
export async function attempt(id: string, input: string, context: Context, attemptInSession: number): Promise<AttemptResult> {
  const ref = EXERCISES.get(id);
  if (!ref) return { correct: false, message: "Unknown exercise." };
  const written = ref.exercise.answer.kind === "written";
  if (written && context !== "lesson") return { correct: false, message: "Written work is marked inside its lesson." };
  const result = checkAnswer(ref.exercise.answer, input);
  if (result.message && !result.correct) return result;

  let correct = result.correct;
  let verdict: Verdict | null = null;
  let feedback: string | null = null;
  if (written) {
    if (partonConnected()) {
      try {
        const marking = await markWritten(ref, input);
        correct = marking.accepted;
        verdict = marking.accepted ? "accepted" : "revise";
        feedback = marking.feedback;
      } catch (error) {
        if (error instanceof PartonError) return { correct: false, message: `${error.message} Your answer is still in the box.` };
        throw error;
      }
    } else {
      correct = true;
      verdict = "pending";
    }
  }

  await query(
    `INSERT INTO exercise_state (exercise_id, lesson_id, attempts, solved, first_try, response, verdict, feedback)
     VALUES ($1, $2, 1, $3, $3, $4, $5, $6)
     ON CONFLICT (exercise_id) DO UPDATE SET
       attempts = exercise_state.attempts + 1,
       solved = exercise_state.solved OR EXCLUDED.solved,
       response = EXCLUDED.response,
       verdict = CASE WHEN exercise_state.verdict = 'accepted' AND EXCLUDED.verdict = 'revise' THEN 'accepted' ELSE EXCLUDED.verdict END,
       feedback = EXCLUDED.feedback,
       updated_at = now()`,
    [id, ref.lessonId, correct, input, verdict, feedback],
  );
  await query("INSERT INTO attempt_log (exercise_id, response, correct, context) VALUES ($1, $2, $3, $4)", [id, input.slice(0, 4000), correct, context]);
  if (written) {
    await query("INSERT INTO writings (lesson_id, kind, exercise_id, body) VALUES ($1, 'answer', $2, $3)", [ref.lessonId, id, input]);
  }

  if (context !== "lesson" && attemptInSession === 1) {
    await rateCard(id, correct ? Rating.Good : Rating.Again);
  }

  const lessonMastered = context === "lesson" ? await evaluateMastery(ref.lessonId) : undefined;
  return {
    correct,
    message: result.message,
    lessonMastered,
    verdict: verdict ?? undefined,
    feedbackHtml: feedback ? renderParton(feedback) : undefined,
  };
}

async function rateCard(id: string, rating: Rating.Again | Rating.Good) {
  const rows = await query<{ card: Card }>("SELECT card FROM review_cards WHERE exercise_id = $1", [id]);
  if (!rows[0]) return;
  const stored = rows[0].card;
  const card: Card = { ...stored, due: new Date(stored.due), last_review: stored.last_review ? new Date(stored.last_review) : undefined };
  const next = scheduler.next(card, new Date(), rating).card;
  await query("UPDATE review_cards SET card = $2, due = $3 WHERE exercise_id = $1", [id, JSON.stringify(next), next.due.toISOString()]);
}

export async function saveTeachBack(lessonId: string, body: string) {
  await query("INSERT INTO writings (lesson_id, kind, body) VALUES ($1, 'teachback', $2)", [lessonId, body]);
  return evaluateMastery(lessonId);
}

export async function latestTeachBack(lessonId: string): Promise<string | null> {
  const rows = await query<{ body: string }>(
    "SELECT body FROM writings WHERE lesson_id = $1 AND kind = 'teachback' ORDER BY at DESC LIMIT 1",
    [lessonId],
  );
  return rows[0]?.body ?? null;
}

export type MasteryReport = { score: number; writtenDone: boolean; teachBackDone: boolean; mastered: boolean };

export async function masteryReport(lessonId: string): Promise<MasteryReport> {
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const required = masteryExercises(lesson);
  const states = await exerciseStates([lessonId]);
  const auto = required.filter((e) => e.answer.kind !== "written");
  const written = required.filter((e) => e.answer.kind === "written");
  const solved = auto.filter((e) => states.get(exerciseId(lessonId, e.key))?.solved).length;
  const score = auto.length ? solved / auto.length : 1;
  const writtenDone = written.every((e) => states.get(exerciseId(lessonId, e.key))?.solved);
  const teachBackDone = (await latestTeachBack(lessonId)) !== null;
  return { score, writtenDone, teachBackDone, mastered: score >= MASTERY_THRESHOLD && writtenDone && teachBackDone };
}

/**
 * A lesson is mastered when at least 80% of its check, apply and prove exercises are solved,
 * every written proof or argument has been accepted by Parton (or provisionally accepted while
 * Parton is not connected), and the teach-back is written.
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

/**
 * Two or three recall questions from the lessons this one requires or revisits, if they have been mastered.
 * Repair comes first: questions the learner once struggled with are chosen before the rest.
 */
export async function recallFor(lessonId: string, mastered: Set<string>) {
  const sources = GRAPH.edges
    .filter((e) => e.to === lessonId && (e.kind === "requires" || e.kind === "revisits" || e.kind === "applies"))
    .map((e) => e.from)
    .filter((id) => mastered.has(id) && LESSON_BY_ID.has(id));
  const pool = sources.flatMap((id) => reviewable(LESSON_BY_ID.get(id)!).map((e) => EXERCISES.get(exerciseId(id, e.key))!));
  const struggled = new Set<string>();
  for (const id of sources) for (const x of await struggledWith(id, 2)) struggled.add(x);
  const rank = (r: { id: string }) => (struggled.has(r.id) ? 0 : 1);
  return pool.sort((a, b) => rank(a) - rank(b) || hash(a.id + lessonId) - hash(b.id + lessonId)).slice(0, 3);
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
