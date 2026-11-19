/**
 * Parton's prompts for the Debugging gym. Pure functions and constants, so they can be tested and read in one place.
 *
 * Two jobs:
 * - Hints while the learner hunts for a planted bug. Before the cause is named, hints teach the hunt (what to measure,
 *   which stage to suspect, a small experiment), never the cause. After it is named, they help with the fix. As with
 *   drills, the model writing the hint never sees the cause, the fix or the explanation; a separate pass that does see
 *   them checks the draft gives nothing away.
 * - Writing a fresh case: a new training script with the same kind of bug as an authored case, its fix and hidden
 *   tests. The learner's browser runs both before the case is used: the buggy script must run without an error and
 *   fail a test, and the fixed one must pass them all.
 */

export const GYM_RUNGS = [
  "Rung 1, what to measure: name one quantity worth printing or plotting next to the loss (a learning rate, a dtype, an input's range, an overlap, a count) that would test an idea about the symptom, and ask what they expect it to show. Do not name the cause.",
  "Rung 2, which stage: say which stage of the pipeline the evidence points to (the data and its split, the inputs' preprocessing, the model's masking, the loss, the optimiser step, the schedule, the accumulation) and why, without naming the function or the mistake.",
  "Rung 3, which function: name the function where the behaviour departs from what the symptom says it should be, and say what it does on this run's data. Do not say what is wrong with it.",
  "Rung 4, an experiment: give a tiny experiment they can run in a few lines (a probe input, a two-row case, a single call) whose result exposes the bug, without saying what the result will be.",
  "Rung 5, a parallel: show the same kind of mistake and its repair in a different, unrelated snippet of a few lines, then ask them to look for it in their script. The snippet must not be their script or a near copy of it.",
] as const;

export const FIX_RUNGS = [
  "Rung 1, what the test checks: say in plain words what behaviour the failing test checks, and ask one question that points at where their fix falls short. Do not name the fix.",
  "Rung 2, where: point to the line of their script where the behaviour still departs from what the test checks.",
  "Rung 3, why: name the idea their fix misses, and why the test cares. Do not write code.",
  "Rung 4, a tiny case: give a tiny input and a property the right output must have on it, without the corrected code.",
  "Rung 5, a parallel: show the same repair in an unrelated snippet of a few lines.",
] as const;

export const gymRungFor = (hintsGiven: number) => Math.min(GYM_RUNGS.length, Math.max(1, hintsGiven + 1));

export const GYM_HINT_RULES = `Right now the learner is in the Debugging gym: a training script with one planted bug, a loss curve that looks wrong, and a clock. They must work out why, name the cause, then fix it against hidden tests. This is what research labs test in interviews: debugging a training run from its symptoms. Rules, which override everything else:
- Give a hint at the allowed rung of the ladder, and go no further. Prefer the smaller hint.
- Until they have named the cause, never name it, never name the kind of bug, and never say which line is wrong. Teach the hunt: what to measure, what each observation rules out.
- You do not know the cause or the fix; do not guess at them as if you did. Reason from the symptom, the script and what they have printed.
- Never write the corrected script, the fixed line or the finished function.
- If their own words show a wrong theory, say what evidence would test it, rather than that it is wrong.
- Keep it short: two to five sentences, or a short list. The clock is running.`;

export const GYM_HINT_SCHEMA = {
  type: "object",
  properties: { reply: { type: "string", description: "What Parton says to the learner." } },
  required: ["reply"],
  additionalProperties: false,
} as const;

export type GymHintOutput = { reply: string };

