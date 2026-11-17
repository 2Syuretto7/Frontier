"use server";

import { requireOwner } from "@/lib/auth";
import type { Attempt, StartResult, SubmitResult } from "@/lib/drills";
import type { ExplainResult, GenerateResult } from "@/lib/parton/drills";
import type { VariantReport } from "@/lib/parton/drill-prompts";

/**
 * Starts an attempt at the drill's current level. `variantId` starts that unused variant; `fallback` starts the
 * drill itself when a variant is due but none can be made.
 */
export async function startDrillAction(drillId: string, opts: { variantId?: number; fallback?: boolean } = {}): Promise<StartResult> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  if (!DRILL_BY_ID.has(String(drillId))) return { ok: false, error: "Could not start this drill." };
  const { startAttempt } = await import("@/lib/drills");
  const variantId = opts?.variantId ? Math.floor(Number(opts.variantId)) : undefined;
  return startAttempt(String(drillId), { variantId, fallback: opts?.fallback === true });
}

/** The hidden tests, sent only for an attempt that is under way, when the learner presses Submit. They run in the browser. */
export async function drillTestsAction(drillId: string): Promise<{ name: string; code: string }[] | null> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  if (!DRILL_BY_ID.has(String(drillId))) return null;
  const { testsForOpen } = await import("@/lib/drills");
  return testsForOpen(String(drillId));
}

export async function submitDrillAction(attemptId: number, input: string): Promise<SubmitResult> {
  await requireOwner();
  const { parseCodeSubmission } = await import("@/lib/check");
  const sub = parseCodeSubmission(String(input).slice(0, 60_000));
  if (!sub) return { ok: false, error: "Press Submit in the editor to run the hidden tests on your code." };
  const { submitAttempt } = await import("@/lib/drills");
  return submitAttempt(Math.floor(Number(attemptId)), sub);
}

export async function giveUpDrillAction(attemptId: number): Promise<Attempt | null> {
  await requireOwner();
  const { giveUp } = await import("@/lib/drills");
  return giveUp(Math.floor(Number(attemptId)));
}

/** The reference solution, once any attempt at this drill (or at this variant) has ended. */
export async function drillSolutionAction(drillId: string, variantId: number | null = null): Promise<string | null> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  const drill = DRILL_BY_ID.get(String(drillId));
  if (!drill) return null;
  const { canSeeSolution, getVariant, variantSolution } = await import("@/lib/drills");
  if (variantId) {
    const v = await getVariant(Math.floor(Number(variantId)));
    return v && v.drillId === drill.id ? variantSolution(v.id) : null;
  }
  return (await canSeeSolution(drill.id)) ? drill.solution : null;
}

/** Parton explains, with a hint, why the hidden tests failed on the attempt's last submission. */
export async function explainDrillAction(attemptId: number, question: string): Promise<ExplainResult> {
  await requireOwner();
  const { explainFailure } = await import("@/lib/parton/drills");
  return explainFailure(Math.floor(Number(attemptId)), String(question ?? "").slice(0, 2000));
}

/** Parton writes a new variant of the drill, which the browser then checks before it is used. */
export async function generateVariantAction(drillId: string, retryProblem: string | null = null): Promise<GenerateResult> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  if (!DRILL_BY_ID.has(String(drillId))) return { ok: false, error: "Unknown drill." };
  const { levelOf } = await import("@/lib/drills");
  const { generateVariant } = await import("@/lib/parton/drills");
  const id = String(drillId);
  return generateVariant(id, Math.max(4, await levelOf(id)), retryProblem ? String(retryProblem).slice(0, 400) : null);
}

/** Records what the browser found when it checked a new variant; it becomes ready only if it is sound. */
export async function settleVariantAction(variantId: number, report: VariantReport): Promise<{ ok: boolean; problem: string | null }> {
  await requireOwner();
  const { getVariant, settleVariant } = await import("@/lib/drills");
  const { judgeReport } = await import("@/lib/parton/drill-prompts");
  const v = await getVariant(Math.floor(Number(variantId)));
  if (!v || v.status !== "pending") return { ok: false, problem: "that variant has already been checked" };
  const clean: VariantReport = {
    solutionFailures: Array.isArray(report?.solutionFailures) ? report.solutionFailures.map(String).slice(0, 20) : ["no report"],
    solutionError: typeof report?.solutionError === "string" ? report.solutionError.slice(0, 2000) : null,
    starterFailed: report?.starterFailed === true,
    caught: Array.isArray(report?.caught) ? report.caught.map((c) => c === true) : [],
  };
  const problem = judgeReport(clean, v.mutants.length);
  await settleVariant(v.id, problem === null, problem);
  return { ok: problem === null, problem };
}
