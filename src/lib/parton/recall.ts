import type { Answer } from "@/lib/types";
import { checkAnswer } from "@/lib/check";
import { VOICE } from "./prompts";

/**
 * Fresh recall questions. Pure functions and constants, so they can be tested without a database or the API.
 *
 * Recall used to replay the practice questions of earlier lessons, which the learner had already solved,
 * and in the same order on every visit. Now Parton writes new questions each sitting. Every question it
 * has ever asked is stored, and a new one is dropped if it repeats an earlier recall question or a
 * practice question from the lesson it comes from.
 */

export const RECALL_COUNT = 3;

/** The answer kinds a generated question may use: the ones the server can check on its own. */
export type RecallAnswer = Extract<Answer, { kind: "numeric" | "expression" | "choice" }>;

export type RecallDraft = { sourceLessonId: string; prompt: string; answer: RecallAnswer };

export type RecallSource = {
  id: string;
  title: string;
  /** The lesson's own puzzle, intuition and theory, as plain text. */
  text: string;
  /** The lesson's practice prompts, which recall must not reuse. */
  practice: string[];
};

export const RECALL_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_lesson_id: { type: "string", description: "The id of the earlier lesson the question recalls." },
          prompt: { type: "string", description: "The question as the learner reads it. TeX between dollar signs." },
          kind: { type: "string", enum: ["numeric", "expression", "choice"] },
          number: { type: "number", description: "For numeric: the exact answer. Otherwise 0." },
          tolerance: { type: "number", description: "For numeric: the allowed error (relative for values above 1), 0 for an exact answer. Otherwise 0." },
          expression: { type: "string", description: "For expression: the answer in plain ASCII maths, such as 3*x^2 + 2*x. Otherwise empty." },
          variables: { type: "array", items: { type: "string" }, description: "For expression: its single-letter variables. Otherwise empty." },
          options: { type: "array", items: { type: "string" }, description: "For choice: three to five options. Otherwise empty." },
          correct: { type: "array", items: { type: "integer" }, description: "For choice: the zero-based indices of every correct option. Otherwise empty." },
        },
        required: ["source_lesson_id", "prompt", "kind", "number", "tolerance", "expression", "variables", "options", "correct"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

export type RecallOutput = {
  questions: {
    source_lesson_id: string;
    prompt: string;
    kind: string;
    number: number;
    tolerance: number;
    expression: string;
    variables: string[];
    options: string[];
    correct: number[];
  }[];
};

export const RECALL_SYSTEM = `${VOICE}

Right now you are not giving hints. You are writing short recall questions that open a lesson: quick retrieval practice on earlier lessons the learner has already mastered, so the old ideas are fresh before the new one.

What makes a good recall question:
- It is new. Never reuse, reword or lightly change a question the learner has already seen: not a practice question from the earlier lesson, and not any recall question listed as already asked. Change the idea being tested, the situation or the numbers in a real way.
- It makes the learner retrieve one key idea from the earlier lesson (a definition, a rule, a result, a method) and use it once. One or two minutes of thought, not a long calculation.
- It stands on its own: everything needed is in the question.
- Exactly one unambiguous answer that the server can check: a number, an expression, or one or more options.
- Spread the questions across different earlier lessons and different ideas where you can. Lean towards the ideas the learner has found hard, if any are listed.

Answer keys must be right. Solve each question yourself, carefully, before you write its key.
- numeric: put the exact value in "number". Use "tolerance" only when the answer is not a short exact number, and then ask for a stated number of decimal places.
- expression: plain ASCII maths that a small parser reads: + - * / ^, brackets, sin cos tan exp ln log sqrt abs, pi and e, and single-letter variables listed in "variables".
- choice: three to five distinct options, with every correct index in "correct". Write any maths in an option in TeX between dollar signs, as in the prompt. Say in the prompt when more than one option may be right.
Leave the fields of the other kinds empty or zero.`;

/** What the model reads: the earlier lessons, what it must not repeat, and what the learner found hard. */
export function recallRequest({
  lessonTitle,
  sources,
  asked,
  hard,
  count = RECALL_COUNT,
}: {
  lessonTitle: string;
  sources: RecallSource[];
  asked: string[];
  hard: string[];
  count?: number;
}): string {
  const parts = [
    `The learner is about to start the lesson "${lessonTitle}". Write ${count} new recall questions on the earlier lessons below.`,
    ...sources.map((s) =>
      [
        `# Earlier lesson ${s.id}: "${s.title}"`,
        s.text,
        `## Its practice questions (already seen; do not reuse)\n${s.practice.map((p) => `- ${p}`).join("\n") || "- none"}`,
      ].join("\n\n"),
    ),
    `# Recall questions already asked (never repeat or rephrase any of these)\n${asked.map((p) => `- ${p}`).join("\n") || "- none yet"}`,
  ];
  if (hard.length) parts.push(`# Ideas the learner has found hard\n${hard.map((p) => `- ${p}`).join("\n")}`);
  parts.push(`Use only these lesson ids for source_lesson_id: ${sources.map((s) => s.id).join(", ")}.`);
  return parts.join("\n\n");
}

/** Lower case, words only, so trivial changes of spacing, punctuation or TeX markup still count as a repeat. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\\[a-z]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(text: string): Set<string> {
  return new Set(normalise(text).split(" ").filter(Boolean));
}

/** True when two prompts are the same question in all but small details (85% or more of their words shared). */
export function isRepeat(a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = words(a);
  const wb = words(b);
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / (wa.size + wb.size - shared) >= 0.85;
}

/** Turns one generated question into a checked answer, or null if the key is malformed or fails its own check. */
export function toAnswer(q: RecallOutput["questions"][number]): RecallAnswer | null {
  let answer: RecallAnswer;
  let input: string;
  if (q.kind === "numeric") {
    if (!Number.isFinite(q.number)) return null;
    answer = q.tolerance > 0 ? { kind: "numeric", value: q.number, tolerance: q.tolerance } : { kind: "numeric", value: q.number };
    input = String(q.number);
  } else if (q.kind === "expression") {
    const variables = [...new Set(q.variables.map((v) => v.trim()).filter(Boolean))];
    if (!q.expression.trim() || variables.length === 0) return null;
    answer = { kind: "expression", value: q.expression.trim(), variables };
    input = answer.value;
  } else if (q.kind === "choice") {
    const options = q.options.map((o) => o.trim());
    const correct = [...new Set(q.correct)].sort((a, b) => a - b);
    if (options.length < 2 || options.length > 6 || options.some((o) => !o) || new Set(options).size !== options.length) return null;
    if (correct.length === 0 || correct.some((i) => !Number.isInteger(i) || i < 0 || i >= options.length)) return null;
    answer = { kind: "choice", options, correct };
    input = correct.join(",");
  } else {
    return null;
  }
  return checkAnswer(answer, input).correct ? answer : null;
}

/**
 * Keeps the generated questions that are well formed, come from one of the given lessons, and repeat nothing:
 * not an earlier recall question, not a practice question, and not each other.
 */
export function acceptRecall(
  output: RecallOutput,
  { sources, asked, count = RECALL_COUNT }: { sources: RecallSource[]; asked: string[]; count?: number },
): RecallDraft[] {
  const ids = new Set(sources.map((s) => s.id));
  const seen = [...asked, ...sources.flatMap((s) => s.practice)];
  const kept: RecallDraft[] = [];
  for (const q of output.questions ?? []) {
    if (kept.length >= count) break;
    const prompt = q.prompt?.trim();
    if (!prompt || !ids.has(q.source_lesson_id)) continue;
    if (seen.some((p) => isRepeat(p, prompt))) continue;
    const answer = toAnswer(q);
    if (!answer) continue;
    kept.push({ sourceLessonId: q.source_lesson_id, prompt, answer });
    seen.push(prompt);
  }
  return kept;
}
