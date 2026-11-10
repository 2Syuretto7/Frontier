import "server-only";
import { LESSONS } from "@/content/lessons";
import { buildGraph, type Graph } from "./graph";
import { isAutoChecked, type Exercise, type LessonContent } from "./types";

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

/** Built once per server process; throws (and fails the build) if any link is broken. */
export const GRAPH: Graph = buildGraph(new Map(LESSONS.map((l) => [l.id, l.links ?? {}])));

export type ExerciseRef = { id: string; lessonId: string; exercise: Exercise };

export const exerciseId = (lessonId: string, key: string) => `${lessonId}:${key}`;

export const EXERCISES = new Map<string, ExerciseRef>(
  LESSONS.flatMap((l) => l.practice.map((e) => [exerciseId(l.id, e.key), { id: exerciseId(l.id, e.key), lessonId: l.id, exercise: e }] as const)),
);

for (const l of LESSONS) {
  const keys = l.practice.map((e) => e.key);
  if (new Set(keys).size !== keys.length) throw new Error(`Duplicate exercise key in ${l.id}`);
}

/** Exercises that count towards mastery: check, apply and prove. Stretch is optional. */
export const masteryExercises = (l: LessonContent) => l.practice.filter((e) => e.rung !== "stretch");

/** Auto-checked check and apply exercises become spaced-review cards once a lesson is mastered. */
export const reviewable = (l: LessonContent) =>
  l.practice.filter((e) => (e.rung === "check" || e.rung === "apply") && isAutoChecked(e.answer));
