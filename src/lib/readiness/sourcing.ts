/**
 * Finding postings without any pasting. Pure functions and constants, so they can be tested without the network.
 *
 * Most frontier labs publish their openings through a hiring platform with a public, unauthenticated job board
 * API (Greenhouse or Ashby). Frontier reads those boards directly, Parton picks the openings that match the
 * learner's target role, and their full text becomes the postings. A lab whose board can't be read is searched
 * on the web by Parton instead.
 */

export type Board =
  | { lab: string; kind: "greenhouse"; slug: string; careers: string }
  | { lab: string; kind: "ashby"; slug: string; careers: string };

export const BOARDS: Board[] = [
  { lab: "Anthropic", kind: "greenhouse", slug: "anthropic", careers: "https://www.anthropic.com/careers" },
  { lab: "OpenAI", kind: "ashby", slug: "openai", careers: "https://openai.com/careers" },
  { lab: "Google DeepMind", kind: "greenhouse", slug: "deepmind", careers: "https://deepmind.google/about/careers/" },
  { lab: "xAI", kind: "greenhouse", slug: "xai", careers: "https://x.ai/careers" },
  { lab: "Cohere", kind: "ashby", slug: "cohere", careers: "https://cohere.com/careers" },
];

export function boardUrl(b: Board): string {
  return b.kind === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${b.slug}/jobs?content=true`
    : `https://api.ashbyhq.com/posting-api/job-board/${b.slug}`;
}

export const DEFAULT_ROLE = "Research Engineer or Research Scientist working on large language models (pretraining, post-training, RL, evaluations, interpretability or inference)";

/** One opening on a lab's board, with its full text. */
export type Opening = { key: string; lab: string; title: string; location: string; team: string; url: string; text: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•" };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e: string) => {
    const lower = e.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return m;
  });
}

