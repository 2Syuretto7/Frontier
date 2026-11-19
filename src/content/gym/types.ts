import type { ReactNode } from "react";
import type { CodeTest } from "@/lib/types";

/**
 * A case in the Debugging gym: a short training script with a bug planted in it, and a loss curve that looks wrong.
 * The learner runs the script, works out why the curve looks the way it does, names the cause, then fixes the
 * script until hidden tests pass. The bug never raises an error: the script runs, it just trains badly or reports a
 * number that cannot be true. That is the skill labs test and self-study rarely trains.
 */

/** The kinds of bug the gym plants. The first five are what the cases cover; the rest are wrong answers at level 2. */
export type BugKind =
  | "leakage" | "schedule" | "masking" | "dtype" | "accumulation"
  | "optimiser" | "initialisation" | "shapes";

export const BUG_KINDS: { id: BugKind; name: string; about: string }[] = [
  { id: "leakage", name: "Data leakage", about: "Information from the evaluation data, or from the label itself, reaches training." },
  { id: "schedule", name: "Learning-rate schedule", about: "The learning rate over time is not the one intended." },
  { id: "masking", name: "Masking", about: "Positions are counted or seen that should be hidden, or hidden that should count." },
  { id: "dtype", name: "Silent dtype problem", about: "A number type rounds, wraps or overflows without an error." },
  { id: "accumulation", name: "Gradient accumulation", about: "Gradients summed over micro-batches do not equal the batch gradient." },
  { id: "optimiser", name: "Optimiser update", about: "The update rule itself is wrong: a sign, a missing term, a state that never moves." },
  { id: "initialisation", name: "Initialisation", about: "The starting weights are badly scaled or identical." },
  { id: "shapes", name: "Shapes and broadcasting", about: "Arrays broadcast into the wrong shape and the arithmetic still runs." },
];

export const KIND_BY_ID = new Map(BUG_KINDS.map((k) => [k.id, k]));

/** The kinds a case can be about. The others only appear as wrong answers. */
export const CASE_KINDS: BugKind[] = ["leakage", "schedule", "masking", "dtype", "accumulation"];

/** One line on the symptom chart: `key` of the history dict that `call` returns, plotted against its "step". */
export type Series = { label: string; call: string; key: string };

export type GymCase = {
  /** URL-safe id. Never change it once attempts exist: they are stored against it. */
  id: string;
  title: string;
  /** The symptom in one line, shown on the list. */
  summary: string;
  /** The time to aim for, in minutes. */
  minutes: number;
  kind: BugKind;
  /**
   * Every lesson the case relies on. The case opens once all of them are mastered through Learn, and they must
   * between them (with their own prerequisites) teach every idea and every piece of Python the script uses.
   */
  lessons: string[];
  /** The lessons that teach what the bug gets wrong. A misdiagnosis sends the learner back to these. */
  bugLessons: string[];
  /** The lessons behind each hidden test, for a fix that fails it. A test not listed falls back to `bugLessons`. */
  testLessons?: Record<string, string[]>;
  /** What the learner is told: how the run was set up and what looks wrong. Never the cause. */
  symptom: ReactNode;
  /** The symptom chart, made from the buggy script's own output (see scripts/gym-curves.ts). */
  chart: { title: string; log?: boolean; series: Series[]; floor?: { label: string; call: string; key: string } };
  /** The training script with the bug in it. It must run without an error. */
  program: string;
  /** The reference fix, as exact replacements in `program`. Each `from` must appear once. */
  fix: [from: string, to: string][];
  /** The function the bug lives in, for level 2, where the learner names it. */
  suspect: string;
  /** Level 1: four candidate causes, one of them right. */
  causes: { text: string; right?: true }[];
  /** Why the curve looked like that, shown once the cause is named or the attempt ends. */
  explanation: ReactNode;
  /** Hidden tests run on the learner's fixed script. The buggy script must fail at least one. */
  tests: CodeTest[];
  /** Python run before each test, for shared reference code. Prefix its names with `_ref`. */
  prelude?: string;
};

/** The reference fix applied to the script. */
export function fixedProgram(c: Pick<GymCase, "program" | "fix">): string {
  return c.fix.reduce((src, [from, to]) => src.replace(from, to), c.program);
}

/** The functions a script defines, in order, for naming where the bug is. */
export function functionsIn(program: string): string[] {
  return [...program.matchAll(/^def ([A-Za-z_]\w*)\s*\(/gm)].map((m) => m[1]);
}
