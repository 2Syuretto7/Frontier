import "server-only";
import { GRAPH } from "@/lib/curriculum";
import { CASE_BY_ID } from "@/content/gym";
import { fixedProgram, KIND_BY_ID, type GymCase } from "@/content/gym/types";
import {
  getAttempt, getVariant, gymQuery, guessesOf, lastSubmission, saveVariant, sessionFor, variantsFor, type GymVariant,
} from "@/lib/gym";
import { PartonError, partonConnected, structured } from "./claude";
import { guard } from "./index";
import { VOICE } from "./prompts";
import { toPlainText } from "./plaintext";
import { renderParton } from "./render";
import {
  CASE_SCHEMA, CASE_SYSTEM, FIX_RUNGS, GYM_HINT_RULES, GYM_HINT_SCHEMA, GYM_RUNGS, acceptCase, gymRungFor, gymStateText,
  type CaseOutput, type GymHintOutput,
} from "./gym-prompts";

const FALLBACK = "Pick one number the script could print that would tell two of your ideas apart, print it, and see which idea survives.";

const lessonList = (ids: readonly string[]) => ids.map((id) => `- ${id}: ${GRAPH.nodes.get(id)?.title ?? id}`).join("\n");

/** The case as the hint writer reads it: the symptom and the script as set. Never the cause, fix or explanation. */
function caseText(c: GymCase, variant: GymVariant | null): string {
  return variant
    ? [`# The case: "${variant.title}"`, `## What the learner was told\n${variant.symptom}`, `## The script as set\n${variant.program}`,
      `## Hidden tests (names only)\n${variant.tests.map((t) => `- ${t.name}`).join("\n")}`].join("\n\n")
    : [`# The case: "${c.title}"`, `## What the learner was told\n${toPlainText(c.symptom)}`, `## The script as set\n${c.program}`,
      `## Hidden tests (names only)\n${c.tests.map((t) => `- ${t.name}`).join("\n")}`].join("\n\n");
}

/** What the give-away check protects: the cause, where it is, the fix and why. */
function protectedText(c: GymCase, variant: GymVariant | null): string {
  const kind = KIND_BY_ID.get(c.kind)?.name ?? c.kind;
  return variant
    ? `The bug is a ${kind} bug in the function ${variant.suspect}. Explanation: ${variant.explanation}\n\nFixed script:\n${variant.fixed}`
    : `The bug is a ${kind} bug in the function ${c.suspect}. The cause: ${c.causes.find((x) => x.right)?.text}\nExplanation: ${toPlainText(c.explanation)}\n\nFixed script:\n${fixedProgram(c)}`;
}

export type GymHint = { id: number; rung: number; html: string };

export async function hintsFor(attemptId: number): Promise<GymHint[]> {
  const rows = await gymQuery<{ id: number; rung: number; body: string }>("SELECT id, rung, body FROM gym_hints WHERE attempt_id = $1 ORDER BY at, id", [attemptId]);
  return rows.map((r) => ({ id: Number(r.id), rung: Number(r.rung), html: renderParton(r.body) }));
}

export type GymHintResult = { ok: true; hint: GymHint } | { ok: false; error: string; offline?: boolean };

export type EditorState = { source: string; output: string; error: string | null };

