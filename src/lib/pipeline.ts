/**
 * The project pipeline: the rules, with no database. Every project moves through the same fixed stages, in
 * order, and ends either published (a public write-up and a public repository) or killed with a short
 * post-mortem. Only one project can be open at a time, so a new one cannot start until the current one ends.
 */

export const STAGES = ["question", "plan", "experiments", "notebook", "writeup", "repo"] as const;
export type Stage = (typeof STAGES)[number];
export type ProjectStatus = "active" | "published" | "killed";

export const STAGE_INFO: Record<Stage, { title: string; short: string; ask: string }> = {
  question: {
    title: "Question",
    short: "Question",
    ask: "One sharp research question that an experiment could answer, and why the answer matters.",
  },
  plan: {
    title: "Plan",
    short: "Plan",
    ask: "How you will answer it: the setup, what you will measure, what would count as an answer, and when you would stop.",
  },
  experiments: {
    title: "Experiments",
    short: "Experiments",
    ask: "Run the plan. Log every experiment with what you expected and what actually happened, failures included.",
  },
  notebook: {
    title: "Lab notebook",
    short: "Notebook",
    ask: "Dated entries on what you tried, what surprised you and what you changed. This is the raw material of the write-up.",
  },
  writeup: {
    title: "Write-up",
    short: "Write-up",
    ask: "Publish the write-up somewhere public (a blog post, a report, an arXiv preprint) and summarise what you found.",
  },
  repo: {
    title: "Public repository",
    short: "Repository",
    ask: "Make the code public, with enough in it for someone else to reproduce the main result.",
  },
};

/** Minimum lengths, in words. Short enough not to be a chore, long enough that the text has to say something. */
export const MIN_WORDS = {
  question: 12,
  why: 15,
  plan: 60,
  killCriterion: 8,
  writeupSummary: 60,
  postmortem: 50,
} as const;

/** Before a project can leave the experiments stage. */
export const MIN_EXPERIMENTS = 1;
/** Before a project can leave the lab notebook stage. */
export const MIN_NOTEBOOK_ENTRIES = 3;

export type Experiment = {
  id: number;
  title: string;
  expected: string;
  result: string | null;
  at: string;
};

export type NotebookEntry = { id: number; body: string; at: string };

export type StageVisit = { stage: Stage; at: string };

export type Project = {
  id: number;
  title: string;
  status: ProjectStatus;
  stage: Stage;
  question: string;
  why: string;
  plan: string;
  killCriterion: string;
  writeupUrl: string;
  writeupSummary: string;
  repoUrl: string;
  postmortem: string;
  history: StageVisit[];
  startedAt: string;
  endedAt: string | null;
  experiments: Experiment[];
  notebook: NotebookEntry[];
};

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

export function nextStage(stage: Stage): Stage | null {
  return STAGES[stageIndex(stage) + 1] ?? null;
}

/** A public https link, with no credentials in it. Returns the cleaned URL, or null. */
export function publicUrl(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  // A named public host: no IP addresses and no local names, so the server only ever checks real sites.
  if (!url.hostname.includes(".") || url.hostname.startsWith("[") || /^[\d.]+$/.test(url.hostname)) return null;
  if (/(^|\.)(localhost|local|internal)$/.test(url.hostname)) return null;
  return url.toString();
}

/** owner/name for a github.com repository link, or null for any other link. */
export function githubRepo(value: string): { owner: string; name: string } | null {
  const url = publicUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null;
  const [owner, name] = parsed.pathname.split("/").filter(Boolean);
  if (!owner || !name) return null;
  return { owner, name: name.replace(/\.git$/, "") };
}

const need = (have: number, min: number, what: string) =>
  have >= min ? null : `${what} needs at least ${min} words (it has ${have}).`;

/**
 * What still stops the project from leaving its current stage. An empty list means it can move on (or, at the
 * last stage, be published). The repository's visibility is checked separately, on the server, when publishing.
 */
