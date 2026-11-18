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
  { value: "lesson", label: "Mastered lesson" },
  { value: "other", label: "Other" },
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]["value"];

export const isEvidenceKind = (k: string): k is EvidenceKind => EVIDENCE_KINDS.some((e) => e.value === k);

export const evidenceLabel = (k: string) => EVIDENCE_KINDS.find((e) => e.value === k)?.label ?? "Other";

/**
 * The highest level a set of evidence can back. Level 1 never needs evidence. A mastered lesson shows the skill
 * was studied, so on its own it backs no more than Studied.
 */
export function supportedLevel(kinds: readonly string[]): number {
  kinds = kinds.filter((k) => k !== "lesson");
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

// ---------------------------------------------------------------------------------------------
// New and fading skills, quarter on quarter

/** How many points (out of 100) a skill's share of postings has to move to count as rising or fading. */
export const TREND_POINTS = 15;

export type Trend = "new" | "rising" | "fading" | "gone";

/** Each skill's share of the postings at one check: skill key to frequency over postings, 0 to 1. */
export type Shares = Record<string, number>;

export function sharesOf(skills: readonly { key: string; frequency: number }[], postings: number): Shares {
  const out: Shares = {};
  if (postings <= 0) return out;
  for (const s of skills) if (s.frequency > 0) out[s.key] = Math.round((s.frequency / postings) * 1000) / 1000;
  return out;
}

/**
 * How each skill moved between the previous check and the latest: new (no posting asked for it last time), rising,
 * fading (asked for noticeably less often), or gone (no current posting asks for it). Skills that held steady are
 * left out. Empty when there is no earlier check to compare with.
 */
export function skillTrends(previous: Shares | null, latest: Shares | null): Map<string, Trend> {
  const out = new Map<string, Trend>();
  if (!previous || !latest) return out;
  for (const [key, now] of Object.entries(latest)) {
    const then = previous[key] ?? 0;
    if (then === 0) out.set(key, "new");
    else if ((now - then) * 100 >= TREND_POINTS) out.set(key, "rising");
    else if ((then - now) * 100 >= TREND_POINTS) out.set(key, "fading");
  }
  for (const [key, then] of Object.entries(previous)) if (then > 0 && !(latest[key] > 0)) out.set(key, "gone");
  return out;
}

export const TREND_LABELS: Record<Trend, string> = {
  new: "New this quarter",
  rising: "Asked for more",
  fading: "Fading",
  gone: "No longer asked for",
};

// ---------------------------------------------------------------------------------------------
// Gaps: the skills worth working on next

/** The level a skill should reach before it stops counting as a gap: Built, a repository or project that uses it. */
export const TARGET_LEVEL = 3;

/** How much a skill holds the learner back: its share of postings times the levels it is short of Built, 0 to 1. */
export function gapScore(frequency: number, postingCount: number, level: number): number {
  if (frequency <= 0 || postingCount <= 0) return 0;
  return (frequency / postingCount) * (Math.max(0, TARGET_LEVEL - level) / TARGET_LEVEL);
}

// ---------------------------------------------------------------------------------------------
// Evidence gathered from Frontier itself, and Parton's scores

/** One thing the learner has done in Frontier that can back a skill. `ref` is stable, such as "drill:attention". */
export type FoundEvidence = { ref: string; kind: EvidenceKind; title: string; url: string; detail: string };

/** One thing the learner could do next in Frontier. */
export type NextOption = { ref: string; kind: "lesson" | "drill"; title: string; detail: string; open: boolean };

export type NextStep = { kind: "lesson" | "drill" | "project"; ref: string; title: string; why: string };

/** Turns a passed drill, a published project and a mastered lesson into evidence. A project gives two pieces. */
export function drillFound(d: { drillId: string; title: string; skills: string[]; bestSeconds: number; limitMinutes: number; inTime: boolean; passes: number }): FoundEvidence {
  const mins = Math.max(1, Math.round(d.bestSeconds / 60));
  return {
    ref: `drill:${d.drillId}`,
    kind: "drill",
    title: `Passed the ${d.title} drill`,
    url: `/drills/${d.drillId}`,
    detail: `Timed from-scratch drill covering ${d.skills.join(", ")}. Passed ${d.passes} time${d.passes === 1 ? "" : "s"}, fastest ${mins} min against a ${d.limitMinutes} min limit${d.inTime ? "" : " (over time)"}.`,
  };
}

export function projectFound(p: { id: number; title: string; question: string; writeupUrl: string; repoUrl: string }): FoundEvidence[] {
  const detail = `Published research project. Question: ${p.question.slice(0, 400)}`;
  const out: FoundEvidence[] = [];
  if (cleanLink(p.repoUrl)) out.push({ ref: `project:${p.id}`, kind: "project", title: `${p.title} (repository)`, url: cleanLink(p.repoUrl)!, detail });
  if (cleanLink(p.writeupUrl)) out.push({ ref: `writeup:${p.id}`, kind: "writeup", title: `${p.title} (write-up)`, url: cleanLink(p.writeupUrl)!, detail });
  return out;
}

export function lessonFound(l: { id: string; title: string; courseTitle: string; chapterTitle: string }): FoundEvidence {
  return { ref: `lesson:${l.id}`, kind: "lesson", title: `Mastered ${l.title}`, url: `/learn/${l.id}`, detail: `${l.courseTitle}, ${l.chapterTitle}` };
}

export const ASSESS_SCHEMA = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string", description: "The skill's exact name, as listed." },
          evidence: { type: "array", items: { type: "string" }, description: "The refs of every item under \"What the learner has done\" that genuinely shows this skill." },
          level: { type: "integer", minimum: 0, maximum: MAX_LEVEL },
          reason: { type: "string", description: "One or two sentences, to the learner, on why this level and what would raise it." },
          next_kind: { type: "string", enum: ["lesson", "drill", "project", "none"] },
          next_ref: { type: "string", description: "For a lesson or drill, its ref from \"What the learner could do next\". Otherwise empty." },
          next_title: { type: "string", description: "For a project, the project's question in one line. Otherwise empty." },
          next_why: { type: "string", description: "One sentence on why this is the best next step for the skill. Empty for none." },
          lessons: {
            type: "array",
            items: { type: "string" },
            description: "Refs of up to six lessons from \"What the learner could do next\" (open or locked) that teach the core of this skill, earliest in the curriculum first. Empty if none does.",
          },
        },
        required: ["skill", "evidence", "level", "reason", "next_kind", "next_ref", "next_title", "next_why", "lessons"],
        additionalProperties: false,
      },
    },
  },
  required: ["skills"],
  additionalProperties: false,
} as const;