/** Posting HTML (which Greenhouse escapes once more) as readable plain text, keeping list items and paragraphs. */
export function htmlToText(html: string): string {
  let s = html;
  if (/&lt;[a-z/]/i.test(s)) s = decodeEntities(s);
  s = s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|h[1-6]|ul|ol|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(s)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type GreenhouseJob = { id: number; title: string; absolute_url: string; content?: string; location?: { name?: string }; departments?: { name?: string }[] };
type AshbyJob = { id: string; title: string; jobUrl?: string; descriptionPlain?: string; descriptionHtml?: string; location?: string; team?: string; department?: string; isListed?: boolean };

/** Reads one board's JSON into openings. Unknown shapes give an empty list rather than an error. */
export function parseBoard(board: Board, data: unknown): Opening[] {
  const jobs = (data as { jobs?: unknown[] })?.jobs;
  if (!Array.isArray(jobs)) return [];
  if (board.kind === "greenhouse") {
    return (jobs as GreenhouseJob[])
      .filter((j) => j && j.title && j.id != null)
      .map((j) => ({
        key: `${board.slug}:${j.id}`,
        lab: board.lab,
        title: String(j.title).trim(),
        location: j.location?.name ?? "",
        team: j.departments?.map((d) => d.name).filter(Boolean).join(", ") ?? "",
        url: j.absolute_url ?? board.careers,
        text: j.content ? htmlToText(j.content) : "",
      }));
  }
  return (jobs as AshbyJob[])
    .filter((j) => j && j.title && j.id != null && j.isListed !== false)
    .map((j) => ({
      key: `${board.slug}:${j.id}`,
      lab: board.lab,
      title: String(j.title).trim(),
      location: j.location ?? "",
      team: [j.department, j.team].filter(Boolean).join(", "),
      url: j.jobUrl ?? board.careers,
      text: j.descriptionPlain?.trim() || (j.descriptionHtml ? htmlToText(j.descriptionHtml) : ""),
    }));
}

/** Titles that are never research or engineering roles, dropped before Parton reads the list. */
const NOT_TECHNICAL = /\b(account executive|sales|recruit|counsel|legal|accountant|accounting|payroll|barista|chef|facilities|executive assistant|marketing|communications manager|public policy|partnerships|customer success|tax|finance|people partner|workplace|security officer|paralegal|procurement|events)\b/i;

/** The openings worth showing Parton: technical, with text, one per title per lab. */
export function candidates(openings: readonly Opening[]): Opening[] {
  const seen = new Set<string>();
  const out: Opening[] = [];
  for (const o of openings) {
    if (NOT_TECHNICAL.test(o.title) || o.text.length < 300) continue;
    const k = `${o.lab}|${o.title.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(o);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Parton picks the openings that match the target role

export const PICK_SCHEMA = {
  type: "object",
  properties: {
    picks: { type: "array", items: { type: "integer" }, description: "The numbers of the chosen openings, best match first." },
  },
  required: ["picks"],
  additionalProperties: false,
} as const;

export type PickOutput = { picks: number[] };

export const PICK_SYSTEM = `You are Parton, the tutor inside Frontier, a private learning platform for one learner preparing for roles at frontier AI labs.

You are choosing which current job openings to build the learner's readiness scorecard from. You see a numbered list of openings from several labs' job boards, and the learner's target role. Choose the openings that best match the target role: the roles the learner is aiming for, not adjacent ones. Prefer individual-contributor research and engineering roles over management roles unless the target says otherwise. Spread the choice across labs where good matches exist, so no single lab dominates. Never choose the same role twice from one lab, even in different locations.`;

export function pickRequest(role: string, openings: readonly Opening[], want: number): string {
  const rows = openings.map((o, i) => `${i + 1}. ${o.lab}: ${o.title}${o.team ? ` [${o.team}]` : ""}${o.location ? ` (${o.location})` : ""}`);
  return [
    `Target role: ${role}`,
    `Choose up to ${want} openings, best match first.`,
    `# Openings\n${rows.join("\n")}`,
  ].join("\n\n");
}

/** The chosen openings, in Parton's order, valid and without repeats. */
export function acceptPicks(output: PickOutput, openings: readonly Opening[], want: number): Opening[] {
  const chosen: Opening[] = [];
  const seen = new Set<number>();
  for (const n of output.picks ?? []) {
    if (!Number.isInteger(n) || n < 1 || n > openings.length || seen.has(n)) continue;
    seen.add(n);
    chosen.push(openings[n - 1]);
    if (chosen.length >= want) break;
  }
  return chosen;
}

// ---------------------------------------------------------------------------------------------
// Web search, for a lab whose board can't be read

export const SEARCH_SCHEMA = {
  type: "object",
  properties: {
    postings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string", description: "The posting's own page." },
          text: { type: "string", description: "The posting's responsibilities and requirements, as written in the posting." },
        },
        required: ["title", "url", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["postings"],
  additionalProperties: false,
} as const;

export type SearchOutput = { postings: { title: string; url: string; text: string }[] };

export const SEARCH_SYSTEM = `You are Parton, the tutor inside Frontier, a private learning platform for one learner preparing for roles at frontier AI labs.

You are finding current job postings at one lab for the learner's target role, so their readiness scorecard reflects what the lab is asking for now. Search the web, open the postings themselves on the lab's careers site or its hiring platform, and return only postings that are open now and match the target role. For each, copy the responsibilities and requirements as written, not a summary. Never invent a posting: if you can't open it, leave it out.`;

export function searchRequest(board: Board, role: string, want: number): string {
  return `Lab: ${board.lab} (careers page: ${board.careers})\nTarget role: ${role}\nFind up to ${want} current postings at ${board.lab} that match the target role.`;
}

export function acceptSearch(output: SearchOutput, board: Board, want: number): Opening[] {
  const out: Opening[] = [];
  for (const p of output.postings ?? []) {
    const title = p.title?.trim();
    const text = p.text?.trim();
    if (!title || !text || text.length < 300) continue;
    let url: string;
    try {
      const u = new URL(p.url);
      if (u.protocol !== "https:") continue;
      url = u.toString();
    } catch {
      continue;
    }
    if (out.some((o) => o.url === url || o.title.toLowerCase() === title.toLowerCase())) continue;
    out.push({ key: `web:${url}`, lab: board.lab, title, location: "", team: "", url, text });
    if (out.length >= want) break;
  }
  return out;
}
