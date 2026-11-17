import "server-only";
import { query } from "./db";
import {
  canStart,
  checkPublic,
  isStage,
  nextStage,
  postmortemGap,
  publicUrl,
  stageGaps,
  type Experiment,
  type NotebookEntry,
  type Project,
  type ProjectStatus,
  type Stage,
  type StageVisit,
} from "./pipeline";

export type Result = { ok: true } | { ok: false; error: string };

type ProjectRow = {
  id: number;
  title: string;
  status: string;
  stage: string;
  question: string;
  why: string;
  plan: string;
  kill_criterion: string;
  writeup_url: string;
  writeup_summary: string;
  repo_url: string;
  postmortem: string;
  history: StageVisit[] | string;
  started_at: Date | string;
  ended_at: Date | string | null;
};

const iso = (v: Date | string) => new Date(v).toISOString();

function toProject(r: ProjectRow, experiments: Experiment[], notebook: NotebookEntry[]): Project {
  const history = typeof r.history === "string" ? (JSON.parse(r.history) as StageVisit[]) : r.history;
  return {
    id: Number(r.id),
    title: r.title,
    status: r.status as ProjectStatus,
    stage: isStage(r.stage) ? r.stage : "question",
    question: r.question,
    why: r.why,
    plan: r.plan,
    killCriterion: r.kill_criterion,
    writeupUrl: r.writeup_url,
    writeupSummary: r.writeup_summary,
    repoUrl: r.repo_url,
    postmortem: r.postmortem,
    history: (history ?? []).filter((h) => isStage(h.stage)),
    startedAt: iso(r.started_at),
    endedAt: r.ended_at ? iso(r.ended_at) : null,
    experiments,
    notebook,
  };
}

async function children(ids: number[]) {
  if (ids.length === 0) return { experiments: new Map<number, Experiment[]>(), notebook: new Map<number, NotebookEntry[]>() };
  const [exps, notes] = await Promise.all([
    query<{ id: number; project_id: number; title: string; expected: string; result: string | null; at: Date | string }>(
      "SELECT id, project_id, title, expected, result, at FROM project_experiments WHERE project_id = ANY($1::int[]) ORDER BY at, id",
      [ids],
    ),
    query<{ id: number; project_id: number; body: string; at: Date | string }>(
      "SELECT id, project_id, body, at FROM project_notebook WHERE project_id = ANY($1::int[]) ORDER BY at, id",
      [ids],
    ),
  ]);
  const experiments = new Map<number, Experiment[]>();
  for (const e of exps) {
    const list = experiments.get(Number(e.project_id)) ?? [];
    list.push({ id: Number(e.id), title: e.title, expected: e.expected, result: e.result, at: iso(e.at) });
    experiments.set(Number(e.project_id), list);
  }
  const notebook = new Map<number, NotebookEntry[]>();
  for (const n of notes) {
    const list = notebook.get(Number(n.project_id)) ?? [];
    list.push({ id: Number(n.id), body: n.body, at: iso(n.at) });
    notebook.set(Number(n.project_id), list);
  }
  return { experiments, notebook };
}

/** Every project, newest first. */
export async function listProjects(): Promise<Project[]> {
  const rows = await query<ProjectRow>("SELECT * FROM projects ORDER BY started_at DESC, id DESC");
  const { experiments, notebook } = await children(rows.map((r) => Number(r.id)));
  return rows.map((r) => toProject(r, experiments.get(Number(r.id)) ?? [], notebook.get(Number(r.id)) ?? []));
}

export async function getProject(id: number): Promise<Project | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = await query<ProjectRow>("SELECT * FROM projects WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const { experiments, notebook } = await children([id]);
  return toProject(rows[0], experiments.get(id) ?? [], notebook.get(id) ?? []);
}

export async function activeProject(): Promise<Project | null> {
  const rows = await query<{ id: number }>("SELECT id FROM projects WHERE status = 'active' LIMIT 1");
  return rows[0] ? getProject(Number(rows[0].id)) : null;
}

/**
 * Published projects, newest first: the portfolio. Each has a public write-up and a public repository, so it
 * can be cited as evidence (for example by the readiness scorecard).
 */
export async function publishedProjects(): Promise<
  { id: number; title: string; question: string; writeupUrl: string; repoUrl: string; publishedAt: string }[]
> {
  const rows = await query<{ id: number; title: string; question: string; writeup_url: string; repo_url: string; ended_at: Date | string }>(
    "SELECT id, title, question, writeup_url, repo_url, ended_at FROM projects WHERE status = 'published' ORDER BY ended_at DESC",
  );
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    question: r.question,
    writeupUrl: r.writeup_url,
    repoUrl: r.repo_url,
    publishedAt: iso(r.ended_at),
  }));
}

export async function startProject(title: string): Promise<Result & { id?: number }> {
  const name = title.trim();
  if (!name) return { ok: false, error: "Give the project a title." };
  const existing = await query<{ id: number; status: ProjectStatus; title: string }>("SELECT id, status, title FROM projects WHERE status = 'active'");
  const check = canStart(existing.map((r) => ({ ...r, id: Number(r.id) })));
  if (!check.ok) return { ok: false, error: check.error };
  try {
    const now = new Date().toISOString();
    const rows = await query<{ id: number }>(
      "INSERT INTO projects (title, status, stage, history, started_at) VALUES ($1, 'active', 'question', $2::jsonb, $3) RETURNING id",
      [name.slice(0, 200), JSON.stringify([{ stage: "question", at: now }]), now],
    );
    return { ok: true, id: Number(rows[0].id) };
  } catch {
    // The unique index on open projects caught a second start racing the first.
    return { ok: false, error: "Another project is already open. Publish or kill it first." };
  }
}

