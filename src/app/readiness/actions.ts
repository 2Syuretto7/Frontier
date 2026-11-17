"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";

export type ReadinessState = { error?: string; done?: string; at?: number } | undefined;

const text = (form: FormData, key: string) => String(form.get(key) ?? "");
const id = (form: FormData, key = "id") => Math.floor(Number(form.get(key)));

function refresh() {
  revalidatePath("/readiness");
  revalidatePath("/");
}

export async function addPostingAction(_: ReadinessState, form: FormData): Promise<ReadinessState> {
  await requireOwner();
  const { addPosting } = await import("@/lib/readiness/store");
  const result = await addPosting({ company: text(form, "company"), role: text(form, "role"), url: text(form, "url"), body: text(form, "body") });
  if (!result.ok) return { error: result.error };
  refresh();
  return { done: result.message, at: Date.now() };
}

export async function removePostingAction(form: FormData) {
  await requireOwner();
  const { removePosting } = await import("@/lib/readiness/store");
  await removePosting(id(form));
  refresh();
}

export async function extractSkillsAction(_: ReadinessState): Promise<ReadinessState> {
  await requireOwner();
  const { extractSkills } = await import("@/lib/readiness/store");
  const result = await extractSkills();
  if (!result.ok) return { error: result.error };
  refresh();
  return { done: result.message, at: Date.now() };
}

export async function startNewCheckAction() {
  await requireOwner();
  const { startNewCheck } = await import("@/lib/readiness/store");
  await startNewCheck();
  refresh();
}

export async function setLevelAction(form: FormData) {
  await requireOwner();
  const { setLevel } = await import("@/lib/readiness/store");
  await setLevel(id(form, "skill"), Math.floor(Number(form.get("level"))));
  refresh();
}

export async function addEvidenceAction(_: ReadinessState, form: FormData): Promise<ReadinessState> {
  await requireOwner();
  const { addEvidence } = await import("@/lib/readiness/store");
  const result = await addEvidence(id(form, "skill"), { kind: text(form, "kind"), title: text(form, "title"), url: text(form, "url") });
  if (!result.ok) return { error: result.error };
  refresh();
  return { done: "Evidence added.", at: Date.now() };
}

export async function removeEvidenceAction(form: FormData) {
  await requireOwner();
  const { removeEvidence } = await import("@/lib/readiness/store");
  await removeEvidence(id(form));
  refresh();
}

export async function removeSkillAction(form: FormData) {
  await requireOwner();
  const { removeSkill } = await import("@/lib/readiness/store");
  await removeSkill(id(form));
  refresh();
}
