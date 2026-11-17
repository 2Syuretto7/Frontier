/**
 * Parton's help with projects: the rules and prompts, with no database and no API calls, so they can be tested.
 *
 * Four kinds of help:
 * - Suggested questions: research questions aimed at the learner's weakest, most asked-for Readiness skills.
 * - Drafts: a plan and kill criterion, a lab notebook template and a write-up outline, each drafted from what the
 *   learner has already written in earlier stages. Drafts are only ever suggestions; the learner edits and saves.
 * - The public repository: a name and a README built from the project itself.
 * - A completeness check: before a stage unlocks the next one, Parton reads the stage's work and says what is
 *   still missing. Word counts alone can be met by padding; this check asks whether the work does its job.
 */

import { MIN_WORDS, STAGE_INFO, wordCount, type Project, type Stage } from "../pipeline";

// ---------------------------------------------------------------------------------------------
// Readiness gaps

export const MAX_LEVEL = 4;

export type GapSkill = { name: string; area: string; description: string; frequency: number; level: number };
export type Gap = GapSkill & { gap: number };

/**
 * The skills worth a project, weakest and most asked-for first. A skill's gap is how many postings ask for it
 * times how many levels it is short of Published. Skills no posting asks for, and finished skills, are left out.
 */
export function rankGaps(skills: readonly GapSkill[], limit = 8): Gap[] {
  return skills
    .filter((s) => s.frequency > 0 && s.level < MAX_LEVEL)
    .map((s) => ({ ...s, gap: s.frequency * (MAX_LEVEL - Math.max(0, s.level)) }))
    .sort((a, b) => b.gap - a.gap || b.frequency - a.frequency || a.name.localeCompare(b.name))
    .slice(0, limit);
}

const LEVEL_NAMES = ["None", "Studied", "Practised", "Built", "Published"];

const VOICE = `You are Parton, the tutor inside Frontier, a private learning platform for one learner studying mathematics, machine learning and machine learning engineering, preparing for research and engineering roles at frontier AI labs.

Write in British spelling (as used in India): "recognise", "colour", "centre". No emojis. Plain, direct sentences.`;

// ---------------------------------------------------------------------------------------------
// Suggested questions

export const SUGGEST_SYSTEM = `${VOICE}

Right now you are suggesting research projects. Each project moves through six fixed stages: question, plan, experiments, lab notebook, public write-up and public repository, and ends published or killed. The learner works on one at a time, alone, with a laptop and modest cloud compute (a single GPU for a few days at most).

What makes a good project question:
- It is answerable by an experiment the learner can run in two to six weeks. Not a literature review, not a product.
- It is sharp: one question, with a measurable answer, phrased as a question ending in a question mark.
- It exercises the gap skills you are given, so publishing it would be real evidence for them. Aim each question at one to three of them.
- It suits what the learner has already studied, or stretches it a little.
- It is interesting to a researcher at a frontier lab: a small, honest replication, ablation, scaling probe or measurement, not a toy.
- It does not repeat a project the learner has already done.

For each suggestion write a short title, the question (at least ${MIN_WORDS.question} words), why the answer matters (at least ${MIN_WORDS.why} words: who would care and what they would do differently), the names of the gap skills it exercises, copied exactly, and a first step in one sentence.

Suggest three projects that differ from each other.`;

