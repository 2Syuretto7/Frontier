"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
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

  if (op === "start" || op === "startSuggestion") {
    const result = op === "start"
      ? await projects.startProject(text(form, "title"))
      : await (await import("@/lib/project-assist/store")).startFromSuggestion(Number(text(form, "suggestionId")));
    if (!result.ok) return { error: result.error };
    revalidatePath("/projects");
    redirect(`/projects/${result.id}`);
  }

  if (op === "suggest") {
    const result = await (await import("@/lib/project-assist/store")).suggestQuestions();
    if (!result.ok) return { error: result.error };
    revalidatePath("/projects");
    return { ok: true, done: `Parton suggested ${result.count} project${result.count === 1 ? "" : "s"}.` };
  }

  let result: { ok: boolean; error?: string; published?: boolean; stage?: string };
  let done: string | undefined;
  switch (op) {
    case "save":
    case "advance": {
      // A stage form's two buttons: Save, and Save and move on. Moving on saves first, then checks the stage.
      const values: Record<string, string> = {};
      for (const key of STAGE_KEYS) if (form.has(key)) values[key] = text(form, key);
      result = Object.keys(values).length ? await projects.saveStage(id, values) : { ok: true };
      if (result.ok && op === "advance") result = await moveOn(id);
      else done = "Saved.";
      break;
    }
    case "draft": {
      const { isDraftKind } = await import("@/lib/project-assist/core");
      const kind = text(form, "kind");
      result = isDraftKind(kind) ? await (await import("@/lib/project-assist/store")).writeDraft(id, kind) : { ok: false, error: "Unknown draft." };
      if (!result.ok) revalidatePath(`/projects/${id}`);
      break;
    }
    case "usePlanDraft":
      result = await (await import("@/lib/project-assist/store")).usePlanDraft(id);
      done = "The draft is in the form. Edit it, then save.";
      break;
    case "createRepo":
      result = await (await import("@/lib/project-assist/store")).createRepository(id, text(form, "repoName"));
      done = "Created the public repository with a README.";
      break;
    case "refreshReadme":
      result = await (await import("@/lib/project-assist/store")).refreshReadme(id);
      done = "Updated the README on GitHub.";
      break;
    case "override": {
      const { OVERRIDE_MIN_WORDS } = await import("@/lib/project-assist/core");
      const { wordCount } = await import("@/lib/pipeline");
      const reason = text(form, "reason");
      const project = await projects.getProject(id);
      if (!project || project.status !== "active") return { error: "That project isn't open." };
      if (wordCount(reason) < OVERRIDE_MIN_WORDS) {
        return { error: `Say why the check is wrong in at least ${OVERRIDE_MIN_WORDS} words (you have ${wordCount(reason)}).` };
      }
      result = await (await import("@/lib/project-assist/review")).overrideReview(id, project.stage, reason);
      if (result.ok) result = await moveOn(id);
      break;
    }
    case "experiment":
      result = await projects.addExperiment(id, text(form, "title"), text(form, "expected"));
      break;
    case "result":
      result = await projects.recordResult(id, Number(text(form, "experimentId")), text(form, "result"));
      break;
    case "note": {
      const template = await (await import("@/lib/project-assist/store")).getDraft(id, "notebook");
      const { isUnfilledTemplate } = await import("@/lib/project-assist/core");
      if (isUnfilledTemplate(text(form, "body"), template?.status === "ready" ? template.body : null)) {
        return { error: "Fill in the template before adding the entry." };
      }
      result = await projects.addNotebookEntry(id, text(form, "body"));
      break;
    }
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

/** Moves the project on, then starts Parton on the draft the new stage uses, in the background. */
async function moveOn(id: number) {
  const projects = await import("@/lib/projects");
  const moved = await projects.advance(id);
  if (!moved.ok) {
    // A failed check is recorded, so the page shows its gaps.
    revalidatePath(`/projects/${id}`);
    return moved;
  }
  const { draftFor } = await import("@/lib/project-assist/core");
  const kind = moved.stage ? draftFor(moved.stage) : null;
  if (kind) {
    const assist = await import("@/lib/project-assist/store");
    const project = await projects.getProject(id);
    if (project && (await assist.canDraft(project, kind))) {
      await assist.markDrafting(id, kind);
      after(async () => {
        await assist.writeDraft(id, kind);
      });
    }
  }
  return moved;
}
