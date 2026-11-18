"use server";

import { redirect } from "next/navigation";
import {
  changePassphrase,
  createAccount,
  requireOwner,
  signIn,
  signOut,
  signOutEverywhere,
} from "@/lib/auth";
import { normalisePassphrase } from "@/lib/passphrase";

export type FormState = { error?: string; done?: string } | undefined;

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

export async function signUpAction(_: FormState, form: FormData): Promise<FormState> {
  const passphrase = text(form, "passphrase");
  if (normalisePassphrase(passphrase) !== normalisePassphrase(text(form, "confirm"))) return { error: "The two passphrases don't match." };
  const result = await createAccount(passphrase);
  if (!result.ok) return { error: result.error };
  redirect("/");
}

export async function signInAction(_: FormState, form: FormData): Promise<FormState> {
  const result = await signIn(text(form, "passphrase"));
  if (!result.ok) return { error: result.error };
  redirect("/");
}

export async function signOutAction() {
  await signOut();
  redirect("/signin");
}

export async function signOutEverywhereAction() {
  await requireOwner();
  await signOutEverywhere();
  redirect("/signin");
}

export async function changePassphraseAction(_: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const next = text(form, "next");
  if (normalisePassphrase(next) !== normalisePassphrase(text(form, "confirm"))) return { error: "The two new passphrases don't match." };
  const result = await changePassphrase(text(form, "current"), next);
  if (!result.ok) return { error: result.error };
  return { done: "Passphrase changed. Other devices have been signed out." };
}

export async function learnAction() {
  await requireOwner();
  await goToNextStep(false);
}

/** Leaving a review session: open a lesson, never another review session. */
export async function afterReviewAction() {
  await requireOwner();
  await goToNextStep(true);
}

/**
 * Opens the first item of today's queue: a lesson, Review, a drill or a project step. Leaving a review session
 * opens the first lesson in it instead, never another review. If the queue can't be built, Learn falls back to
 * the scheduler on its own.
 */
async function goToNextStep(afterReview: boolean) {
  const { nextStep, startLesson } = await import("@/lib/learning");
  let queue: import("@/lib/guide/core").TodayItem[] | null = null;
  try {
    const { today } = await import("@/lib/guide/store");
    queue = await today({ afterReview });
  } catch (error) {
    console.error("Today's queue unavailable:", error);
  }
  if (queue) {
    const { isLessonItem } = await import("@/lib/guide/core");
    const item = afterReview ? queue.find(isLessonItem) : queue[0];
    if (item?.kind === "continue" || item?.kind === "revisit") redirect(`/learn/${item.lessonId}`);
    if (item?.kind === "begin") {
      await startLesson(item.lessonId, item.guided ?? null);
      redirect(`/learn/${item.lessonId}`);
    }
    if (item?.kind === "review") redirect("/review");
    if (item?.kind === "drill") redirect(`/drills/${item.drillId}`);
    if (item?.kind === "project") redirect(`/projects/${item.projectId}`);
    redirect("/map");
  }
  const step = await nextStep({ afterReview });
  if (step.kind === "continue") redirect(`/learn/${step.lesson.id}`);
  if (step.kind === "review") redirect("/review");
  if (step.kind === "begin") {
    await startLesson(step.lesson.id, step.guided ?? null);
    redirect(`/learn/${step.lesson.id}`);
  }
  redirect("/map");
}

export type CheckResponse = {
  correct: boolean;
  message?: string;
  lessonMastered?: boolean;
};

export async function checkExerciseAction(
  exerciseId: string,
  input: string,
  context: "lesson" | "recall" | "review",
  attemptInSession: number,
): Promise<CheckResponse> {
  await requireOwner();
  const { attempt } = await import("@/lib/learning");
  return attempt(exerciseId, String(input).slice(0, 20000), context, Math.max(1, Math.floor(attemptInSession)));
}

/** The checks for a code exercise, sent only when the learner presses Check. They run in the learner's browser. */
export async function codeTestsAction(exerciseId: string): Promise<{ name: string; code: string }[] | null> {
  await requireOwner();
  const { EXERCISES } = await import("@/lib/curriculum");
  const answer = EXERCISES.get(String(exerciseId))?.exercise.answer;
  return answer?.kind === "code" ? answer.tests.map((t) => ({ name: t.name, code: t.code })) : null;
}

export async function askPartonAction(
  lessonId: string,
  exerciseId: string | null,
  message: string,
  workspace?: { source: string; error: string | null; output: string } | null,
) {
  await requireOwner();
  const { LESSON_BY_ID } = await import("@/lib/curriculum");
  const text = String(message ?? "").trim().slice(0, 4000);
  if (!LESSON_BY_ID.has(lessonId)) return { ok: false as const, error: "Unknown lesson." };
  if (!text) return { ok: false as const, error: "Write a question first." };
  const { askParton } = await import("@/lib/parton");
  const editor = workspace && typeof workspace.source === "string"
    ? { source: workspace.source.slice(0, 8000), error: typeof workspace.error === "string" ? workspace.error.slice(0, 2000) : null, output: String(workspace.output ?? "").slice(0, 2000) }
    : null;
  return askParton(lessonId, exerciseId ? String(exerciseId) : null, text, editor);
}

export async function setPaceAction(form: FormData) {
  await requireOwner();
  const pace = Number(form.get("pace"));
  if ([1, 2, 3].includes(pace)) {
    const { setPace } = await import("@/lib/learning");
    await setPace(pace);
  }
  redirect("/settings");
}
