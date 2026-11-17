import "server-only";
import { checkPublic, githubRepo, publicUrl, type Project, type Stage } from "@/lib/pipeline";
import { PartonError, partonConnected, structured } from "@/lib/parton/claude";
import {
  README_PLACEHOLDER,
  REVIEW_SCHEMA,
  REVIEW_SYSTEM,
  acceptReview,
  pageText,
  repoFileGaps,
  reviewFingerprint,
  reviewRequest,
  type ReviewExtras,
  type ReviewOutput,
} from "./core";
import { GitHubError, readme, topLevelFiles } from "./github";
import { q } from "./tables";

/**
 * The completeness check that runs before a stage unlocks the next. Hard facts first (the write-up opens, the
 * repository has code and a real README), then Parton reads the stage's work against the bar for that stage. An
 * unchanged stage is never sent to Parton twice: the last verdict on the same text stands.
 */

export type StageCheck = { ok: true } | { ok: false; error: string };

export type Review = { id: number; stage: Stage; complete: boolean; gaps: string[]; override: string | null; byParton: boolean; at: string };

type ReviewRow = { id: number; stage: string; fingerprint: string; complete: boolean; gaps: string[] | string; override: string | null; at: Date | string };

const FACTS = "facts";
const OVERRIDE = "override";

function toReview(r: ReviewRow): Review {
  const gaps = typeof r.gaps === "string" ? (JSON.parse(r.gaps) as string[]) : r.gaps;
  return {
    id: Number(r.id),
    stage: r.stage as Stage,
    complete: r.complete,
    gaps: Array.isArray(gaps) ? gaps : [],
    override: r.override,
    byParton: r.fingerprint !== FACTS && r.fingerprint !== OVERRIDE,
    at: new Date(r.at).toISOString(),
  };
}

async function record(projectId: number, stage: Stage, fingerprint: string, complete: boolean, gaps: string[], override: string | null = null) {
  await q("INSERT INTO project_reviews (project_id, stage, fingerprint, complete, gaps, override) VALUES ($1, $2, $3, $4, $5::jsonb, $6)", [
    projectId, stage, fingerprint, complete, JSON.stringify(gaps), override,
  ]);
}

/** The most recent check of a stage, if any. */
export async function latestReview(projectId: number, stage: Stage): Promise<Review | null> {
  const rows = await q<ReviewRow>(
    "SELECT id, stage, fingerprint, complete, gaps, override, at FROM project_reviews WHERE project_id = $1 AND stage = $2 ORDER BY at DESC, id DESC LIMIT 1",
    [projectId, stage],
  );
  return rows[0] ? toReview(rows[0]) : null;
}

/** Every time the learner moved on despite Parton's check, for the project's record. */
export async function overrides(projectId: number): Promise<Review[]> {
  const rows = await q<ReviewRow>(
    "SELECT id, stage, fingerprint, complete, gaps, override, at FROM project_reviews WHERE project_id = $1 AND override IS NOT NULL ORDER BY at",
    [projectId],
  );
  return rows.map(toReview);
}

const failed = (gaps: string[], who: string): StageCheck => ({
  ok: false,
  error: `${who} found ${gaps.length === 1 ? "one thing" : `${gaps.length} things`} to fix before this stage is complete: ${gaps.join(" ")}`,
});

/** The visible text of a public web page, or null if it can't be read as text. */
async function fetchText(url: string): Promise<string | null> {
  const clean = publicUrl(url);
  if (!clean) return null;
  try {
    const res = await fetch(clean, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Frontier write-up check)", Accept: "text/html,text/plain,text/markdown" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/|html|markdown|xml/.test(type)) return null;
    const raw = (await res.text()).slice(0, 2_000_000);
    const text = /html|xml/.test(type) ? pageText(raw) : raw.trim();
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}

/** Whether the project may leave its current stage. Word counts are checked by stageGaps before this runs. */
export async function checkStage(p: Project): Promise<StageCheck> {
  const stage = p.stage;
  const extras: ReviewExtras = {};

  if (stage === "writeup") {
    const problem = await checkPublic(p.writeupUrl, "write-up");
    if (problem) return { ok: false, error: problem };
    extras.writeupText = await fetchText(p.writeupUrl);
  }

  if (stage === "repo") {
    const problem = await checkPublic(p.repoUrl, "repository");
    if (problem) return { ok: false, error: problem };
    const repo = githubRepo(p.repoUrl);
    if (repo) {
      try {
        extras.repoFiles = await topLevelFiles(repo.owner, repo.name);
        extras.readme = await readme(repo.owner, repo.name);
      } catch (error) {
        return { ok: false, error: error instanceof GitHubError ? error.message : "Couldn't read the repository from GitHub. Try again in a minute." };
      }
      const gaps = repoFileGaps(extras.repoFiles);
      if (extras.readme?.includes(README_PLACEHOLDER)) {
        gaps.push("The README still says \"To fill in\" under Reproducing the main result: replace it with the environment, the data and the exact commands.");
      }
      if (gaps.length) {
        await record(p.id, stage, FACTS, false, gaps);
        return failed(gaps, "The repository check");
      }
    }
  }

  if (!partonConnected()) return { ok: true };
  const prior = await latestReview(p.id, stage);
  if (prior?.override) return { ok: true };

  const fingerprint = reviewFingerprint(stage, p, extras);
  const same = await q<ReviewRow>(
    "SELECT id, stage, fingerprint, complete, gaps, override, at FROM project_reviews WHERE project_id = $1 AND stage = $2 AND fingerprint = $3 ORDER BY at DESC, id DESC LIMIT 1",
    [p.id, stage, fingerprint],
  );
  if (same[0]) {
    const r = toReview(same[0]);
    if (r.complete) return { ok: true };
    // Nothing changed since the last check, so the same gaps stand. Record it again so it shows as the latest.
    await record(p.id, stage, fingerprint, false, r.gaps);
    return failed(r.gaps, "Parton's check");
  }

  let verdict: { complete: boolean; gaps: string[] };
  try {
    verdict = acceptReview(await structured<ReviewOutput>({
      system: REVIEW_SYSTEM,
      schema: REVIEW_SCHEMA,
      effort: "medium",
      maxTokens: 12000,
      messages: [{ role: "user", content: reviewRequest(stage, p, extras) }],
    }));
  } catch (error) {
    return { ok: false, error: error instanceof PartonError ? `Parton couldn't check this stage: ${error.message}` : "Parton couldn't check this stage. Please try again." };
  }
  await record(p.id, stage, fingerprint, verdict.complete, verdict.gaps);
  return verdict.complete ? { ok: true } : failed(verdict.gaps, "Parton's check");
}

/** Records the learner's reason for moving on despite Parton's check. Only after Parton's check, not a hard fact. */
export async function overrideReview(projectId: number, stage: Stage, reason: string): Promise<StageCheck> {
  const last = await latestReview(projectId, stage);
  if (!last || last.complete || !last.byParton) return { ok: false, error: "There is no failed Parton check on this stage to disagree with." };
  await record(projectId, stage, OVERRIDE, true, last.gaps, reason.trim().slice(0, 5000));
  return { ok: true };
}
