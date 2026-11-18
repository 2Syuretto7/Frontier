/**
 * Parton's prompts for drills. Pure functions and constants, so they can be tested and read in one place.
 *
 * Two jobs:
 * - Explaining why a hidden test failed, with hints and never the fix. As in lessons, the model that writes the
 *   hint never sees the reference solution or the hidden tests' code; a separate pass that does see them checks
 *   the draft gives nothing away. Each ask on the same attempt climbs one rung of a drill-shaped hint ladder.
 * - Writing a new variant of a drill: a twist on the original that exercises the same skills, with its own
 *   brief, starter, reference solution, hidden tests and plausible wrong answers. The learner's browser then runs
 *   all of them before the variant is used, so a variant whose tests are broken is never set.
 */

export const DRILL_RUNGS = [
  "Rung 1, what the test checks: say in plain words what behaviour the failing test checks, then ask one question that points the learner at where their program's behaviour differs. Do not name the fix.",
  "Rung 2, where it goes wrong: point to the function or line of their code where the behaviour first departs from the brief, and say what that line does on the test's kind of input. Do not say what it should do instead.",
  "Rung 3, why: name the convention, formula or idea from the brief that their code misses, and why the test cares about it. Do not write code.",
  "Rung 4, a tiny case: give a tiny input they can work through by hand or print, and a property the right output must have on it (a shape, a sum, a sign, a value from the brief's formula), without the corrected code.",
  "Rung 5, a parallel: show the same kind of mistake and its repair in a different, unrelated snippet of a few lines, then ask them to apply the idea to their own code. The snippet must not be their code or a near copy of it.",
] as const;

export const drillRungFor = (hintsGiven: number) => Math.min(DRILL_RUNGS.length, Math.max(1, hintsGiven + 1));

export const DRILL_HINT_RULES = `Right now the learner is in a timed implementation drill, the kind lab coding interviews set, and has asked why hidden tests failed. Rules, which override everything else:
- Explain the failure with a hint at the allowed rung of the drill ladder, and go no further than it. Prefer the smaller hint.
- Never write the corrected code, the fixed line, or the finished function, and never quote code from a reference solution (you do not have one; do not invent one).
- Work from what you can see: the brief, their program, the failing tests' names and messages, and the tests that passed. The tests' code is hidden from you and from them. If a failure has several possible causes, name the one their code shows, not a guess.
- When the program stopped with an error, so no test ran, help with the error first.
- When several tests fail, pick the one most likely to unlock the others and say so in a few words.
- Keep it short: two to six sentences, or a short list. The clock is running.`;

export const DRILL_HINT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "What Parton says to the learner." },
    misconception: {
      type: "string",
      description: "If their code shows a specific misunderstanding, name it in one short sentence. Otherwise an empty string.",
    },
  },
  required: ["reply", "misconception"],
  additionalProperties: false,
} as const;

export type DrillHintOutput = { reply: string; misconception: string };

/** The learner's last submission as Parton reads it. */
export function submissionText(source: string, results: { name: string; passed: boolean; message?: string }[], secondsIn: number, limitMinutes: number): string {
  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);
  return [
    `They are ${Math.round(secondsIn / 60)} minutes into a ${limitMinutes}-minute limit.`,
    `Their program:\n<<<\n${source.slice(0, 8000)}\n>>>`,
    failed.length
      ? `Hidden tests that failed:\n${failed.map((r) => `- ${r.name}${r.message ? `: ${r.message.slice(0, 400)}` : ""}`).join("\n")}`
      : "No hidden test failed on their last submission.",
    passed.length ? `Hidden tests that passed: ${passed.map((r) => r.name).join("; ")}.` : "No hidden test passed.",
  ].join("\n\n");
}

// ---------------------------------------------------------------------------------------------
// Variants

export const VARIANT_SYSTEM = `You write implementation drills for Frontier, a private university for one learner preparing for machine learning research engineering roles. A drill is a short, timed exercise, like a lab coding interview: the learner reads a brief, writes Python from scratch in the browser, and submits it against hidden tests.

You will see an existing drill in full and write a new variant of it. The variant must:
- Exercise the same core skills, with a real twist so it is not the same exercise: a different convention or interface, an added requirement, a related algorithm, a different data layout, or an extension that a strong engineer would be asked next. Do not repeat any twist listed as already used.
- Be harder than the original at the level asked for, but finishable in the minutes you set (10 to 45).
- Run in Pyodide with Python 3 and NumPy only (no PyTorch, no internet, no files). Each test must finish in well under a second.

What you write:
- brief: the full task in light Markdown: paragraphs, "- " bullet lists, \`inline code\`, fenced code blocks with \`\`\`, and TeX between dollar signs. No headings, no tables. Name every function or class, its arguments, shapes, dtypes and conventions exactly, and say what the hidden tests check in general terms. The learner must be able to pass every test from the brief alone.
- starter: what the editor opens with: imports and the signatures, each body raising NotImplementedError, and optionally a small __main__ block. It must fail at least one test.
- solution: a clear reference solution that passes every test. It must not appear in the starter.
- prelude: Python run before each test in the learner's namespace, for shared reference code. Prefix every name it defines with _ref (import numpy as _ref_np). It may be empty.
- setup: Python run before the learner's program, usually empty.
- tests: 5 to 8 hidden tests. Each has a short descriptive name (unique) and code using assert with a message. A message is a hint, never the answer: say what was expected in words ("the rows should sum to one"), never the expected numbers or the code. Check shapes, correctness against a reference written in the prelude or in the test, edge cases and the conventions the brief states. Seed any randomness with numpy.random.default_rng and a fixed seed. Use only names the brief tells the learner to define, plus _ref names.
- mutants: 2 to 4 plausible wrong answers the tests must catch: each is an exact piece of text that appears once in the solution ("from"), what a learner might write instead ("to"), and what mistake it is ("why").
- twist: one sentence on what is new compared with the original. title: a short title. summary: one line shown before the clock starts.

British spelling (as used in India). No emojis.`;