export const SUGGEST_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "A short title, under 80 characters." },
          question: { type: "string", description: "The research question, ending in a question mark." },
          why: { type: "string", description: "Why the answer matters." },
          skills: { type: "array", items: { type: "string" }, description: "Exact names of the gap skills it exercises." },
          first_step: { type: "string", description: "The first thing to do, in one sentence." },
        },
        required: ["title", "question", "why", "skills", "first_step"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

export type SuggestOutput = {
  suggestions: { title: string; question: string; why: string; skills: string[]; first_step: string }[];
};

export function suggestRequest(gaps: readonly Gap[], studied: readonly string[], past: readonly { title: string; question: string }[]): string {
  const parts = [
    `# The learner's Readiness gaps, biggest first\n${gaps.length
      ? gaps.map((g) => `- ${g.name} (${g.area}): ${g.description} Asked for by ${g.frequency} posting${g.frequency === 1 ? "" : "s"}; the learner is at ${LEVEL_NAMES[g.level] ?? "None"}.`).join("\n")
      : "- No Readiness scorecard yet. Aim at skills research engineers at frontier labs are commonly asked for: training and evaluating transformers, careful experiment design, and clear write-ups."}`,
    `# Lessons the learner has mastered (most recent first)\n${studied.length ? studied.map((t) => `- ${t}`).join("\n") : "- None recorded yet. Keep the suggestions within reach of a strong beginner."}`,
    `# Projects the learner has already done\n${past.length ? past.map((p) => `- ${p.title}: ${p.question}`).join("\n") : "- None yet."}`,
  ];
  return parts.join("\n\n");
}

export type Suggestion = { title: string; question: string; why: string; skills: string[]; firstStep: string };

/** Keeps the suggestions that would pass the question stage as written, with skills matched to real gaps. */
export function acceptSuggestions(output: SuggestOutput, gapNames: readonly string[], limit = 3): Suggestion[] {
  const known = new Map(gapNames.map((n) => [n.toLowerCase().trim(), n]));
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const raw of output.suggestions ?? []) {
    const title = (raw.title ?? "").trim().replace(/\s+/g, " ").slice(0, 200);
    const question = (raw.question ?? "").trim().slice(0, 2000);
    const why = (raw.why ?? "").trim().slice(0, 4000);
    if (!title || seen.has(title.toLowerCase())) continue;
    if (!question.includes("?") || wordCount(question) < MIN_WORDS.question || wordCount(why) < MIN_WORDS.why) continue;
    const skills = [...new Set((raw.skills ?? []).map((s) => known.get(s.toLowerCase().trim())).filter((s): s is string => Boolean(s)))];
    seen.add(title.toLowerCase());
    out.push({ title, question, why, skills, firstStep: (raw.first_step ?? "").trim().slice(0, 400) });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Drafts

export const DRAFT_KINDS = ["plan", "notebook", "outline"] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];
export const isDraftKind = (k: unknown): k is DraftKind => typeof k === "string" && (DRAFT_KINDS as readonly string[]).includes(k);

/** The stages in which each draft is useful, and the stage on entering which it is drafted automatically. */
export const DRAFT_STAGES: Record<DraftKind, { stages: Stage[]; auto: Stage }> = {
  plan: { stages: ["plan"], auto: "plan" },
  notebook: { stages: ["experiments", "notebook", "writeup", "repo"], auto: "experiments" },
  outline: { stages: ["writeup"], auto: "writeup" },
};

export const draftFor = (stage: Stage): DraftKind | null =>
  DRAFT_KINDS.find((k) => DRAFT_STAGES[k].auto === stage) ?? null;

export const DRAFT_TITLES: Record<DraftKind, string> = {
  plan: "Draft plan and kill criterion",
  notebook: "Lab notebook template",
  outline: "Write-up outline",
};

const DRAFT_TASKS: Record<DraftKind, string> = {
  plan: `Draft the plan and the kill criterion for this project, from the question and why it matters. The learner will edit it, so be concrete rather than safe.
The plan (at least ${MIN_WORDS.plan + 20} words, in short paragraphs or a short list) covers: the data, model and setup; the baselines; exactly what will be measured and how (with seeds and error bars where it matters); what result would answer the question either way; and a compute and time budget. Name real datasets, models and libraries where they fit.
The kill criterion (one or two sentences, at least ${MIN_WORDS.killCriterion} words) is decided now, before any results, and is checkable: a measured result, a budget or a date after which the learner stops.`,
  notebook: `Write a lab notebook entry template for this project: a short skeleton the learner fills in each time they write an entry. Use the headings and prompts this particular project needs (for example the metrics in the plan, the experiment being run, what was expected, what happened, what surprised them, what to change next). Plain text, one heading per line followed by a colon, 6 to 10 lines, no filled-in content. It goes straight into a text box.`,
  outline: `Draft an outline for the public write-up of this project, from everything the learner has recorded: the question, the plan and kill criterion, every experiment with what was expected and what happened, and the notebook. Use Markdown headings (##) and short bullet points under each, saying what goes there and which experiments and numbers support it. Include: a one-paragraph summary of the finding, the question and why it matters, the setup, the results (honest about failures and anything that went against the plan), what it means and its limits, and how to reproduce it. Never invent results: use only what the learner recorded, and mark anything missing as a gap to fill.`,
};

export const DRAFT_SCHEMA: Record<DraftKind, Record<string, unknown>> = {
  plan: {
    type: "object",
    properties: { plan: { type: "string" }, kill_criterion: { type: "string" } },
    required: ["plan", "kill_criterion"],
    additionalProperties: false,
  },
  notebook: {
    type: "object",
    properties: { template: { type: "string" } },
    required: ["template"],
    additionalProperties: false,
  },
  outline: {
    type: "object",
    properties: { outline: { type: "string" } },
    required: ["outline"],
    additionalProperties: false,
  },
};

export type DraftOutput = { plan?: string; kill_criterion?: string; template?: string; outline?: string };

export const DRAFT_SYSTEM = `${VOICE}

Right now you are helping the learner with one of their research projects by drafting something they will then edit and own. Draft only from what they have written; do not invent results, numbers or experiments that are not recorded.`;

/** Everything the learner has recorded so far, as the model reads it. */
export function projectRecord(p: Project, include: { experiments?: boolean; notebook?: boolean } = {}): string {
  const parts = [
    `# Project: ${p.title}`,
    `## Question\n${p.question || "(not written)"}`,
    `## Why it matters\n${p.why || "(not written)"}`,
  ];
  if (p.plan.trim()) parts.push(`## Plan\n${p.plan}`);
  if (p.killCriterion.trim()) parts.push(`## Kill criterion\n${p.killCriterion}`);
  if (include.experiments) {
    parts.push(`## Experiments\n${p.experiments.length
      ? p.experiments.map((e, i) => `### E${i + 1}: ${e.title}\nExpected: ${e.expected}\nWhat happened: ${e.result ?? "(no result yet)"}`).join("\n\n")
      : "(none logged)"}`);
  }
  if (include.notebook) {
    parts.push(`## Lab notebook\n${p.notebook.length
      ? p.notebook.map((n) => `### ${n.at.slice(0, 10)}\n${n.body.slice(0, 4000)}`).join("\n\n")
      : "(no entries)"}`);
  }
  if (p.writeupSummary.trim()) parts.push(`## Summary of findings\n${p.writeupSummary}`);
  return parts.join("\n\n");
}

export function draftRequest(kind: DraftKind, p: Project, gaps: readonly string[] = []): string {
  const record = projectRecord(p, { experiments: kind !== "plan", notebook: kind === "outline" });
  const aim = gaps.length ? `\n\nThe learner also wants this project to be evidence for these skills, so let the plan exercise them where it fits: ${gaps.join("; ")}.` : "";
  return `${record}\n\n# Your task\n${DRAFT_TASKS[kind]}${kind === "plan" ? aim : ""}`;
}

/** The text a draft output stores, or null when the output is unusable. */
export function draftBody(kind: DraftKind, out: DraftOutput): string | null {
  if (kind === "plan") {
    const plan = (out.plan ?? "").trim(), kill = (out.kill_criterion ?? "").trim();
    if (!plan || !kill) return null;
    return JSON.stringify({ plan: plan.slice(0, 20000), killCriterion: kill.slice(0, 2000) });
  }
  const text = (kind === "notebook" ? out.template : out.outline)?.trim();
  return text ? text.slice(0, 20000) : null;
}

export function readPlanDraft(body: string): { plan: string; killCriterion: string } | null {
  try {
    const v = JSON.parse(body) as { plan?: unknown; killCriterion?: unknown };
    return typeof v.plan === "string" && typeof v.killCriterion === "string" ? { plan: v.plan, killCriterion: v.killCriterion } : null;
  } catch {
    return null;
  }
}

/** True when a notebook entry is the template left unfilled. */
export function isUnfilledTemplate(entry: string, template: string | null): boolean {
  if (!template) return false;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return norm(entry) === norm(template);
}

// ---------------------------------------------------------------------------------------------
// The public repository

/** A GitHub repository name from the project title: lower case, hyphens, at most 60 characters. */
export function repoName(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "frontier-project";
}

/** Whether a name is one GitHub accepts for a new repository. */
export function validRepoName(name: string): boolean {
  return /^[A-Za-z0-9._-]{1,100}$/.test(name) && !/^\.+$/.test(name) && !name.toLowerCase().endsWith(".git");
}

/** One line for the repository's description on GitHub. */
export function repoDescription(p: Pick<Project, "question" | "title">): string {
  const text = (p.question || p.title).replace(/\s+/g, " ").trim();
  return text.length <= 300 ? text : `${text.slice(0, 297)}…`;
}

/** The stages in which Frontier can create the repository: from the first experiment, so code lands there as it is written. */
export const REPO_STAGES: Stage[] = ["experiments", "notebook", "writeup", "repo"];

export const REPRO_HEADING = "Reproducing the main result";

/** The README the repository starts with, and is refreshed to as the project moves on. Built from the project. */
export function buildReadme(p: Project): string {
  const lines = [`# ${p.title}`, ""];
  if (p.question) lines.push(`> ${p.question.replace(/\s+/g, " ").trim()}`, "");
  if (p.writeupUrl) lines.push(`**Write-up:** ${p.writeupUrl}`, "");
  if (p.writeupSummary.trim()) lines.push("## Findings", "", p.writeupSummary.trim(), "");
  if (p.why.trim()) lines.push("## Why it matters", "", p.why.trim(), "");
  if (p.plan.trim()) lines.push("## Plan", "", p.plan.trim(), "");
  if (p.killCriterion.trim()) lines.push(`**Kill criterion, set before any results:** ${p.killCriterion.trim()}`, "");
  const done = p.experiments.filter((e) => e.result?.trim());
  if (done.length) {
    lines.push("## Experiments", "");
    done.forEach((e, i) => lines.push(`### E${i + 1}. ${e.title}`, "", `- **Expected:** ${oneLine(e.expected)}`, `- **What happened:** ${oneLine(e.result!)}`, ""));
  }
  lines.push(
    `## ${REPRO_HEADING}`,
    "",
    "_To fill in: the environment (Python version, `requirements.txt`), the data and where to get it, and the exact commands that reproduce the main result._",
    "",
  );
  return lines.join("\n");
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

const NOT_CODE = /^(readme(\.\w+)?|license(\.\w+)?|licence(\.\w+)?|\.gitignore|\.gitattributes|\.github)$/i;

/** What a repository's top level is still missing before it can be published, from its file names. */
export function repoFileGaps(files: readonly string[]): string[] {
  const gaps: string[] = [];
  if (!files.some((f) => /^readme(\.\w+)?$/i.test(f))) gaps.push("The repository has no README.");
  if (!files.some((f) => !NOT_CODE.test(f))) gaps.push("The repository has no code yet: push the code that produces the main result.");
  return gaps;
}

/**
 * The refreshed README: the parts built from the project are rewritten, and the learner's own reproduction section
 * (and anything after it) is kept. Null when the current README has no such section, so it is not overwritten.
 */
export function mergeReadme(fresh: string, current: string | null): string | null {
  const heading = `## ${REPRO_HEADING}`;
  if (!current) return fresh;
  const at = current.indexOf(heading);
  if (at < 0) return null;
  return `${fresh.slice(0, fresh.indexOf(heading))}${current.slice(at).trimEnd()}\n`;
}

/** The README's "to fill in" placeholder, which must be replaced before publishing. */
export const README_PLACEHOLDER = "_To fill in: the environment";

// ---------------------------------------------------------------------------------------------
// The completeness check

export const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    complete: { type: "boolean", description: "True if the stage's work does its job well enough to move on." },
    gaps: {
      type: "array",
      items: { type: "string" },
      description: "If not complete, one to five specific things to fix, each one sentence, most important first. Otherwise empty.",
    },
  },
  required: ["complete", "gaps"],
  additionalProperties: false,
} as const;