/** Parton gives the next hint on the attempt: on the hunt before the cause is named, on the fix after. */
export async function gymHint(attemptId: number, question: string, editor: EditorState): Promise<GymHintResult> {
  if (!partonConnected()) return { ok: false, offline: true, error: "Parton is not connected yet." };
  const a = await getAttempt(attemptId);
  if (!a) return { ok: false, error: "That attempt no longer exists." };
  if (a.finishedAt) return { ok: false, error: "This attempt has ended. The explanation is available instead." };
  const c = CASE_BY_ID.get(a.caseId)!;
  const variant = a.variantId ? await getVariant(a.variantId) : null;
  const session = await sessionFor(a);
  const earlier = await gymQuery<{ rung: number; body: string }>("SELECT rung, body FROM gym_hints WHERE attempt_id = $1 ORDER BY at, id", [attemptId]);
  const rungs = a.diagnosed ? FIX_RUNGS : GYM_RUNGS;
  const sinceDiagnosis = a.diagnosed ? earlier.filter((h) => h.rung > 100).length : earlier.length;
  const rung = gymRungFor(sinceDiagnosis);
  const guesses = (await guessesOf(attemptId)).filter((g) => !g.right).map((g) =>
    g.cause !== undefined ? session.causes?.[g.cause] ?? "a candidate cause" : `a ${KIND_BY_ID.get(g.kind as never)?.name.toLowerCase() ?? g.kind} bug in ${g.fn}`);
  const sub = a.diagnosed ? await lastSubmission(attemptId) : null;
  const context = [
    gymStateText({
      source: editor.source || sub?.source || session.program,
      output: editor.output,
      error: editor.error,
      diagnosed: a.diagnosed,
      guesses,
      failing: sub ? sub.results.filter((r) => !r.passed) : [],
      minutesIn: (Date.now() - Date.parse(a.startedAt)) / 60_000,
      limitMinutes: a.limitMinutes,
    }),
    earlier.length ? `Your earlier hints on this attempt, oldest first (do not repeat them; build on them):\n${earlier.map((h) => `- ${h.body}`).join("\n")}` : "This is your first hint on this attempt.",
    `Allowed level: ${rungs[rung - 1]} Go no further than this level.`,
  ].join("\n\n");
  try {
    const draft = await structured<GymHintOutput>({
      system: `${VOICE}\n\n${GYM_HINT_RULES}\n\nThe hint ladder:\n${rungs.map((r) => `- ${r}`).join("\n")}\n\n${caseText(c, variant)}`,
      schema: GYM_HINT_SCHEMA,
      effort: "medium",
      maxTokens: 10000,
      messages: [{ role: "user", content: `[Context for Parton, not written by the learner]\n${context}\n\n[The learner writes]\n${question.trim().slice(0, 2000) || "Where should I look?"}` }],
    });
    const reply = (await guard(draft.reply, protectedText(c, variant), rungs[rung - 1], FALLBACK)) || FALLBACK;
    // Rungs on the fix are stored above 100, so the ladder restarts once the cause is named.
    const stored = a.diagnosed ? 100 + rung : rung;
    const rows = await gymQuery<{ id: number }>("INSERT INTO gym_hints (attempt_id, rung, body) VALUES ($1, $2, $3) RETURNING id", [attemptId, stored, reply]);
    return { ok: true, hint: { id: Number(rows[0].id), rung: stored, html: renderParton(reply) } };
  } catch (error) {
    if (error instanceof PartonError) return { ok: false, error: error.message };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------
// Fresh cases

/** What the browser needs to check a fresh case before its clock starts. */
export type CaseCheck = { id: number; program: string; fixed: string; tests: { name: string; code: string }[] };

export type FreshResult = { ok: true; check: CaseCheck } | { ok: false; error: string; offline?: boolean };

export function caseCheck(v: GymVariant): CaseCheck {
  const prelude = v.prelude ? `${v.prelude}\n` : "";
  return { id: v.id, program: v.program, fixed: v.fixed, tests: v.tests.map((t) => ({ name: t.name, code: prelude + t.code })) };
}

/** Parton writes a fresh case with the same kind of bug as an authored one, stored as pending for the browser to check. */
export async function writeFreshCase(caseId: string, retryProblem: string | null = null): Promise<FreshResult> {
  if (!partonConnected()) return { ok: false, offline: true, error: "Parton is not connected, so it cannot write a fresh case." };
  const c = CASE_BY_ID.get(caseId);
  if (!c) return { ok: false, error: "Unknown case." };
  const used = (await variantsFor(caseId)).filter((v) => v.status !== "rejected");
  const pending = used.find((v) => v.status === "pending");
  if (pending && !retryProblem) return { ok: true, check: caseCheck(pending) };
  const kind = KIND_BY_ID.get(c.kind)!;
  const original = [
    `# Original case: "${c.title}"`,
    `Kind of bug: ${kind.name}. ${kind.about}`,
    `## Lessons the learner has mastered for it\n${lessonList(c.lessons)}`,
    `## Symptom\n${toPlainText(c.symptom)}`,
    `## Buggy script\n${c.program}`,
    `## Fixed script\n${fixedProgram(c)}`,
    `## The suspect function\n${c.suspect}`,
    `## The cause\n${c.causes.find((x) => x.right)?.text}`,
    `## Explanation\n${toPlainText(c.explanation)}`,
    c.prelude ? `## Prelude\n${c.prelude}` : "",
    `## Hidden tests\n${c.tests.map((t) => `### ${t.name}\n${t.code}`).join("\n\n")}`,
  ].filter(Boolean).join("\n\n");
  const ask = [
    `Write a fresh ${kind.name.toLowerCase()} case. The learner has solved the original cleanly.`,
    used.length ? `Fresh cases already written, whose settings and mistakes you must not repeat:\n${used.map((v) => `- ${v.title}: ${v.summary}`).join("\n")}` : "",
    retryProblem ? `Your last fresh case was rejected because ${retryProblem}. Avoid that.` : "",
  ].filter(Boolean).join("\n\n");
  let out: CaseOutput;
  try {
    out = await structured<CaseOutput>({
      system: `${CASE_SYSTEM}\n\n${original}`,
      schema: CASE_SCHEMA,
      effort: "medium",
      maxTokens: 32000,
      messages: [{ role: "user", content: ask }],
    });
  } catch (error) {
    if (error instanceof PartonError) return { ok: false, error: error.message };
    throw error;
  }
  const checked = acceptCase(out);
  if (!checked.ok) return { ok: false, error: `Parton's case was not usable: ${checked.problem}.` };
  const f = checked.fresh;
  const saved = await saveVariant({
    caseId, title: f.title, summary: f.summary, symptom: f.symptom, program: f.program, fixed: f.fixed, suspect: f.suspect,
    explanation: f.explanation, prelude: f.prelude, tests: f.tests, minutes: f.minutes,
  });
  return { ok: true, check: caseCheck(saved) };
}
