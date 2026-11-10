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
  const { nextStep, startLesson } = await import("@/lib/learning");
  const step = await nextStep();
  if (step.kind === "continue") redirect(`/learn/${step.lesson.id}`);
  if (step.kind === "review") redirect("/review");
  if (step.kind === "begin") {
    await startLesson(step.lesson.id);
    redirect(`/learn/${step.lesson.id}`);
  }
  redirect("/");
}

export type CheckResponse = {
  correct: boolean;
  message?: string;
  lessonMastered?: boolean;
  verdict?: "accepted" | "revise" | "pending";
  feedbackHtml?: string;
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

export type TeachBackResponse = {
  ok: boolean;
  lessonMastered?: boolean;
  error?: string;
  review?: { strength: string; questions: string[] };
  reviewError?: string;
};

export async function teachBackAction(lessonId: string, body: string): Promise<TeachBackResponse> {
  await requireOwner();
  const { LESSON_BY_ID } = await import("@/lib/curriculum");
  if (!LESSON_BY_ID.has(lessonId)) return { ok: false, error: "Unknown lesson." };
  const text = String(body).trim().slice(0, 20000);
  if (text.split(/\s+/).length < 25) return { ok: false, error: "Write at least a few sentences, about 25 words or more." };
  const { saveTeachBack } = await import("@/lib/learning");
  const lessonMastered = await saveTeachBack(lessonId, text);
  const { PartonError, partonConnected, renderReview, reviewTeachBack } = await import("@/lib/parton");
  if (!partonConnected()) return { ok: true, lessonMastered };
  try {
    return { ok: true, lessonMastered, review: renderReview(await reviewTeachBack(lessonId, text)) };
  } catch (error) {
    if (error instanceof PartonError) return { ok: true, lessonMastered, reviewError: error.message };
    throw error;
  }
}

export async function askPartonAction(lessonId: string, exerciseId: string | null, message: string) {
  await requireOwner();
  const { LESSON_BY_ID } = await import("@/lib/curriculum");
  const text = String(message ?? "").trim().slice(0, 4000);
  if (!LESSON_BY_ID.has(lessonId)) return { ok: false as const, error: "Unknown lesson." };
  if (!text) return { ok: false as const, error: "Write a question first." };
  const { askParton } = await import("@/lib/parton");
  return askParton(lessonId, exerciseId ? String(exerciseId) : null, text);
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