export function stageGaps(p: Project): string[] {
  const gaps: string[] = [];
  const push = (gap: string | null) => { if (gap) gaps.push(gap); };
  switch (p.stage) {
    case "question":
      if (!p.title.trim()) gaps.push("Give the project a title.");
      push(need(wordCount(p.question), MIN_WORDS.question, "The question"));
      if (p.question.trim() && !p.question.includes("?")) gaps.push("Write the question as a question, with a question mark.");
      push(need(wordCount(p.why), MIN_WORDS.why, "Why it matters"));
      break;
    case "plan":
      push(need(wordCount(p.plan), MIN_WORDS.plan, "The plan"));
      push(need(wordCount(p.killCriterion), MIN_WORDS.killCriterion, "The kill criterion"));
      break;
    case "experiments": {
      const done = p.experiments.filter((e) => e.result && e.result.trim()).length;
      if (done < MIN_EXPERIMENTS) gaps.push("Log at least one experiment with its result.");
      const open = p.experiments.length - done;
      if (open > 0) gaps.push(`Record the result of ${open === 1 ? "the open experiment" : `the ${open} open experiments`}, even if it failed.`);
      break;
    }
    case "notebook":
      if (p.notebook.length < MIN_NOTEBOOK_ENTRIES) {
        gaps.push(`Write at least ${MIN_NOTEBOOK_ENTRIES} notebook entries (you have ${p.notebook.length}).`);
      }
      break;
    case "writeup":
      if (!publicUrl(p.writeupUrl)) gaps.push("Add the public https link to the write-up.");
      push(need(wordCount(p.writeupSummary), MIN_WORDS.writeupSummary, "The summary of findings"));
      break;
    case "repo":
      if (!publicUrl(p.repoUrl)) gaps.push("Add the public https link to the repository.");
      break;
  }
  return gaps;
}

export type StartCheck = { ok: true } | { ok: false; error: string; activeId: number };

/** The rule that builds the portfolio: no new project while one is still open. */
export function canStart(projects: Pick<Project, "id" | "status" | "title">[]): StartCheck {
  const open = projects.find((p) => p.status === "active");
  if (!open) return { ok: true };
  return {
    ok: false,
    activeId: open.id,
    error: `"${open.title}" is still open. Publish it, or kill it with a short post-mortem, before starting another.`,
  };
}

/** Why a post-mortem is not yet enough to kill a project, or null if it is. */
export function postmortemGap(text: string): string | null {
  return need(wordCount(text), MIN_WORDS.postmortem, "The post-mortem");
}

/** Days from one ISO time to another, rounded down, never negative. */
export function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000));
}

/** How long the project spent in each stage it reached, in days. The current stage runs to `now`. */
export function stageDurations(p: Pick<Project, "history" | "endedAt">, now: string): Partial<Record<Stage, number>> {
  const out: Partial<Record<Stage, number>> = {};
  p.history.forEach((visit, i) => {
    const end = p.history[i + 1]?.at ?? p.endedAt ?? now;
    out[visit.stage] = (out[visit.stage] ?? 0) + daysBetween(visit.at, end);
  });
  return out;
}

/**
 * Checks that a link opens for someone who is not signed in, or says why not. A private or missing GitHub
 * repository answers 404 to the public, so the same check covers repositories. `get` is fetch, or a stand-in.
 */
export async function checkPublic(url: string, what: string, get: typeof fetch = fetch): Promise<string | null> {
  const clean = publicUrl(url);
  if (!clean) return `The ${what} link must be a public https address.`;
  const repo = githubRepo(clean);
  const target = repo ? `https://github.com/${repo.owner}/${repo.name}` : clean;
  let status: number;
  try {
    const res = await get(target, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Frontier link check)" },
    });
    status = res.status;
  } catch {
    return `Couldn't reach the ${what} link to check it is public. Check the address, then try again.`;
  }
  if (status < 400) return null;
  if (repo && status === 404) return `GitHub says ${repo.owner}/${repo.name} doesn't exist or isn't public yet. Make it public, then try again.`;
  if (status === 401 || status === 403 || status === 404) return `The ${what} link isn't public (it answered ${status}). Make it public, then try again.`;
  return `The ${what} link answered with status ${status}. Try again in a minute.`;
}
