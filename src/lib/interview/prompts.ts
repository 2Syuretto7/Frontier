/**
 * What Parton is told when it plays the interviewer, scores an answer against its rubric, or writes a fresh
 * question. Pure, so the accept functions can be tested without the API.
 */
import type { InterviewMode, InterviewQuestion } from "../../content/interview/types";
import { MAX_FOLLOW_UPS, MODES, SCORE_MAX } from "./core";

const STYLE = `How you write:
- Plain, direct, professional. No emojis. British spelling as used in India: "optimise", "normalise", "behaviour".
- Mathematics in TeX between dollar signs, for example $\\sqrt{d}$.
- No headings.`;

/** The learner's own material a question can draw on. */
export type Background = {
  role: string | null;
  labs: string[];
  project: null | {
    title: string;
    question: string;
    why: string;
    plan: string;
    experiments: { title: string; expected: string; result: string | null }[];
    notebook: string[];
    writeupSummary: string;
  };
};

export type Turn = { role: "interviewer" | "candidate"; body: string; code?: string | null; checks?: { name: string; passed: boolean; message?: string }[] | null };

function backgroundText(q: Pick<InterviewQuestion, "mode" | "needs">, bg: Background): string {
  const parts: string[] = [];
  if (bg.role) parts.push(`The candidate is preparing for: ${bg.role}.`);
  if ((q.needs ?? []).some((n) => n.kind === "readiness") && bg.labs.length) parts.push(`Labs whose postings they are aiming at: ${bg.labs.join(", ")}.`);
  if ((q.needs ?? []).some((n) => n.kind === "project") && bg.project) {
    const p = bg.project;
    parts.push(
      [
        `# The candidate's project: ${p.title}`,
        `Question: ${p.question}`,
        `Why it matters: ${p.why}`,
        `Plan: ${p.plan}`,
        `Experiments:\n${p.experiments.map((e) => `- ${e.title}. Expected: ${e.expected}. Result: ${e.result ?? "(none yet)"}`).join("\n") || "(none)"}`,
        `Lab notebook (newest last):\n${p.notebook.slice(-6).map((n) => `- ${n.slice(0, 1200)}`).join("\n") || "(empty)"}`,
        p.writeupSummary ? `Write-up summary: ${p.writeupSummary}` : "",
      ].filter(Boolean).join("\n"),
    );
  }
  return parts.join("\n\n");
}

function transcript(turns: readonly Turn[]): string {
  return turns
    .map((t) => {
      const who = t.role === "interviewer" ? "Interviewer" : "Candidate";
      const code = t.code ? `\n\`\`\`python\n${t.code.slice(0, 12000)}\n\`\`\`` : "";
      const checks = t.checks?.length
        ? `\n(Checks run on this code: ${t.checks.map((c) => `${c.passed ? "passed" : "FAILED"}: ${c.name}${!c.passed && c.message ? ` (${c.message})` : ""}`).join("; ")})`
        : "";
      return `${who}: ${t.body || "(no words)"}${code}${checks}`;
    })
    .join("\n\n");
}

const rubricText = (q: Pick<InterviewQuestion, "rubric">) => q.rubric.map((c) => `- ${c.id}: ${c.text}`).join("\n");

// ---------------------------------------------------------------------------------------------
// The interviewer

export const TURN_SCHEMA = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["follow_up", "next"], description: "follow_up to probe further on this question; next to move on." },
    message: { type: "string", description: "The follow-up question, or a short neutral line closing this question." },
  },
  required: ["action", "message"],
  additionalProperties: false,
} as const;

export type TurnOutput = { action: "follow_up" | "next"; message: string };

