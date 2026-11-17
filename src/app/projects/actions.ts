"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";

export type ProjectFormState = { ok?: boolean; error?: string; done?: string } | undefined;

const STAGE_KEYS = ["title", "question", "why", "plan", "killCriterion", "writeupUrl", "writeupSummary", "repoUrl"];

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

/** Every change to a project goes through here, named by the form's `op`. */
export async function projectAction(form: FormData): Promise<ProjectFormState> {
  await requireOwner();
  const projects = await import("@/lib/projects");
  const op = text(form, "op");
  const id = Number(text(form, "projectId"));

  if (op === "start") {
    const result = await projects.startProject(text(form, "title"));
    if (!result.ok) return { error: result.error };
    revalidatePath("/projects");
    redirect(`/projects/${result.id}`);
  }

  let result: { ok: boolean; error?: string; published?: boolean };
  let done: string | undefined;
  switch (op) {
    case "save":
    case "advance": {
      // A stage form's two buttons: Save, and Save and move on. Moving on saves first, then checks the stage.
      const values: Record<string, string> = {};
      for (const key of STAGE_KEYS) if (form.has(key)) values[key] = text(form, key);
      result = Object.keys(values).length ? await projects.saveStage(id, values) : { ok: true };
      if (result.ok && op === "advance") result = await projects.advance(id);
      else done = "Saved.";
      break;
    }
    case "experiment":
      result = await projects.addExperiment(id, text(form, "title"), text(form, "expected"));
      break;
    case "result":
      result = await projects.recordResult(id, Number(text(form, "experimentId")), text(form, "result"));
      break;
    case "note":
      result = await projects.addNotebookEntry(id, text(form, "body"));
      break;
    case "kill":
      result = await projects.killProject(id, text(form, "postmortem"));
      break;
    default:
      return { error: "Unknown action." };
  }
  if (!result.ok) return { error: result.error ?? "That didn't work." };
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true, done };
}
