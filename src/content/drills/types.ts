import type { ReactNode } from "react";
import type { CodeTest } from "@/lib/types";

/**
 * A timed, from-scratch implementation drill: the kind of exercise lab coding interviews and take-homes set.
 * The learner reads the brief, writes the code in the browser editor (Python in Pyodide, NumPy only), and
 * submits it against hidden tests that check correctness and shapes. Every attempt is timed and recorded.
 */
export type Drill = {
  /** URL-safe id, such as "attention". Never change it once attempts exist: they are stored against it. */
  id: string;
  title: string;
  /** One line shown on the list and before the clock starts. */
  summary: string;
  /** The time to beat, in minutes. Going over is allowed; it is recorded as a pass over time. */
  minutes: number;
  /** What the drill exercises, shown as tags and usable as scorecard evidence. */
  skills: string[];
  /** The full task, shown once the clock starts. Name every function, its arguments, shapes and conventions. */
  brief: ReactNode;
  /** What the editor opens with. It must fail at least one test. */
  starter: string;
  /** A reference solution. It must pass every test. Shown only after an attempt ends; never part of the page before. */
  solution: string;
  /**
   * Python run before each test in the learner's namespace, for shared reference code. Never sent until Submit.
   * Prefix every name it defines with `_ref` so it cannot clash with the learner's names.
   */
  prelude?: string;
  /** The hidden tests. Names are shown with pass or fail; assertion messages are hints, never the answer. */
  tests: CodeTest[];
  /** Run before the learner's program, for example a model the drill builds on. It is shown in the brief. */
  setup?: string;
};