export type AssessOutput = {
  skills: { skill: string; evidence: string[]; level: number; reason: string; next_kind: string; next_ref: string; next_title: string; next_why: string; lessons?: string[] }[];
};

export const ASSESS_SYSTEM = `You are Parton, the tutor inside Frontier, a private learning platform for one learner preparing for research and engineering roles at frontier AI labs.

Right now you are scoring the learner's readiness scorecard. It lists the skills current job postings keep asking for. For each skill you decide which things the learner has done in Frontier genuinely show it, score the skill from that evidence alone, and pick the single best next step to raise it.

The levels:
0 None: nothing shows it.
1 Studied: mastered lessons cover it, but nothing practical yet.
2 Practised: a passed drill, a write-up or other practical evidence exercises it.
3 Built: a published project's repository (or the learner's own repository) uses it substantially.
4 Published: as Built, plus a public write-up about work that uses it.

How to judge:
- Be strict and honest. Evidence counts for a skill only if it exercises the skill as the postings mean it. A drill implementing attention in NumPy shows transformer internals; it does not show distributed training. One introductory lesson does not make a skill Studied; the lessons should cover the core of it.
- Never score higher than the evidence you cite supports. With no evidence, the level is 0.
- The learner's own evidence, listed under a skill, counts too, judged the same way. You don't cite it by ref; it is already attached.
- The reason speaks to the learner directly, in one or two plain sentences: what the evidence shows and what is missing.

Choosing the next step, for each skill below Built:
- A drill, when a drill the learner has not passed exercises the skill. Drills are the fastest practical evidence.
- A lesson, when the learner lacks the foundations. Prefer lessons marked open now; name a locked lesson only if nothing open teaches the skill.
- A project, when the skill can only be shown by building something real, or the learner is already at Practised. Write a concrete, answerable research question in one line, small enough for a few weeks.
- Use only refs from the list. For a skill at Built or above, the next step is none unless a write-up would take it to Published, in which case suggest the project.

The lessons behind each skill: list up to six lessons, open or locked, that teach the core of the skill as the postings mean it, earliest in the curriculum first. Frontier uses them to steer the learner's lessons towards their weakest skills, but only once each lesson's prerequisites are mastered. Leave the list empty when no lesson really teaches the skill.

Write in British spelling (as used in India). No emojis. Return every listed skill exactly once.`;

