/**
 * The readiness scorecard. Pure functions and constants, so they can be tested without a database or the API.
 *
 * The learner pastes 10 to 20 current job postings for their target role. Parton pulls out the skills the
 * postings keep asking for. The learner scores themself on each skill, and every score above "Studied" has to
 * be backed by evidence: a repository, a passed drill, a project, a write-up. Postings change, so the whole
 * card is re-checked against fresh postings every quarter.
 */

// ---------------------------------------------------------------------------------------------
// Levels and evidence

export const LEVELS = [
  { value: 0, label: "None", needs: "Nothing yet." },
  { value: 1, label: "Studied", needs: "You have learned it. No evidence needed." },
  { value: 2, label: "Practised", needs: "Any evidence, such as a passed drill." },
  { value: 3, label: "Built", needs: "A repository or a project that uses it." },
  { value: 4, label: "Published", needs: "A write-up, plus a repository or project." },
] as const;

export const MAX_LEVEL = 4;

/**
 * Kinds of evidence. A piece of evidence is a kind, a title and a link. The link can be any https URL or a path
 * inside Frontier (such as a drill or project page), so features added later can be pointed at without changes here.
 */
export const EVIDENCE_KINDS = [
  { value: "repo", label: "Repository" },
  { value: "drill", label: "Passed drill" },
  { value: "project", label: "Project" },
  { value: "writeup", label: "Write-up" },
  { value: "other", label: "Other" },
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]["value"];

export const isEvidenceKind = (k: string): k is EvidenceKind => EVIDENCE_KINDS.some((e) => e.value === k);

export const evidenceLabel = (k: string) => EVIDENCE_KINDS.find((e) => e.value === k)?.label ?? "Other";

/** The highest level a set of evidence can back. Level 1 never needs evidence. */
export function supportedLevel(kinds: readonly string[]): number {
  if (kinds.length === 0) return 1;
  const built = kinds.some((k) => k === "repo" || k === "project");
  if (built && kinds.includes("writeup")) return 4;
  if (built) return 3;
  return 2;
}

/** The level that counts: what the learner claims, capped by what their evidence backs. */
export const effectiveLevel = (claimed: number, kinds: readonly string[]) =>
  Math.max(0, Math.min(claimed, supportedLevel(kinds), MAX_LEVEL));

/**
 * Checks a link for a piece of evidence. Accepts an http(s) URL, or a path inside Frontier starting with "/".
 * Returns the cleaned link, or null if it is not one of those.
 */
