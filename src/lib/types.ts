import type { ReactNode } from "react";

export type Track = "mathematics" | "machine-learning" | "engineering";

/** The three tracks in the order the Learn button rotates through them. */
export const TRACKS: readonly Track[] = ["mathematics", "machine-learning", "engineering"];

export const TRACK_NAMES: Record<Track, string> = {
  mathematics: "Mathematics",
  "machine-learning": "Machine learning",
  engineering: "ML engineering",
};

export type OutlineLesson = { id: string; title: string };
export type OutlineChapter = { n: number; title: string; lessons: OutlineLesson[] };
export type Course = {
  code: string;
  title: string;
  track: Track;
  tier: number;
  requires: string[];
  parallels: string[];
  source: string;
  chapters: OutlineChapter[];
};

/** How one lesson relates to another. Only "requires" gates progress. */
export type LinkKind = "requires" | "parallels" | "foreshadows" | "revisits" | "applies";

/** The four rungs of the practice ladder. */
export type Rung = "check" | "apply" | "prove" | "stretch";

export type Answer =
  | { kind: "numeric"; value: number; tolerance?: number }
  | { kind: "expression"; value: string; variables: string[] }
  | { kind: "choice"; options: string[]; correct: number[] }
  | { kind: "written"; rubric: string[] };

export type Exercise = {
  /** Short key, unique within the lesson. The full id is `${lessonId}:${key}`. */
  key: string;
  rung: Rung;
  prompt: ReactNode;
  answer: Answer;
};

/** Everything an authored lesson provides. Recall and connections are derived from the graph. */
export type LessonContent = {
  id: string;
  minutes: number;
  links?: Partial<Record<LinkKind, string[]>>;
  puzzle: ReactNode;
  intuition: ReactNode;
  theory: ReactNode;
  practice: Exercise[];
  teachBack: string;
  glimpse: ReactNode;
};

export const isAutoChecked = (a: Answer) => a.kind !== "written";
