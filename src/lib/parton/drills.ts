import "server-only";
import { query } from "@/lib/db";
import { DRILL_BY_ID } from "@/content/drills";
import {
  getAttempt, getVariant, lastSubmission, saveVariant, variantsFor, type DrillVariant,
} from "@/lib/drills";
import { levelInfo } from "@/lib/drill-plan";
import { PartonError, partonConnected, structured } from "./claude";
import { guard } from "./index";
import { VOICE } from "./prompts";
import { toPlainText } from "./plaintext";
import { renderParton } from "./render";
import {
  DRILL_HINT_RULES, DRILL_HINT_SCHEMA, DRILL_RUNGS, VARIANT_SCHEMA, VARIANT_SYSTEM, acceptVariant, drillRungFor,
  submissionText, type DrillHintOutput, type VariantOutput,
} from "./drill-prompts";

const FALLBACK = "Read the name and message of the first failing test again, then find the line of your code that handles that case. What does it do there, compared with what the brief asks?";

/** The task, starter and test names of an attempt, as Parton reads them. Never the solution or the tests' code. */
function taskText(drillId: string, variant: DrillVariant | null): string {
  const drill = DRILL_BY_ID.get(drillId)!;
  if (variant) {
    return [
      `# The drill: "${variant.title}" (a variant of "${drill.title}")`,
      `## Brief\n${variant.brief}`,
      `## The editor started with\n${variant.starter}`,
      `## Hidden tests (names only)\n${variant.tests.map((t) => `- ${t.name}`).join("\n")}`,
    ].join("\n\n");
  }
  return [
    `# The drill: "${drill.title}"`,
    `Skills: ${drill.skills.join(", ")}.`,
    `## Brief\n${toPlainText(drill.brief)}`,
    `## The editor started with\n${drill.starter}`,
    drill.setup ? `## Setup run before their program (shown in the brief)\n${drill.setup}` : "",
    `## Hidden tests (names only)\n${drill.tests.map((t) => `- ${t.name}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");
}

/** What the give-away check protects: the reference solution and the hidden tests' code. */
function protectedText(drillId: string, variant: DrillVariant | null): string {
  const drill = DRILL_BY_ID.get(drillId)!;
  const solution = variant ? variant.solution : drill.solution;
  const tests = variant ? variant.tests : drill.tests;
  return `Drill reference solution (the learner must write this themselves; a hint may not give its code or decisive lines):\n${solution}\n\nHidden tests:\n${tests.map((t) => `- ${t.name}: ${t.code}`).join("\n")}`;
}

export type DrillHint = { id: number; rung: number; html: string };

export async function hintsFor(attemptId: number): Promise<DrillHint[]> {
  const rows = await query<{ id: number; rung: number; body: string }>(
    "SELECT id, rung, body FROM drill_hints WHERE attempt_id = $1 ORDER BY at, id",
    [attemptId],
  );
  return rows.map((r) => ({ id: Number(r.id), rung: Number(r.rung), html: renderParton(r.body) }));
}

export type ExplainResult = { ok: true; hint: DrillHint } | { ok: false; error: string; offline?: boolean };

/** Parton explains why the last submission's hidden tests failed, one rung further each time it is asked. */
export async function explainFailure(attemptId: number, question: string): Promise<ExplainResult> {
  if (!partonConnected()) return { ok: false, offline: true, error: "Parton is not connected yet." };
  const attempt = await getAttempt(attemptId);
  if (!attempt) return { ok: false, error: "That attempt no longer exists." };
  if (attempt.finishedAt) return { ok: false, error: "This attempt has ended. The reference solution is available instead." };
  const sub = await lastSubmission(attemptId);
  if (!sub) return { ok: false, error: "Submit your code first, so Parton can see which hidden tests fail." };
  const variant = attempt.variantId ? await getVariant(attempt.variantId) : null;
  const earlier = await query<{ rung: number; body: string }>("SELECT rung, body FROM drill_hints WHERE attempt_id = $1 ORDER BY at, id", [attemptId]);
  const rung = drillRungFor(earlier.length);
  const seconds = (Date.now() - Date.parse(attempt.startedAt)) / 1000;

  const context = [
    submissionText(sub.source, sub.results, seconds, attempt.limitMinutes),
    earlier.length
      ? `Your earlier hints on this attempt, oldest first (do not repeat them; build on them):\n${earlier.map((h) => `- ${h.body}`).join("\n")}`
      : "This is your first hint on this attempt.",
    `Allowed level: ${DRILL_RUNGS[rung - 1]} Go no further than this level.`,
  ].join("\n\n");
  const ask = question.trim() || "Why are these hidden tests failing?";

  try {
    const draft = await structured<DrillHintOutput>({
      system: `${VOICE}\n\n${DRILL_HINT_RULES}\n\nThe drill hint ladder:\n${DRILL_RUNGS.map((r) => `- ${r}`).join("\n")}\n\n${taskText(attempt.drillId, variant)}`,
      schema: DRILL_HINT_SCHEMA,
      effort: "medium",
      maxTokens: 10000,
      messages: [{ role: "user", content: `[Context for Parton, not written by the learner]\n${context}\n\n[The learner writes]\n${ask.slice(0, 2000)}` }],
    });
    const reply = (await guard(draft.reply, protectedText(attempt.drillId, variant), DRILL_RUNGS[rung - 1], FALLBACK)) || FALLBACK;
    const rows = await query<{ id: number }>(
      "INSERT INTO drill_hints (attempt_id, rung, body) VALUES ($1, $2, $3) RETURNING id",
      [attemptId, rung, reply],
    );
    return { ok: true, hint: { id: Number(rows[0].id), rung, html: renderParton(reply) } };
  } catch (error) {
    if (error instanceof PartonError) return { ok: false, error: error.message };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------
// Variants

/** What the browser needs to check a new variant before it is used. Sent once, before its clock ever starts. */
export type VariantCheck = {
  id: number;
  setup?: string;
  solution: string;
  starter: string;
  tests: { name: string; code: string }[];
  mutants: { code: string; why: string }[];
};

export type GenerateResult = { ok: true; check: VariantCheck } | { ok: false; error: string; offline?: boolean };

/** Parton writes a new variant of a drill and stores it as pending, for the browser to check. */
export async function generateVariant(drillId: string, level: number, retryProblem: string | null = null): Promise<GenerateResult> {
  if (!partonConnected()) return { ok: false, offline: true, error: "Parton is not connected, so it cannot write a variant." };
  const drill = DRILL_BY_ID.get(drillId);
  if (!drill) return { ok: false, error: "Unknown drill." };
  const used = (await variantsFor(drillId)).filter((v) => v.status !== "rejected");
  // A variant written earlier but never checked (the page was closed mid-check) is checked before writing another.
  const pending = used.find((v) => v.status === "pending");
  if (pending && !retryProblem) return { ok: true, check: variantCheck(pending) };
  const missed = await query<{ last_results: unknown }>(
    "SELECT last_results FROM drill_attempts WHERE drill_id = $1 AND last_results IS NOT NULL ORDER BY started_at DESC LIMIT 6",
    [drillId],
  );
  const failing = [...new Set(missed.flatMap((r) => {
    const v = typeof r.last_results === "string" ? JSON.parse(r.last_results) : r.last_results;
    return Array.isArray(v) ? v.filter((x: { passed?: boolean }) => !x.passed).map((x: { name: string }) => x.name) : [];
  }))].slice(0, 8);

  const original = [
    `# Original drill: "${drill.title}" (${drill.minutes} minutes)`,
    `Summary: ${drill.summary}`,
    `Skills: ${drill.skills.join(", ")}`,
    `## Brief\n${toPlainText(drill.brief)}`,
    `## Starter\n${drill.starter}`,
    `## Reference solution\n${drill.solution}`,
    drill.setup ? `## Setup\n${drill.setup}` : "",
    drill.prelude ? `## Prelude\n${drill.prelude}` : "",
    `## Hidden tests\n${drill.tests.map((t) => `### ${t.name}\n${t.code}`).join("\n\n")}`,
  ].filter(Boolean).join("\n\n");
  const ask = [
    `Write a new variant at level ${level} (${levelInfo(level).name}). The learner has passed the original inside its time at the lower levels.`,
    used.length ? `Twists already used, which you must not repeat:\n${used.map((v) => `- ${v.title}: ${v.twist}`).join("\n")}` : "No variant has been written yet.",
    failing.length ? `Hidden tests the learner has failed on this drill before (a twist that revisits these ideas is welcome): ${failing.join("; ")}.` : "",
    retryProblem ? `Your last attempt at a variant was rejected because ${retryProblem}. Avoid that.` : "",
  ].filter(Boolean).join("\n\n");

  let out: VariantOutput;
  try {
    out = await structured<VariantOutput>({
      system: `${VARIANT_SYSTEM}\n\n${original}`,
      schema: VARIANT_SCHEMA,
      effort: "medium",
      maxTokens: 32000,
      messages: [{ role: "user", content: ask }],
    });
  } catch (error) {
    if (error instanceof PartonError) return { ok: false, error: error.message };
    throw error;
  }
  const checked = acceptVariant(out);
  if (!checked.ok) return { ok: false, error: `Parton's variant was not usable: ${checked.problem}.` };
  const v = checked.variant;
  const saved = await saveVariant({
    drillId, title: v.title, summary: v.summary, twist: v.twist, brief: v.brief, minutes: v.minutes, starter: v.starter,
    solution: v.solution, prelude: v.prelude, setup: v.setup, tests: v.tests, mutants: v.mutants,
  });
  return { ok: true, check: variantCheck(saved) };
}

export function variantCheck(v: DrillVariant): VariantCheck {
  const prelude = v.prelude ? `${v.prelude}\n` : "";
  return {
    id: v.id,
    setup: v.setup || undefined,
    solution: v.solution,
    starter: v.starter,
    tests: v.tests.map((t) => ({ name: t.name, code: prelude + t.code })),
    mutants: v.mutants.map((m) => ({ code: v.solution.replace(m.from, m.to), why: m.why })),
  };
}