export const VARIANT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    twist: { type: "string" },
    minutes: { type: "integer" },
    brief: { type: "string" },
    starter: { type: "string" },
    solution: { type: "string" },
    prelude: { type: "string" },
    setup: { type: "string" },
    tests: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, code: { type: "string" } },
        required: ["name", "code"],
        additionalProperties: false,
      },
    },
    mutants: {
      type: "array",
      items: {
        type: "object",
        properties: { from: { type: "string" }, to: { type: "string" }, why: { type: "string" } },
        required: ["from", "to", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "summary", "twist", "minutes", "brief", "starter", "solution", "prelude", "setup", "tests", "mutants"],
  additionalProperties: false,
} as const;

export type VariantOutput = {
  title: string; summary: string; twist: string; minutes: number; brief: string; starter: string; solution: string;
  prelude: string; setup: string; tests: { name: string; code: string }[]; mutants: { from: string; to: string; why: string }[];
};

/**
 * Checks a variant Parton wrote before it is stored, and tidies it. Returns the problem in words, or the
 * cleaned variant. Running the code is left to the learner's browser.
 */
export function acceptVariant(v: VariantOutput): { ok: true; variant: VariantOutput } | { ok: false; problem: string } {
  const text = (s: unknown) => (typeof s === "string" ? s : "");
  const out: VariantOutput = {
    title: text(v.title).trim().slice(0, 120),
    summary: text(v.summary).trim().slice(0, 300),
    twist: text(v.twist).trim().slice(0, 400),
    minutes: Math.min(45, Math.max(10, Math.round(Number(v.minutes) || 25))),
    brief: text(v.brief).trim().slice(0, 12_000),
    starter: text(v.starter).replace(/^\n+/, "").slice(0, 8000),
    solution: text(v.solution).replace(/^\n+/, "").slice(0, 20_000),
    prelude: text(v.prelude).trim().slice(0, 20_000),
    setup: text(v.setup).trim().slice(0, 8000),
    tests: (Array.isArray(v.tests) ? v.tests : [])
      .map((t) => ({ name: text(t?.name).trim().slice(0, 120), code: text(t?.code).slice(0, 6000) }))
      .filter((t) => t.name && t.code.trim()),
    mutants: (Array.isArray(v.mutants) ? v.mutants : [])
      .map((m) => ({ from: text(m?.from), to: text(m?.to), why: text(m?.why).trim().slice(0, 200) }))
      .filter((m) => m.from && m.from !== m.to),
  };
  if (!out.title || !out.brief || !out.starter.trim() || !out.solution.trim()) return { ok: false, problem: "it left out its title, brief, starter or solution" };
  if (out.tests.length < 4) return { ok: false, problem: "it has fewer than four hidden tests" };
  if (new Set(out.tests.map((t) => t.name)).size !== out.tests.length) return { ok: false, problem: "two of its tests share a name" };
  if (out.starter.includes(out.solution.trim())) return { ok: false, problem: "its starter contains the solution" };
  const leaked = /^(?:def|class)\s+(?!_ref)([A-Za-z]\w*)|^(?!_ref)([A-Za-z]\w*)\s*=/m.exec(out.prelude);
  if (leaked) return { ok: false, problem: `its prelude defines ${leaked[1] ?? leaked[2]}, which could clash with the learner's names` };
  out.mutants = out.mutants.filter((m) => out.solution.split(m.from).length === 2).slice(0, 4);
  if (out.mutants.length < 2) return { ok: false, problem: "it gave fewer than two wrong answers that match its solution" };
  return { ok: true, variant: out };
}

/** What the browser found when it ran a new variant's solution, starter and wrong answers against its tests. */
export type VariantReport = {
  solutionFailures: string[];
  solutionError: string | null;
  starterFailed: boolean;
  /** For each wrong answer, in order, whether the tests caught it. */
  caught: boolean[];
};

/** The problem with a variant, in words, or null when it is sound. */
export function judgeReport(r: VariantReport, mutants: number): string | null {
  if (r.solutionError) return `its reference solution stopped with an error (${r.solutionError.split("\n").filter(Boolean).at(-1)?.slice(0, 200)})`;
  if (r.solutionFailures.length) return `its reference solution failed its own tests: ${r.solutionFailures.slice(0, 3).join("; ")}`;
  if (!r.starterFailed) return "its starter already passed every test";
  if (r.caught.length !== mutants) return "not every wrong answer was checked";
  const missed = r.caught.filter((c) => !c).length;
  if (missed) return `its tests let ${missed} of ${mutants} plausible wrong answers pass`;
  return null;
}
