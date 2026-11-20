import type { LessonNode } from "./graph";
import { TRACKS, type Track } from "./types";
import { topPull, type Pull, type PullSource } from "./guide/core";

export type LearnInputs = {
  /** A lesson started but not yet mastered, most recent first. */
  openLesson: LessonNode | null;
  /** Unlocked, authored, unmastered lessons in curriculum order. */
  frontier: LessonNode[];
  /** Track of the most recently started lesson, to rotate. */
  lastTrack: Track | null;
  newLessonsToday: number;
  pace: number;
  /**
   * Lessons that Readiness, Projects and Drills want favoured. Only a pull on a frontier lesson counts, so
   * guidance never reaches past the prerequisites the learner has mastered.
   */
  pulls?: Pull[];
};

export type LearnStep =
  | { kind: "continue"; lesson: LessonNode }
  | { kind: "begin"; lesson: LessonNode; pastPace: boolean; why?: string; guided?: PullSource }
  | { kind: "rest"; reason: "waiting" };

/**
 * The single best next step:
 * 1. finish what is open;
 * 2. begin the unlocked lesson that a project, a failed drill or the weekly Readiness plan is waiting on, if any;
 * 3. otherwise begin the next unlocked lesson, rotating mathematics, machine learning and engineering.
 *    The daily pace is only a suggestion: Learn never stops at it, and the step notes when it is passed.
 */
export function chooseNextStep(input: LearnInputs): LearnStep {
  if (input.openLesson) return { kind: "continue", lesson: input.openLesson };
  if (input.frontier.length === 0) return { kind: "rest", reason: "waiting" };
  const pastPace = input.newLessonsToday >= input.pace;
  const pulled = topPull(input.frontier, input.pulls ?? []);
  if (pulled) return { kind: "begin", lesson: pulled.lesson, pastPace, why: pulled.pull.why, guided: pulled.pull.source };
  const start = input.lastTrack ? TRACKS.indexOf(input.lastTrack) + 1 : 0;
  for (let k = 0; k < TRACKS.length; k++) {
    const track = TRACKS[(start + k) % TRACKS.length];
    const preferred = input.frontier.find((n) => n.track === track);
    if (preferred) return { kind: "begin", lesson: preferred, pastPace };
  }
  return { kind: "begin", lesson: input.frontier[0], pastPace };
}

export function describeStep(step: LearnStep): string {
  switch (step.kind) {
    case "continue":
      return `Continue: ${step.lesson.title}`;
    case "begin":
      return `Begin: ${step.lesson.title}`;
    case "rest":
      return "You're ahead of the writing. New lessons are on their way.";
  }
}