/** The learner's state as Parton reads it: their script, what it printed, their wrong guesses and the failing tests. */
export function gymStateText(input: {
  source: string;
  output: string;
  error: string | null;
  diagnosed: boolean;
  guesses: string[];
  failing: { name: string; message?: string }[];
  minutesIn: number;
  limitMinutes: number;
}): string {
  return [
    `They are ${Math.round(input.minutesIn)} minutes into ${input.limitMinutes}.`,
    input.diagnosed ? "They have named the cause correctly and are now fixing it." : "They have not named the cause yet.",
    input.guesses.length ? `Guesses at the cause that were wrong:\n${input.guesses.map((g) => `- ${g}`).join("\n")}` : "",
    `Their script now:\n<<<\n${input.source.slice(0, 8000)}\n>>>`,
    input.error ? `Their last run stopped with:\n${input.error.slice(0, 1500)}` : input.output.trim() ? `Their last run printed:\n<<<\n${input.output.slice(-3000)}\n>>>` : "They have not run it yet, or it printed nothing.",
    input.failing.length ? `Hidden tests their last fix failed:\n${input.failing.map((f) => `- ${f.name}${f.message ? `: ${f.message.slice(0, 300)}` : ""}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------------------------
// Fresh cases

export const CASE_SYSTEM = `You write cases for the Debugging gym in Frontier, a private university for one learner preparing for machine learning research engineering roles. A case is a short training script with exactly one planted bug that never raises an error: the script runs, and the loss curve it prints looks wrong. The learner must work out why from the symptom, name the kind of bug and the function it lives in, and fix it against hidden tests, the way research labs test debugging in interviews.

You will see an existing case in full, and write a fresh one with the same kind of bug, so the learner practises the same skill on new code. The fresh case must:
- Plant the same kind of bug as the original, but in a different setting: a different model, dataset, pipeline or framing, and a different mistake within that kind. Do not repeat the original's mistake or any listed as already used.
- Put the bug in one function, the suspect, and nowhere else. The fix must change only that function.
- Use only ideas and Python the original's script uses or that its lessons (listed) teach. NumPy only, Python 3, running in Pyodide: no PyTorch, no files, no internet. The whole script must run in under two seconds, and each test in well under one.
- Define run(), which trains and returns a dict of lists with a "step" key and at least one loss series, and a __main__ block that prints a small table of the logged values, so the learner sees the symptom by running it.
- Seed all randomness with numpy.random.default_rng and fixed seeds.

What you write:
- title: a short title that describes the symptom, never the cause. summary: the symptom in one line.
- symptom: what the learner is told, in light Markdown (paragraphs, \`inline code\`, TeX between dollar signs; no headings). Describe the setup and what the logged curve shows that cannot be right. Never hint at the cause or the function.
- program: the full script with the bug. fixed: the full script with only the suspect function repaired.
- suspect: the name of the function the bug lives in.
- explanation: two short paragraphs in light Markdown: why the curve looked like that, and the repair. Shown only after the attempt.
- prelude: Python run before each test, for shared reference code; prefix every name it defines with _ref (import numpy as _ref_np). It may be empty.
- tests: 3 to 6 hidden tests. Each has a short descriptive name (unique) and code using assert with a message. A message is a hint, never the answer. At least one test calls the suspect function directly on a small probe input; at least one calls run() and checks the curve now looks healthy. Use only names the script defines, plus _ref names. The buggy script must fail at least one test and the fixed one pass them all.
- minutes: 10 to 30.

British spelling (as used in India). No emojis.`;

export const CASE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    symptom: { type: "string" },
    program: { type: "string" },
    fixed: { type: "string" },
    suspect: { type: "string" },
    explanation: { type: "string" },
    prelude: { type: "string" },
    minutes: { type: "integer" },
    mistake: { type: "string", description: "One sentence naming the planted mistake, for the list of mistakes already used. Never shown before the attempt." },
    tests: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, code: { type: "string" } },
        required: ["name", "code"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "summary", "symptom", "program", "fixed", "suspect", "explanation", "prelude", "minutes", "mistake", "tests"],
  additionalProperties: false,
} as const;

export type CaseOutput = {
  title: string; summary: string; symptom: string; program: string; fixed: string; suspect: string; explanation: string;
  prelude: string; minutes: number; mistake: string; tests: { name: string; code: string }[];
};

