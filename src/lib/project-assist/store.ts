import "server-only";
import { query } from "@/lib/db";
import { GRAPH } from "@/lib/curriculum";
import { PartonError, partonConnected, structured } from "@/lib/parton/claude";
import { loadScorecard } from "@/lib/readiness/store";
import { getProject, listProjects, saveStage, setRepoUrl, startProject, type Result } from "@/lib/projects";
import { githubRepo, type Project } from "@/lib/pipeline";
import {
  DRAFT_SCHEMA,
  DRAFT_STAGES,
  DRAFT_SYSTEM,
  REPO_STAGES,
  REPRO_HEADING,
  SUGGEST_SCHEMA,
  SUGGEST_SYSTEM,
  acceptSuggestions,
  buildReadme,
  draftBody,
  draftRequest,
  mergeReadme,
  rankGaps,
  readPlanDraft,
  repoDescription,
  suggestRequest,
  validRepoName,
  type DraftKind,
  type DraftOutput,
  type Gap,
  type SuggestOutput,
} from "./core";
import { GitHubError, createPublicRepo, githubConnected, putFile, readme } from "./github";
import { q } from "./tables";

const partonFailed = (error: unknown) =>
  error instanceof PartonError ? error.message : "Parton ran into a problem. Please try again.";

// ---------------------------------------------------------------------------------------------
// Readiness gaps