export function cleanLink(raw: string): string | null {
  const text = raw.trim();
  if (!text || text.startsWith("//")) return null;
  if (text.startsWith("/")) return /^\/[\w\-./?=&#%~]*$/.test(text) ? text : null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// The score

export type ScoredSkill = { frequency: number; claimed: number; kinds: readonly string[] };

/**
 * Overall readiness, 0 to 100: each skill's level out of 4, weighted by how many postings ask for it.
 * Skills that no current posting asks for (frequency 0) do not count. Null when there is nothing to score.
 */
export function readinessPercent(skills: readonly ScoredSkill[]): number | null {
  let got = 0;
  let max = 0;
  for (const s of skills) {
    if (s.frequency <= 0) continue;
    got += s.frequency * effectiveLevel(s.claimed, s.kinds);
    max += s.frequency * MAX_LEVEL;
  }
  return max === 0 ? null : Math.round((got / max) * 100);
}

// ---------------------------------------------------------------------------------------------
// Quarterly re-check

export const RECHECK_DAYS = 91;
const DAY = 24 * 60 * 60 * 1000;

/** Days until the next re-check is due (negative when overdue), or null if there has never been a check. */
export function daysUntilRecheck(lastCheck: Date | null, now = new Date()): number | null {
  if (!lastCheck) return null;
  return Math.ceil((lastCheck.getTime() + RECHECK_DAYS * DAY - now.getTime()) / DAY);
}

export const recheckDue = (lastCheck: Date | null, now = new Date()) => {
  const d = daysUntilRecheck(lastCheck, now);
  return d !== null && d <= 0;
};

/** "Q4 2026", by calendar quarter in India time. */
export function quarterLabel(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return `Q${Math.floor(ist.getUTCMonth() / 3) + 1} ${ist.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------------------------------
// Postings

export const POSTINGS_MIN = 10;
export const POSTINGS_MAX = 20;
export const POSTING_CHARS = 20000;

export type Posting = { id: number; company: string; role: string; body: string };

// ---------------------------------------------------------------------------------------------
// Extraction with Parton

export const AREAS = ["Mathematics", "Machine learning", "ML engineering", "Research", "Software engineering", "Communication"] as const;

export const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "A short name for the skill, 2 to 6 words, such as \"Distributed training at scale\"." },
          area: { type: "string", enum: [...AREAS] },
          description: { type: "string", description: "One sentence on what the postings mean by it, concrete enough to judge evidence against." },
          postings: { type: "array", items: { type: "integer" }, description: "The numbers of every posting that asks for this skill." },
          quotes: { type: "array", items: { type: "string" }, description: "Up to three short exact phrases from the postings that ask for it." },
          existing: { type: "string", description: "If this is one of the skills already on the scorecard, its exact name. Otherwise empty." },
        },
        required: ["name", "area", "description", "postings", "quotes", "existing"],
        additionalProperties: false,
      },
    },
  },
  required: ["skills"],
  additionalProperties: false,
} as const;

export type ExtractOutput = {
  skills: { name: string; area: string; description: string; postings: number[]; quotes: string[]; existing: string }[];
};

export const EXTRACT_SYSTEM = `You are Parton, the tutor inside Frontier, a private learning platform for one learner preparing for research and engineering roles at frontier AI labs.

Right now you are not tutoring. You are reading job postings the learner has pasted for their target role, and pulling out the skills the postings keep asking for, so the learner can score themself on each one against evidence.

What makes a good skill:
- It recurs. Prefer skills several postings ask for. Include a skill only one posting asks for only if it is central to that posting.
- It is specific enough to be proven with a repository, a passed coding drill, a project or a write-up. "Strong communication" is too vague; "Writing clear research write-ups" is fine. "Python" is fine; "Coding" is too vague.
- It is one skill, not a bundle. Split "PyTorch and JAX" only if the postings treat them differently; otherwise name the shared skill.
- Merge postings' different wordings of the same skill into one skill.
- Skip things that are not skills: years of experience, degrees, visa status, location, benefits, company values.

Aim for 12 to 30 skills, ordered from most to least often asked for. For each skill, list the number of every posting that asks for it, explicitly or clearly implied, and up to three short exact phrases from the postings as quotes.

If the learner already has skills on their scorecard, reuse a skill's exact name in "existing" when a skill you find is the same skill, so their scores and evidence carry over. Do not force a match: leave "existing" empty for a new skill.

Write in British spelling (as used in India). No emojis.`;

/** What the model reads: the numbered postings and the skills already on the scorecard. */
export function extractRequest(postings: readonly Posting[], existing: readonly { name: string; description: string }[]): string {
  const parts = postings.map((p, i) =>
    [`# Posting ${i + 1}: ${p.role || "Untitled role"}${p.company ? ` at ${p.company}` : ""}`, p.body.slice(0, POSTING_CHARS)].join("\n\n"),
  );
  parts.push(
    `# Skills already on the scorecard\n${existing.map((s) => `- ${s.name}: ${s.description}`).join("\n") || "- none yet"}`,
  );
  parts.push(`There are ${postings.length} postings, numbered 1 to ${postings.length}. Use only those numbers in "postings".`);
  return parts.join("\n\n");
}

/** Lower case, letters and digits only: the key two skill names are matched on. */
export function skillKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

export type ExtractedSkill = {
  key: string;
  name: string;
  area: string;
  description: string;
  /** Zero-based indices into the postings. */
  postings: number[];
  quotes: string[];
  /** The key of the existing skill this one continues, if any. */
  existingKey: string | null;
};

/**
 * Keeps the extracted skills that are well formed and refer to real postings, merges duplicates by name,
 * and matches each to an existing skill by its "existing" name or its own name.
 */
export function acceptSkills(
  output: ExtractOutput,
  postingCount: number,
  existing: readonly { name: string }[],
  limit = 40,
): ExtractedSkill[] {
  const existingKeys = new Set(existing.map((s) => skillKey(s.name)));
  const byKey = new Map<string, ExtractedSkill>();
  for (const raw of output.skills ?? []) {
    const name = raw.name?.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!name) continue;
    const postings = [...new Set((raw.postings ?? []).filter((n) => Number.isInteger(n) && n >= 1 && n <= postingCount).map((n) => n - 1))].sort((a, b) => a - b);
    if (postings.length === 0) continue;
    const claimed = skillKey(raw.existing ?? "");
    const own = skillKey(name);
    const existingKey = claimed && existingKeys.has(claimed) ? claimed : existingKeys.has(own) ? own : null;
    const key = existingKey ?? own;
    if (!key) continue;
    const quotes = (raw.quotes ?? []).map((q) => q.trim().slice(0, 200)).filter(Boolean);
    const prior = byKey.get(key);
    if (prior) {
      prior.postings = [...new Set([...prior.postings, ...postings])].sort((a, b) => a - b);
      prior.quotes = [...new Set([...prior.quotes, ...quotes])].slice(0, 3);
      continue;
    }
    byKey.set(key, {
      key,
      name,
      area: (AREAS as readonly string[]).includes(raw.area) ? raw.area : "Machine learning",
      description: (raw.description ?? "").trim().slice(0, 400),
      postings,
      quotes: quotes.slice(0, 3),
      existingKey,
    });
  }
  return [...byKey.values()].sort((a, b) => b.postings.length - a.postings.length).slice(0, limit);
}
