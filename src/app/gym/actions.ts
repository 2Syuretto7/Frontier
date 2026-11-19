"use server";

import { requireOwner } from "@/lib/auth";
import type { DiagnoseResult, GymAttempt, GymStartResult, GymSubmitResult } from "@/lib/gym";
import type { Diagnosis } from "@/lib/gym-plan";
import type { EditorState, FreshResult, GymHintResult } from "@/lib/parton/gym";
import type { CaseReport } from "@/lib/parton/gym-prompts";

const known = async (caseId: unknown) => {
  const { CASE_BY_ID } = await import("@/content/gym");
  return CASE_BY_ID.has(String(caseId));
};

/** Starts an attempt at the case's current level. `variantId` starts that unused fresh case; `fallback` starts the case itself. */
export async function startCaseAction(caseId: string, opts: { variantId?: number; fallback?: boolean } = {}): Promise<GymStartResult> {
  await requireOwner();
  if (!(await known(caseId))) return { ok: false, error: "Could not start this case." };
  const { startAttempt } = await import("@/lib/gym");
  const variantId = opts?.variantId ? Math.floor(Number(opts.variantId)) : undefined;
  return startAttempt(String(caseId), { variantId, fallback: opts?.fallback === true });
}

/** A guess at the cause: one of the candidates at level 1, or a kind of bug and a function. */
export async function diagnoseAction(attemptId: number, input: Diagnosis): Promise<DiagnoseResult> {
  await requireOwner();
  const { diagnose } = await import("@/lib/gym");
  const d: Diagnosis = input && "cause" in input
    ? { cause: Math.floor(Number(input.cause)) }
    : { kind: String((input as { kind?: unknown })?.kind ?? "").slice(0, 40), fn: String((input as { fn?: unknown })?.fn ?? "").slice(0, 80) };
  return diagnose(Math.floor(Number(attemptId)), d);
}

/** The hidden tests, sent only once the cause has been named, for the browser to run on the fix. */
export async function caseTestsAction(caseId: string): Promise<{ name: string; code: string }[] | null> {
  await requireOwner();
  if (!(await known(caseId))) return null;
  const { testsForOpen } = await import("@/lib/gym");
  return testsForOpen(String(caseId));
}

export async function submitFixAction(attemptId: number, input: string): Promise<GymSubmitResult> {
  await requireOwner();
  const { parseCodeSubmission } = await import("@/lib/check");
  const sub = parseCodeSubmission(String(input).slice(0, 60_000));
  if (!sub) return { ok: false, error: "Press Submit fix in the editor to run the hidden tests on your script." };
  const { submitFix } = await import("@/lib/gym");
  return submitFix(Math.floor(Number(attemptId)), sub);
}

export async function giveUpCaseAction(attemptId: number): Promise<GymAttempt | null> {
  await requireOwner();
  const { giveUp } = await import("@/lib/gym");
  return giveUp(Math.floor(Number(attemptId)));
}

/** Parton's next hint on the attempt, reading the script and what it printed. */
export async function gymHintAction(attemptId: number, question: string, editor: EditorState): Promise<GymHintResult> {
  await requireOwner();
  const { gymHint } = await import("@/lib/parton/gym");
  const clean: EditorState = {
    source: String(editor?.source ?? "").slice(0, 20_000),
    output: String(editor?.output ?? "").slice(-6000),
    error: editor?.error ? String(editor.error).slice(0, 3000) : null,
  };
  return gymHint(Math.floor(Number(attemptId)), String(question ?? "").slice(0, 2000), clean);
}

/** Parton writes a fresh case of the same kind, which the browser then checks before it is used. */
export async function freshCaseAction(caseId: string, retryProblem: string | null = null): Promise<FreshResult> {
  await requireOwner();
  if (!(await known(caseId))) return { ok: false, error: "Unknown case." };
  const { writeFreshCase } = await import("@/lib/parton/gym");
  return writeFreshCase(String(caseId), retryProblem ? String(retryProblem).slice(0, 400) : null);
}

/** Records what the browser found when it checked a fresh case; it becomes ready only if it is sound. */
export async function settleFreshCaseAction(variantId: number, report: CaseReport): Promise<{ ok: boolean; problem: string | null }> {
  await requireOwner();
  const { getVariant, settleVariant } = await import("@/lib/gym");
  const { judgeCaseReport } = await import("@/lib/parton/gym-prompts");
  const v = await getVariant(Math.floor(Number(variantId)));
  if (!v || v.status !== "pending") return { ok: false, problem: "that case has already been checked" };
  const clean: CaseReport = {
    buggyError: typeof report?.buggyError === "string" ? report.buggyError.slice(0, 2000) : null,
    buggyFailed: report?.buggyFailed === true,
    fixedError: typeof report?.fixedError === "string" ? report.fixedError.slice(0, 2000) : null,
    fixedFailures: Array.isArray(report?.fixedFailures) ? report.fixedFailures.map(String).slice(0, 20) : ["no report"],
  };
  const problem = judgeCaseReport(clean);
  await settleVariant(v.id, problem === null, problem);
  return { ok: problem === null, problem };
}