/** The learner's biggest Readiness gaps, or [] when there is no scorecard yet. */
export async function readinessGaps(limit = 8): Promise<Gap[]> {
  try {
    const card = await loadScorecard();
    return rankGaps(card.skills, limit);
  } catch (error) {
    console.error("Readiness gaps unavailable:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------------------------
// Suggested questions

export type StoredSuggestion = {
  id: number;
  title: string;
  question: string;
  why: string;
  skills: string[];
  firstStep: string;
  createdAt: string;
};

type SuggestionRow = { id: number; title: string; question: string; why: string; skills: string[] | string; first_step: string; created_at: Date | string };

const toSuggestion = (r: SuggestionRow): StoredSuggestion => ({
  id: Number(r.id),
  title: r.title,
  question: r.question,
  why: r.why,
  skills: typeof r.skills === "string" ? (JSON.parse(r.skills) as string[]) : r.skills,
  firstStep: r.first_step,
  createdAt: new Date(r.created_at).toISOString(),
});

/** The current batch of suggestions not yet used. */
export async function listSuggestions(): Promise<StoredSuggestion[]> {
  const rows = await q<SuggestionRow>(
    "SELECT id, title, question, why, skills, first_step, created_at FROM project_suggestions WHERE used_project_id IS NULL ORDER BY created_at DESC, id",
  );
  return rows.map(toSuggestion);
}

async function masteredTitles(limit = 40): Promise<string[]> {
  const rows = await query<{ lesson_id: string }>(
    "SELECT lesson_id FROM progress WHERE status = 'mastered' ORDER BY updated_at DESC LIMIT $1",
    [limit],
  );
  return rows.map((r) => GRAPH.nodes.get(r.lesson_id)).filter((n) => n !== undefined).map((n) => `${n.title} (${n.courseTitle})`);
}

/** Asks Parton for three project questions aimed at the biggest Readiness gaps. Replaces the unused batch. */
export async function suggestQuestions(): Promise<Result & { count?: number }> {
  if (!partonConnected()) return { ok: false, error: "Parton is not connected yet. Add ANTHROPIC_API_KEY in Vercel." };
  const [gaps, studied, projects] = await Promise.all([readinessGaps(), masteredTitles(), listProjects()]);
  let output: SuggestOutput;
  try {
    output = await structured<SuggestOutput>({
      system: SUGGEST_SYSTEM,
      schema: SUGGEST_SCHEMA,
      effort: "high",
      maxTokens: 24000,
      messages: [{ role: "user", content: suggestRequest(gaps, studied, projects.map((p) => ({ title: p.title, question: p.question }))) }],
    });
  } catch (error) {
    return { ok: false, error: partonFailed(error) };
  }
  const suggestions = acceptSuggestions(output, gaps.map((g) => g.name));
  if (suggestions.length === 0) return { ok: false, error: "Parton's suggestions didn't come back usable. Please try again." };
  await q("DELETE FROM project_suggestions WHERE used_project_id IS NULL");
  for (const s of suggestions) {
    await q("INSERT INTO project_suggestions (title, question, why, skills, first_step) VALUES ($1, $2, $3, $4::jsonb, $5)", [
      s.title, s.question, s.why, JSON.stringify(s.skills), s.firstStep,
    ]);
  }
  return { ok: true, count: suggestions.length };
}

/** Starts a project from a suggestion, with its title, question and why already filled in. */
export async function startFromSuggestion(id: number): Promise<Result & { id?: number }> {
  const rows = await q<SuggestionRow>(
    "SELECT id, title, question, why, skills, first_step, created_at FROM project_suggestions WHERE id = $1 AND used_project_id IS NULL",
    [id],
  );
  if (!rows[0]) return { ok: false, error: "That suggestion is no longer available." };
  const s = toSuggestion(rows[0]);
  const started = await startProject(s.title);
  if (!started.ok || !started.id) return started;
  await saveStage(started.id, { question: s.question, why: s.why });
  await q("UPDATE project_suggestions SET used_project_id = $1 WHERE id = $2", [started.id, id]);
  return started;
}

/** The suggestion a project was started from, if any. */
export async function suggestionFor(projectId: number): Promise<StoredSuggestion | null> {
  const rows = await q<SuggestionRow>(
    "SELECT id, title, question, why, skills, first_step, created_at FROM project_suggestions WHERE used_project_id = $1 LIMIT 1",
    [projectId],
  );
  return rows[0] ? toSuggestion(rows[0]) : null;
}

// ---------------------------------------------------------------------------------------------
// Drafts

export type Draft = { kind: DraftKind; status: "pending" | "ready" | "failed"; body: string; error: string; at: string };

type DraftRow = { kind: string; status: string; body: string; error: string; at: Date | string };

/** A pending draft older than this is treated as lost (the server stopped before it finished). */
const PENDING_MS = 4 * 60 * 1000;

export async function getDrafts(projectId: number): Promise<Partial<Record<DraftKind, Draft>>> {
  const rows = await q<DraftRow>("SELECT kind, status, body, error, at FROM project_drafts WHERE project_id = $1", [projectId]);
  const out: Partial<Record<DraftKind, Draft>> = {};
  for (const r of rows) {
    const at = new Date(r.at).toISOString();
    const lost = r.status === "pending" && Date.now() - Date.parse(at) > PENDING_MS;
    out[r.kind as DraftKind] = {
      kind: r.kind as DraftKind,
      status: lost ? "failed" : (r.status as Draft["status"]),
      body: r.body,
      error: lost ? "Parton stopped before finishing. Draft it again." : r.error,
      at,
    };
  }
  return out;
}

export async function getDraft(projectId: number, kind: DraftKind): Promise<Draft | null> {
  return (await getDrafts(projectId))[kind] ?? null;
}

async function setDraft(projectId: number, kind: DraftKind, status: Draft["status"], body = "", error = "") {
  await q(
    `INSERT INTO project_drafts (project_id, kind, status, body, error, at) VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (project_id, kind) DO UPDATE SET status = EXCLUDED.status, body = EXCLUDED.body, error = EXCLUDED.error, at = now()`,
    [projectId, kind, status, body, error],
  );
}

/** Whether a draft can be asked for now: right stage, Parton connected, and not already being written. */
export async function canDraft(p: Project, kind: DraftKind): Promise<boolean> {
  if (p.status !== "active" || !partonConnected() || !DRAFT_STAGES[kind].stages.includes(p.stage)) return false;
  const current = await getDraft(p.id, kind);
  return current?.status !== "pending";
}

/** Marks a draft as being written, so the page can say so while it runs in the background. */
export async function markDrafting(projectId: number, kind: DraftKind) {
  await setDraft(projectId, kind, "pending");
}

/** Writes one draft from what the learner has recorded so far. */
export async function writeDraft(projectId: number, kind: DraftKind): Promise<Result> {
  const p = await getProject(projectId);
  if (!p || p.status !== "active") return { ok: false, error: "That project isn't open." };
  if (!DRAFT_STAGES[kind].stages.includes(p.stage)) return { ok: false, error: "That draft isn't for this stage." };
  if (!partonConnected()) return { ok: false, error: "Parton is not connected yet. Add ANTHROPIC_API_KEY in Vercel." };
  await setDraft(projectId, kind, "pending");
  try {
    const gaps = kind === "plan" ? (await suggestionFor(projectId))?.skills ?? [] : [];
    const out = await structured<DraftOutput>({
      system: DRAFT_SYSTEM,
      schema: DRAFT_SCHEMA[kind],
      effort: kind === "notebook" ? "low" : "medium",
      maxTokens: 16000,
      messages: [{ role: "user", content: draftRequest(kind, p, gaps) }],
    });
    const body = draftBody(kind, out);
    if (!body) {
      await setDraft(projectId, kind, "failed", "", "Parton's draft came back empty. Draft it again.");
      return { ok: false, error: "Parton's draft came back empty. Please try again." };
    }
    await setDraft(projectId, kind, "ready", body);
    return { ok: true };
  } catch (error) {
    const message = partonFailed(error);
    await setDraft(projectId, kind, "failed", "", message);
    return { ok: false, error: message };
  }
}

/** Copies the plan draft into the plan stage's fields. The learner edits it from there. */
export async function usePlanDraft(projectId: number): Promise<Result> {
  const draft = await getDraft(projectId, "plan");
  const plan = draft?.status === "ready" ? readPlanDraft(draft.body) : null;
  if (!plan) return { ok: false, error: "There is no plan draft to use." };
  return saveStage(projectId, { plan: plan.plan, killCriterion: plan.killCriterion });
}

// ---------------------------------------------------------------------------------------------
// The public repository

export { githubConnected };

/** Creates the project's public repository on GitHub with a README built from the project, and links it. */
export async function createRepository(projectId: number, name: string): Promise<Result> {
  const p = await getProject(projectId);
  if (!p || p.status !== "active") return { ok: false, error: "That project isn't open." };
  if (p.repoUrl) return { ok: false, error: "This project already has a repository." };
  if (!REPO_STAGES.includes(p.stage)) return { ok: false, error: "The repository is created once experiments begin." };
  if (!githubConnected()) return { ok: false, error: "GitHub is not connected yet. Add GITHUB_TOKEN in Vercel." };
  const clean = name.trim();
  if (!validRepoName(clean)) return { ok: false, error: "Use only letters, digits, hyphens, dots and underscores in the name." };
  try {
    const repo = await createPublicRepo(clean, repoDescription(p));
    await putFile(repo.owner, repo.name, "README.md", buildReadme(p), "Start the project README from Frontier");
    await putFile(repo.owner, repo.name, ".gitignore", GITIGNORE, "Add a Python .gitignore");
    return setRepoUrl(projectId, repo.url);
  } catch (error) {
    return { ok: false, error: error instanceof GitHubError ? error.message : "Couldn't create the repository. Please try again." };
  }
}

/** Rewrites the repository's README from the project as it stands, keeping the learner's reproduction section. */
export async function refreshReadme(projectId: number): Promise<Result> {
  const p = await getProject(projectId);
  if (!p || p.status !== "active") return { ok: false, error: "That project isn't open." };
  const repo = githubRepo(p.repoUrl);
  if (!repo) return { ok: false, error: "The README can only be refreshed for a GitHub repository." };
  if (!githubConnected()) return { ok: false, error: "GitHub is not connected yet. Add GITHUB_TOKEN in Vercel." };
  try {
    const merged = mergeReadme(buildReadme(p), await readme(repo.owner, repo.name));
    if (merged === null) {
      return { ok: false, error: `Your README no longer has the "${REPRO_HEADING}" heading, so Frontier won't overwrite it.` };
    }
    await putFile(repo.owner, repo.name, "README.md", merged, "Refresh the README from Frontier");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof GitHubError ? error.message : "Couldn't update the README. Please try again." };
  }
}

const GITIGNORE = `__pycache__/
*.py[cod]
.venv/
venv/
.env
.ipynb_checkpoints/
wandb/
runs/
checkpoints/
*.ckpt
*.pt
data/
.DS_Store
`;