export type ReviewOutput = { complete: boolean; gaps: string[] };

/** What each stage has to achieve, beyond its word counts. */
export const STAGE_BAR: Record<Stage, string> = {
  question: `The question is one sharp question an experiment could answer, with a measurable answer, and phrased as a question. It is not a topic, a literature review or a product to build. Why it matters names who would care about the answer and what they would do differently. The scope is realistic for one person with modest compute.`,
  plan: `The plan says what data, model and setup will be used; what the baselines are; exactly what will be measured; what result would answer the question (either way); and a compute and time budget. Someone else could start the experiments from it. The kill criterion is decided before any results and is checkable: a measured outcome, a budget or a date, not a feeling.`,
  experiments: `Every experiment states what was expected before it ran and what actually happened, with numbers where the plan said it would measure something. Taken together, the experiments make a real attempt at the plan: at least the main comparison in the plan has been run, or the record says plainly why not. Failures recorded honestly are fine.`,
  notebook: `The entries are real working notes: what was tried, what surprised the learner, what they changed and why. They are specific to this project, not filler, and together they give enough raw material for a write-up.`,
  writeup: `The write-up is public and is about this project (the page text is given when it could be fetched). The summary of findings says what was found, how sure the learner is, and how it compares with the plan and the kill criterion. It does not claim more than the experiments show.`,
  repo: `The repository holds the code for this project, and its README says how to reproduce the main result: the environment, the data and the commands. A stranger could rerun the main experiment from it.`,
};

