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
  | { kind: "written"; rubric: string[] }
  | CodeAnswer;

/**
 * One check on the learner's code. `code` is Python run after the learner's program, in the same namespace;
 * the check passes if it raises nothing. An assertion's message is shown to the learner when it fails, so
 * phrase it as a hint, never as the answer. The variable `printed` holds everything the program printed.
 */
export type CodeTest = { name: string; code: string };

/**
 * A program the learner writes and runs in the browser (Python in Pyodide). Imports such as numpy, pandas,
 * scipy and matplotlib are loaded automatically.
 */
export type CodeAnswer = {
  kind: "code";
  /**
   * The runtime. Only "python" (Pyodide, in a Web Worker) exists today; the field leaves room for in-browser
   * GPU runtimes such as WebGPU later. Defaults to "python".
   */
  language?: "python";
  /** What the editor opens with. It must fail at least one test. */
  starter: string;
  /** A reference solution. It must pass every test. Never sent to the browser. */
  solution: string;
  /** Fetched only when the learner presses Check; never part of the page. */
  tests: CodeTest[];
  /** Run before the learner's program, for example to build data the program uses. */
  setup?: string;
  /** Files written to the program's working directory before it runs, as path to contents. */
  files?: Record<string, string>;
};

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
