import type { LessonNode } from "./graph";
import { TRACKS, type Track } from "./types";

export type LearnInputs = {
  /** A lesson started but not yet mastered, most recent first. */
  openLesson: LessonNode | null;
  dueReviews: number;
  /** Unlocked, authored, unmastered lessons in curriculum order. */
  frontier: LessonNode[];
  /** Track of the most recently started lesson, to rotate. */
  lastTrack: Track | null;
  newLessonsToday: number;
  pace: number;
};

export type LearnStep =
  | { kind: "continue"; lesson: LessonNode }
  | { kind: "review"; count: number }
  | { kind: "begin"; lesson: LessonNode }
  | { kind: "rest"; reason: "pace" | "waiting" };

/** Reviews below this many wait until a lesson is finished, so they never crowd out new learning. */
const REVIEW_THRESHOLD = 1;

/**
 * The single best next step:
 * 1. finish what is open;
 * 2. reviews that are due;
 * 3. begin the next unlocked lesson, rotating mathematics, machine learning and engineering,
 *    within the daily pace for new lessons.
 */
export function chooseNextStep(input: LearnInputs): LearnStep {
  if (input.openLesson) return { kind: "continue", lesson: input.openLesson };
  if (input.dueReviews >= REVIEW_THRESHOLD) return { kind: "review", count: input.dueReviews };
  if (input.newLessonsToday >= input.pace) return { kind: "rest", reason: "pace" };
  if (input.frontier.length === 0) return { kind: "rest", reason: "waiting" };
  const start = input.lastTrack ? TRACKS.indexOf(input.lastTrack) + 1 : 0;
  for (let k = 0; k < TRACKS.length; k++) {
    const track = TRACKS[(start + k) % TRACKS.length];
    const preferred = input.frontier.find((n) => n.track === track);
    if (preferred) return { kind: "begin", lesson: preferred };
  }
  return { kind: "begin", lesson: input.frontier[0] };
}

export function describeStep(step: LearnStep): string {
  switch (step.kind) {
    case "continue":
      return `Continue: ${step.lesson.title}`;
    case "review":
      return step.count === 1 ? "One question to review" : `${Math.min(step.count, 12)} questions to review`;
    case "begin":
      return `Begin: ${step.lesson.title}`;
    case "rest":
      return step.reason === "pace"
        ? "That's today's new learning done. Come back tomorrow."
        : "You're ahead of the writing. New lessons are on their way.";
  }
}