/** The script with the named function's whole definition cut out, to compare what lies outside it. */
export function withoutFunction(program: string, name: string): string | null {
  const lines = program.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((l) => new RegExp(`^def ${name}\\s*\\(`).test(l));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && /^\S/.test(l));
  if (end === -1) end = lines.length;
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim();
}

/** Checks a fresh case Parton wrote before it is stored, and tidies it. Running the code is left to the browser. */
export function acceptCase(v: CaseOutput): { ok: true; fresh: CaseOutput } | { ok: false; problem: string } {
  const text = (s: unknown) => (typeof s === "string" ? s : "");
  const out: CaseOutput = {
    title: text(v.title).trim().slice(0, 120),
    summary: text(v.summary).trim().slice(0, 300),
    symptom: text(v.symptom).trim().slice(0, 6000),
    program: text(v.program).replace(/^\n+/, "").slice(0, 20_000),
    fixed: text(v.fixed).replace(/^\n+/, "").slice(0, 20_000),
    suspect: text(v.suspect).trim(),
    explanation: text(v.explanation).trim().slice(0, 6000),
    prelude: text(v.prelude).trim().slice(0, 10_000),
    minutes: Math.min(30, Math.max(10, Math.round(Number(v.minutes) || 20))),
    mistake: text(v.mistake).trim().slice(0, 300),
    tests: (Array.isArray(v.tests) ? v.tests : [])
      .map((t) => ({ name: text(t?.name).trim().slice(0, 120), code: text(t?.code).slice(0, 6000) }))
      .filter((t) => t.name && t.code.trim()),
  };
  if (!out.title || !out.symptom || !out.program.trim() || !out.fixed.trim() || !out.explanation) return { ok: false, problem: "it left out its title, symptom, script, fix or explanation" };
  if (out.program.trim() === out.fixed.trim()) return { ok: false, problem: "its fixed script is the same as the buggy one" };
  if (out.tests.length < 3) return { ok: false, problem: "it has fewer than three hidden tests" };
  if (new Set(out.tests.map((t) => t.name)).size !== out.tests.length) return { ok: false, problem: "two of its tests share a name" };
  if (!/^[A-Za-z_]\w*$/.test(out.suspect)) return { ok: false, problem: "its suspect is not a function name" };
  if (!/^def run\s*\(/m.test(out.program)) return { ok: false, problem: "its script does not define run()" };
  const outsideBug = withoutFunction(out.program, out.suspect);
  const outsideFix = withoutFunction(out.fixed, out.suspect);
  if (outsideBug === null || outsideFix === null) return { ok: false, problem: `its scripts do not both define ${out.suspect}` };
  if (outsideBug !== outsideFix) return { ok: false, problem: `its fix changes code outside ${out.suspect}` };
  const leaked = /^(?:def|class)\s+(?!_ref)([A-Za-z]\w*)|^(?!_ref)([A-Za-z]\w*)\s*=/m.exec(out.prelude);
  if (leaked) return { ok: false, problem: `its prelude defines ${leaked[1] ?? leaked[2]}, which could clash with the script's names` };
  return { ok: true, fresh: out };
}

/** What the browser found when it ran a fresh case's buggy and fixed scripts against its tests. */
export type CaseReport = {
  buggyError: string | null;
  buggyFailed: boolean;
  fixedError: string | null;
  fixedFailures: string[];
};

/** The problem with a fresh case, in words, or null when it is sound. */
export function judgeCaseReport(r: CaseReport): string | null {
  const last = (e: string) => e.split("\n").filter(Boolean).at(-1)?.slice(0, 200);
  if (r.buggyError) return `its buggy script stopped with an error (${last(r.buggyError)}), but a planted bug must be silent`;
  if (!r.buggyFailed) return "its tests did not catch the planted bug";
  if (r.fixedError) return `its fixed script stopped with an error (${last(r.fixedError)})`;
  if (r.fixedFailures.length) return `its fixed script failed its own tests: ${r.fixedFailures.slice(0, 3).join("; ")}`;
  return null;
}
