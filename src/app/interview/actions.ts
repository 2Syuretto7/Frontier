"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import type { AnswerResult } from "@/lib/interview/store";

const id = (v: unknown) => Math.floor(Number(v));

/** Starts a session in the chosen mode, or reopens the one under way. */
export async function startInterviewAction(form: FormData) {
  await requireOwner();
  const { isMode } = await import("@/lib/interview/core");
  const mode = String(form.get("mode") ?? "");
  if (!isMode(mode)) redirect("/interview");
  const { startSession } = await import("@/lib/interview/store");
  const result = await startSession(mode);
  if (!result.ok) redirect(`/interview?mode=${mode}&error=${encodeURIComponent(result.error)}`);
  redirect(`/interview/${result.id}`);
}

type Checks = { name: string; passed: boolean; message?: string }[];

/** Records an answer; the interviewer then follows up or moves on. When the last question is done, the session is scored. */
export async function answerAction(
  sessionId: number,
  input: { body: string; code?: string | null; checks?: Checks | null; seconds?: number | null; moveOn?: boolean },
): Promise<AnswerResult> {
  await requireOwner();
  const { answer } = await import("@/lib/interview/store");
  const checks = Array.isArray(input?.checks)
    ? input.checks.slice(0, 20).map((c) => ({ name: String(c?.name ?? "").slice(0, 200), passed: c?.passed === true, message: c?.message ? String(c.message).slice(0, 400) : undefined }))
    : null;
  return answer(id(sessionId), {
    body: String(input?.body ?? "").slice(0, 12_000),
    code: typeof input?.code === "string" ? input.code.slice(0, 30_000) : null,
    checks,
    seconds: Number.isFinite(Number(input?.seconds)) ? Math.max(0, Math.min(36_000, Math.round(Number(input.seconds)))) : null,
    moveOn: input?.moveOn === true,
  });
}

/** The checks for the coding question under way, sent only when the learner hands in code. They run in the browser. */
export async function interviewChecksAction(sessionId: number): Promise<{ name: string; code: string }[] | null> {
  await requireOwner();
  const { getQuestion, getSession } = await import("@/lib/interview/store");
  const session = await getSession(id(sessionId));
  if (!session || session.status !== "open") return null;
  const question = await getQuestion(session.questions[session.current]);
  return question?.checks?.map((c) => ({ name: c.name, code: c.code })) ?? null;
}

/** Ends the interview now and scores what was answered. */
export async function finishInterviewAction(sessionId: number) {
  await requireOwner();
  const { finish } = await import("@/lib/interview/store");
  await finish(id(sessionId));
  redirect(`/interview/${id(sessionId)}`);
}

/** Scores a session again after Parton could not finish scoring it. */
export async function scoreInterviewAction(form: FormData) {
  await requireOwner();
  const { score } = await import("@/lib/interview/store");
  const sessionId = id(form.get("session"));
  await score(sessionId);
  redirect(`/interview/${sessionId}`);
}

/** Drops the interview without scoring it. */
export async function abandonInterviewAction(form: FormData) {
  await requireOwner();
  const { abandon } = await import("@/lib/interview/store");
  await abandon(id(form.get("session")));
  redirect("/interview");
}