export function interviewerSystem(mode: InterviewMode): string {
  return `You are playing the interviewer in a mock ${MODES[mode].title.toLowerCase()} interview at a frontier AI lab. The candidate is a single learner using Frontier, a private university, to prepare for these interviews. Behave like a fair, sharp interviewer: you want to find out what they really understand.

- After each answer, decide whether one more question on the same topic would reveal something the rubric cares about that the answer has not yet shown. If so, ask exactly one short follow-up question. If the answer already covers the rubric well, or it is clear the candidate cannot go further, move on.
- A follow-up probes a gap, asks for a concrete number, example or edge case, or asks them to justify a choice. Never answer the question for them, never hint at the rubric, never say whether they were right.
- Stay inside what the candidate has been taught: use only ideas from the lessons the question rests on and the material before them. Do not bring in methods, papers or terms beyond those.
- When moving on, say one short neutral line such as "Thanks, let's move on." Do not praise or criticise.

${STYLE}`;
}

export function turnRequest(q: InterviewQuestion, lessons: string[], bg: Background, turns: readonly Turn[], followUps: number): string {
  return [
    backgroundText(q, bg),
    `# The question\n${q.prompt}`,
    `# Lessons it rests on\n${lessons.map((l) => `- ${l}`).join("\n") || "(none: a question about the candidate themselves)"}`,
    `# Rubric (hidden from the candidate)\n${rubricText(q)}`,
    `# What a strong answer covers (hidden)\n${q.notes}`,
    `# The conversation on this question so far\n${transcript(turns)}`,
    followUps >= MAX_FOLLOW_UPS ? "You have used every follow-up. Move on." : `Follow-ups used: ${followUps} of ${MAX_FOLLOW_UPS}.`,
  ].filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------------------------
// Scoring

export const GRADE_SCHEMA = {
  type: "object",
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The criterion id from the rubric." },
          score: { type: "integer", description: `0 missing or wrong, 1 partial, 2 solid, ${SCORE_MAX} strong.` },
          evidence: { type: "string", description: "A short quote or close paraphrase from the answer that justifies the score, or 'not addressed'." },
          note: { type: "string", description: "One sentence to the candidate: what was missing or how to make it stronger." },
        },
        required: ["id", "score", "evidence", "note"],
        additionalProperties: false,
      },
    },
    feedback: { type: "string", description: "Two to four sentences to the candidate on the answer as a whole." },
    outline: { type: "string", description: "A strong answer in outline, as a short bullet list, for the candidate to compare with." },
  },
  required: ["criteria", "feedback", "outline"],
  additionalProperties: false,
} as const;

export type GradeOutput = { criteria: { id: string; score: number; evidence: string; note: string }[]; feedback: string; outline: string };

export const GRADER_SYSTEM = `You score one answer from a mock interview against its rubric, as a calibrated interviewer at a frontier AI lab would.

- Score every criterion: 0 missing or wrong, 1 partial or vague, 2 solid, ${SCORE_MAX} strong, precise and well justified. Judge only what the candidate said or wrote across the whole exchange, including follow-ups. Do not give credit for what they might have meant.
- Be strict but fair. A ${SCORE_MAX} should be rare and earned. Fluent words without the substance are a 1.
- For code, use the checks that were run on it as evidence of correctness, but also judge reasoning and communication.
- Evidence quotes the candidate. Notes and feedback speak to the candidate directly, kindly and specifically.
- The outline of a strong answer uses only ideas from the lessons the question rests on and the material before them.

${STYLE}`;

export function gradeRequest(q: InterviewQuestion, lessons: string[], bg: Background, turns: readonly Turn[]): string {
  return [
    backgroundText(q, bg),
    `# The question\n${q.prompt}`,
    `# Lessons it rests on\n${lessons.map((l) => `- ${l}`).join("\n") || "(none)"}`,
    `# Rubric\n${rubricText(q)}`,
    `# What a strong answer covers\n${q.notes}`,
    q.solution ? `# A reference solution\n\`\`\`python\n${q.solution}\n\`\`\`` : "",
    `# The exchange\n${transcript(turns)}`,
  ].filter(Boolean).join("\n\n");
}

