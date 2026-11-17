"use server";

import { requireOwner } from "@/lib/auth";
import type { Attempt, SubmitResult } from "@/lib/drills";

export async function startDrillAction(drillId: string): Promise<Attempt | null> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  if (!DRILL_BY_ID.has(String(drillId))) return null;
  const { startAttempt } = await import("@/lib/drills");
  return startAttempt(String(drillId));
}

/** The hidden tests, sent only for an attempt that is under way, when the learner presses Submit. They run in the browser. */
export async function drillTestsAction(drillId: string): Promise<{ name: string; code: string }[] | null> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  const drill = DRILL_BY_ID.get(String(drillId));
  if (!drill) return null;
  const { openAttempt } = await import("@/lib/drills");
  if (!(await openAttempt(drill.id))) return null;
  const { drillTests } = await import("@/content/drills/tests");
  return drillTests(drill);
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

/** The reference solution, once any attempt at this drill has ended. */
export async function drillSolutionAction(drillId: string): Promise<string | null> {
  await requireOwner();
  const { DRILL_BY_ID } = await import("@/content/drills");
  const drill = DRILL_BY_ID.get(String(drillId));
  if (!drill) return null;
  const { canSeeSolution } = await import("@/lib/drills");
  return (await canSeeSolution(drill.id)) ? drill.solution : null;
}