export function assessRequest(
  skills: readonly { name: string; area: string; description: string; quotes: string[]; own: { kind: string; title: string; url: string }[] }[],
  found: readonly FoundEvidence[],
  options: readonly NextOption[],
): string {
  const skillLines = skills.map((s) => {
    const lines = [`## ${s.name} (${s.area})`, s.description];
    if (s.quotes.length) lines.push(`Postings say: ${s.quotes.map((q) => `"${q}"`).join("; ")}`);
    if (s.own.length) lines.push(`The learner's own evidence: ${s.own.map((e) => `${evidenceLabel(e.kind)} "${e.title}" (${e.url})`).join("; ")}`);
    return lines.filter(Boolean).join("\n");
  });
  const doneLines = found.map((f) => `- ${f.ref}: ${f.title}. ${f.detail}`);
  const nextLines = options.map((o) => `- ${o.ref}: ${o.title}${o.detail ? ` (${o.detail})` : ""}${o.kind === "lesson" ? (o.open ? " [open now]" : " [locked]") : ""}`);
  return [
    `# Skills on the scorecard\n\n${skillLines.join("\n\n")}`,
    `# What the learner has done\n${doneLines.join("\n") || "- nothing yet"}`,
    `# What the learner could do next\n${nextLines.join("\n") || "- nothing listed"}`,
    `Score all ${skills.length} skills.`,
  ].join("\n\n");
}

export type Assessment = {
  key: string;
  /** Refs of the found evidence that backs the skill. */
  evidence: string[];
  level: number;
  reason: string;
  next: NextStep | null;
  /** Lessons that teach the skill, as lesson ids. */
  lessons: string[];
};

/**
 * Keeps Parton's scores that name a real skill and real evidence, and caps each level at what its evidence
 * (Parton's picks plus the learner's own) can back. A skill with no evidence at all scores 0.
 */
export function acceptAssessment(
  output: AssessOutput,
  skills: readonly { key: string; ownKinds: readonly string[] }[],
  found: readonly FoundEvidence[],
  options: readonly NextOption[],
): Assessment[] {
  const byKey = new Map(skills.map((s) => [s.key, s]));
  const foundByRef = new Map(found.map((f) => [f.ref, f]));
  const optionByRef = new Map(options.map((o) => [o.ref, o]));
  const out = new Map<string, Assessment>();
  for (const raw of output.skills ?? []) {
    const key = skillKey(raw.skill ?? "");
    const skill = byKey.get(key);
    if (!skill || out.has(key)) continue;
    const evidence = [...new Set((raw.evidence ?? []).filter((r) => foundByRef.has(r)))];
    const kinds = [...evidence.map((r) => foundByRef.get(r)!.kind), ...skill.ownKinds];
    const cap = kinds.length === 0 ? 0 : supportedLevel(kinds);
    const asked = Number.isInteger(raw.level) ? raw.level : 0;
    const level = Math.max(0, Math.min(asked, cap, MAX_LEVEL));
    let next: NextStep | null = null;
    const why = (raw.next_why ?? "").trim().slice(0, 300);
    if (raw.next_kind === "lesson" || raw.next_kind === "drill") {
      const option = optionByRef.get(raw.next_ref);
      if (option && option.kind === raw.next_kind) next = { kind: option.kind, ref: option.ref, title: option.title, why };
    } else if (raw.next_kind === "project") {
      const title = (raw.next_title ?? "").trim().replace(/\s+/g, " ").slice(0, 300);
      if (title) next = { kind: "project", ref: "", title, why };
    }
    const lessons = [...new Set((raw.lessons ?? []).filter((r) => optionByRef.get(r)?.kind === "lesson").map((r) => r.replace(/^lesson:/, "")))].slice(0, 6);
    out.set(key, { key, evidence, level, reason: (raw.reason ?? "").trim().slice(0, 500), next, lessons });
  }
  return [...out.values()];
}

/** Where a next step leads inside Frontier. */
export function nextHref(next: NextStep): string {
  if (next.kind === "drill") return `/drills/${next.ref.replace(/^drill:/, "")}`;
  if (next.kind === "lesson") return `/learn/${next.ref.replace(/^lesson:/, "")}`;
  return "/projects";
}

/** A short, stable fingerprint of everything Parton's scores depend on, to tell when they need redoing. */
export function fingerprint(parts: readonly string[]): string {
  let h = 0x811c9dc5;
  for (const ch of [...parts].sort().join("\n")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${parts.length}:${h.toString(16)}`;
}