export const REVIEW_SYSTEM = `${VOICE}

Right now you are checking whether one stage of the learner's research project is really complete before the next stage unlocks. Word counts have already been checked; you judge whether the work does its job.

Be a fair, demanding research supervisor: block for real gaps that would weaken the project or its write-up, not for style, and not for things a later stage covers. If the work is good enough to move on, say complete, even if it could be better. When it is not, name each gap specifically, quoting or pointing at the learner's own text, and say what would fix it. Never write the fix for them.`;

export type ReviewExtras = { writeupText?: string | null; repoFiles?: readonly string[]; readme?: string | null };

export function reviewRequest(stage: Stage, p: Project, extras: ReviewExtras = {}): string {
  const record = projectRecord(p, { experiments: stage !== "question" && stage !== "plan", notebook: stage === "notebook" || stage === "writeup" });
  const parts = [record];
  if (stage === "writeup") {
    parts.push(`## Write-up link\n${p.writeupUrl}`);
    parts.push(`## Text of the write-up page\n${extras.writeupText ? extras.writeupText.slice(0, 15000) : "(could not be fetched as text; judge the summary only)"}`);
  }
  if (stage === "repo") {
    parts.push(`## Repository\n${p.repoUrl}\nTop-level files: ${extras.repoFiles?.join(", ") || "(unknown)"}`);
    parts.push(`## README\n${extras.readme ? extras.readme.slice(0, 15000) : "(could not be read)"}`);
  }
  parts.push(`# Stage to check: ${STAGE_INFO[stage].title}\nWhat this stage asks: ${STAGE_INFO[stage].ask}\nThe bar: ${STAGE_BAR[stage]}`);
  return parts.join("\n\n");
}

export function acceptReview(out: ReviewOutput): { complete: boolean; gaps: string[] } {
  const gaps = (out.gaps ?? []).map((g) => g.trim().replace(/\s+/g, " ").slice(0, 400)).filter(Boolean).slice(0, 5);
  // A "not complete" with no reason gives the learner nothing to act on, so it counts as complete.
  return { complete: Boolean(out.complete) || gaps.length === 0, gaps: out.complete ? [] : gaps };
}

/** A short fingerprint of what the check reads for a stage, so an unchanged stage is never checked twice. */
export function reviewFingerprint(stage: Stage, p: Project, extras: ReviewExtras = {}): string {
  return fnv1a(reviewRequest(stage, p, extras));
}

/** A short, stable hash of a text, for fingerprints and React keys. */
export function shortHash(text: string): string {
  return fnv1a(text);
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + text.length.toString(16);
}

/** Minimum words for the learner's reason when they move on despite Parton's check. */
export const OVERRIDE_MIN_WORDS = 30;

/** Text of an HTML page, for the write-up check: scripts, styles and tags removed, whitespace collapsed. */
export function pageText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|h\d|li|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}