async function openProject(id: number): Promise<Project | { error: string }> {
  const p = await getProject(id);
  if (!p) return { error: "That project doesn't exist." };
  if (p.status !== "active") return { error: "This project has ended, so it can't be changed." };
  return p;
}

/** The fields each stage owns. A stage's fields are frozen once the project moves past it. */
const STAGE_FIELDS: Partial<Record<Stage, Record<string, string>>> = {
  question: { title: "title", question: "question", why: "why" },
  plan: { plan: "plan", killCriterion: "kill_criterion" },
  writeup: { writeupUrl: "writeup_url", writeupSummary: "writeup_summary" },
  repo: { repoUrl: "repo_url" },
};

const LIMITS: Record<string, number> = { title: 200, writeupUrl: 500, repoUrl: 500 };

export async function saveStage(id: number, values: Record<string, string>): Promise<Result> {
  const p = await openProject(id);
  if ("error" in p) return { ok: false, error: p.error };
  const fields = STAGE_FIELDS[p.stage];
  if (!fields) return { ok: false, error: "This stage has nothing to save." };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, column] of Object.entries(fields)) {
    if (!(key in values)) continue;
    let value = String(values[key] ?? "").trim().slice(0, LIMITS[key] ?? 20000);
    if (key === "title" && !value) return { ok: false, error: "The title can't be empty." };
    if ((key === "writeupUrl" || key === "repoUrl") && value) {
      const clean = publicUrl(value);
      if (!clean) return { ok: false, error: "Links must be public https addresses." };
      value = clean;
    }
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }
  if (sets.length === 0) return { ok: true };
  params.push(id);
  await query(`UPDATE projects SET ${sets.join(", ")} WHERE id = $${params.length} AND status = 'active'`, params);
  return { ok: true };
}

const EXPERIMENT_STAGES: Stage[] = ["experiments", "notebook"];
const NOTEBOOK_STAGES: Stage[] = ["experiments", "notebook", "writeup", "repo"];

export async function addExperiment(id: number, title: string, expected: string): Promise<Result> {
  const p = await openProject(id);
  if ("error" in p) return { ok: false, error: p.error };
  if (!EXPERIMENT_STAGES.includes(p.stage)) return { ok: false, error: "Experiments are logged in the experiments and notebook stages." };
  const t = title.trim(), e = expected.trim();
  if (!t) return { ok: false, error: "Say what the experiment is." };
  if (!e) return { ok: false, error: "Write down what you expect to happen before you run it." };
  await query("INSERT INTO project_experiments (project_id, title, expected) VALUES ($1, $2, $3)", [id, t.slice(0, 300), e.slice(0, 5000)]);
  return { ok: true };
}

export async function recordResult(id: number, experimentId: number, result: string): Promise<Result> {
  const p = await openProject(id);
  if ("error" in p) return { ok: false, error: p.error };
  if (!EXPERIMENT_STAGES.includes(p.stage)) return { ok: false, error: "Results are recorded in the experiments and notebook stages." };
  const text = result.trim();
  if (!text) return { ok: false, error: "Write what happened." };
  const rows = await query("UPDATE project_experiments SET result = $1 WHERE id = $2 AND project_id = $3 RETURNING id", [text.slice(0, 10000), experimentId, id]);
  return rows.length ? { ok: true } : { ok: false, error: "That experiment isn't part of this project." };
}

export async function addNotebookEntry(id: number, body: string): Promise<Result> {
  const p = await openProject(id);
  if ("error" in p) return { ok: false, error: p.error };
  if (!NOTEBOOK_STAGES.includes(p.stage)) return { ok: false, error: "The lab notebook opens once experiments begin." };
  const text = body.trim();
  if (!text) return { ok: false, error: "The entry is empty." };
  await query("INSERT INTO project_notebook (project_id, body) VALUES ($1, $2)", [id, text.slice(0, 20000)]);
  return { ok: true };
}

/** Moves the project to its next stage, or publishes it from the last stage. Only when the stage's work is done. */
export async function advance(id: number): Promise<Result & { published?: boolean }> {
  const p = await openProject(id);
  if ("error" in p) return { ok: false, error: p.error };
  const gaps = stageGaps(p);
  if (gaps.length) return { ok: false, error: gaps.join(" ") };
  const now = new Date().toISOString();
  const next = nextStage(p.stage);
  if (next) {
    const history = [...p.history, { stage: next, at: now }];
    await query("UPDATE projects SET stage = $1, history = $2::jsonb WHERE id = $3 AND status = 'active' AND stage = $4", [
      next, JSON.stringify(history), id, p.stage,
    ]);
    return { ok: true };
  }
  for (const [url, what] of [[p.writeupUrl, "write-up"], [p.repoUrl, "repository"]] as const) {
    const problem = await checkPublic(url, what);
    if (problem) return { ok: false, error: problem };
  }
  await query("UPDATE projects SET status = 'published', ended_at = $1 WHERE id = $2 AND status = 'active'", [now, id]);
  return { ok: true, published: true };
}

/** Ends the project without publishing. Allowed at any stage, but only with a real post-mortem. */
export async function killProject(id: number, postmortem: string): Promise<Result> {
  const p = await openProject(id);
  if ("error" in p) return { ok: false, error: p.error };
  const text = postmortem.trim();
  const gap = postmortemGap(text);
  if (gap) return { ok: false, error: gap };
  await query("UPDATE projects SET status = 'killed', postmortem = $1, ended_at = now() WHERE id = $2 AND status = 'active'", [text.slice(0, 20000), id]);
  return { ok: true };
}
