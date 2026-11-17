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

export type FindState = { error?: string; done?: string; count?: number };

/** Saves the target role, finds current postings for it at every lab, and puts them in place of the old ones. */
export async function findPostingsAction(role: string): Promise<FindState> {
  await requireOwner();
  const { setRole, replacePostings } = await import("@/lib/readiness/store");
  const { findPostings } = await import("@/lib/readiness/find");
  const { PartonError } = await import("@/lib/parton/claude");
  const target = String(role ?? "").trim();
  if (target.length < 3) return { error: "Say which role you are aiming for." };
  await setRole(target);
  try {
    const found = await findPostings(target);
    if (found.openings.length === 0) return { error: "Parton couldn't find any matching postings. Try describing the role more broadly." };
    await replacePostings(found.openings);
    refresh();
    const labs = found.labs.filter((l) => l.count > 0).map((l) => `${l.lab} ${l.count}`).join(", ");
    const missed = found.labs.filter((l) => l.count === 0).map((l) => l.lab);
    return {
      done: `Found ${found.openings.length} postings (${labs}).${missed.length ? ` None matched or could be read at ${missed.join(", ")}.` : ""}`,
      count: found.openings.length,
    };
  } catch (error) {
    console.error("Readiness: finding postings failed:", error);
    return { error: error instanceof PartonError ? error.message : "Finding postings failed. Please try again." };
  }
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