/** Keeps one score per rubric criterion, clamped to 0..3; a criterion Parton skipped scores 0 as not addressed. */
export function acceptGrade(out: GradeOutput | null | undefined, q: Pick<InterviewQuestion, "rubric">): GradeOutput {
  const byId = new Map((out?.criteria ?? []).filter((c) => c && typeof c.id === "string").map((c) => [c.id.trim(), c]));
  return {
    criteria: q.rubric.map((c) => {
      const got = byId.get(c.id);
      const score = Number.isFinite(Number(got?.score)) ? Math.max(0, Math.min(SCORE_MAX, Math.round(Number(got!.score)))) : 0;
      return {
        id: c.id,
        score,
        evidence: String(got?.evidence ?? "not addressed").slice(0, 600),
        note: String(got?.note ?? "This was not addressed.").slice(0, 600),
      };
    }),
    feedback: String(out?.feedback ?? "").slice(0, 2000),
    outline: String(out?.outline ?? "").slice(0, 4000),
  };
}

// ---------------------------------------------------------------------------------------------
// Fresh questions, from mastered lessons only

export const WRITE_SCHEMA = {
  type: "object",
  properties: {
    prompt: { type: "string", description: "The question, as the interviewer would ask it." },
    lessons: { type: "array", items: { type: "string" }, description: "One to three lesson ids from the list that the question rests on." },
    notes: { type: "string", description: "What a strong answer covers, for the interviewer only." },
    minutes: { type: "integer", description: "Roughly how long a good spoken answer takes." },
    rubric: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "A short lower-case id, unique in this rubric." },
          text: { type: "string", description: "What a strong answer does, in one sentence." },
          lessons: { type: "array", items: { type: "string" }, description: "Lesson ids from the list behind this criterion." },
        },
        required: ["id", "text", "lessons"],
        additionalProperties: false,
      },
    },
  },
  required: ["prompt", "lessons", "notes", "minutes", "rubric"],
  additionalProperties: false,
} as const;

export type WriteOutput = { prompt: string; lessons: string[]; notes: string; minutes: number; rubric: { id: string; text: string; lessons: string[] }[] };

export function writerSystem(mode: InterviewMode): string {
  return `You write one new ${MODES[mode].title.toLowerCase()} interview question of the kind frontier AI labs ask, for a learner using Frontier, a private university.

- The question must rest only on lessons from the list, all of which the learner has mastered. Use no idea, method or term those lessons do not teach.
- Aim at the weak spots listed, if any, without copying an earlier question. Prefer "why" and "what would you do" over recall.
- Write three to five rubric criteria. Each says what a strong answer does and names the lessons behind it.

${STYLE}`;
}

export function writeRequest(options: readonly { id: string; title: string; course: string }[], weak: readonly string[], earlier: readonly string[]): string {
  return [
    `# Lessons the learner has mastered\n${options.map((o) => `- ${o.id}: ${o.title} (${o.course})`).join("\n")}`,
    weak.length ? `# Weak spots from earlier interviews\n${weak.map((w) => `- ${w}`).join("\n")}` : "",
    earlier.length ? `# Questions already in the bank (do not repeat)\n${earlier.map((e) => `- ${e}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}

/** A written question, if it is sound: it rests only on listed lessons and has a usable rubric. */
export function acceptWritten(out: WriteOutput | null | undefined, allowed: ReadonlySet<string>): Omit<InterviewQuestion, "id" | "mode"> | null {
  if (!out || typeof out.prompt !== "string" || out.prompt.trim().length < 20) return null;
  const lessons = [...new Set((out.lessons ?? []).map((l) => String(l).trim()))].filter((l) => allowed.has(l)).slice(0, 3);
  if (!lessons.length) return null;
  const ids = new Set<string>();
  const rubric = (out.rubric ?? [])
    .map((c) => ({
      id: String(c?.id ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 30),
      text: String(c?.text ?? "").trim().slice(0, 300),
      lessons: [...new Set((c?.lessons ?? []).map((l) => String(l).trim()))].filter((l) => allowed.has(l)),
    }))
    .filter((c) => c.id && c.text && !ids.has(c.id) && (ids.add(c.id), true))
    .slice(0, 5);
  if (rubric.length < 3) return null;
  return {
    prompt: out.prompt.trim().slice(0, 1200),
    lessons,
    notes: String(out.notes ?? "").slice(0, 2000),
    minutes: Math.max(2, Math.min(20, Math.round(Number(out.minutes) || 5))),
    rubric,
  };
}
