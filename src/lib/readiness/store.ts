import "server-only";
import { query } from "@/lib/db";
import { PartonError, partonConnected, structured } from "@/lib/parton/claude";
import {
  EXTRACT_SCHEMA,
  EXTRACT_SYSTEM,
  MAX_LEVEL,
  POSTINGS_MAX,
  POSTING_CHARS,
  acceptSkills,
  cleanLink,
  effectiveLevel,
  extractRequest,
  isEvidenceKind,
  readinessPercent,
  skillKey,
  type ExtractOutput,
  type Posting,
} from "./core";
import { DEFAULT_ROLE } from "./sourcing";

/**
 * The readiness scorecard's storage. Its tables are created here, on first use, rather than in db.ts, so the
 * feature stays in its own files.
 */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS readiness_postings (
     id SERIAL PRIMARY KEY,
     company TEXT NOT NULL DEFAULT '',
     role TEXT NOT NULL DEFAULT '',
     url TEXT,
     body TEXT NOT NULL,
     added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     archived_at TIMESTAMPTZ
   )`,
  `CREATE TABLE IF NOT EXISTS readiness_skills (
     id SERIAL PRIMARY KEY,
     key TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     area TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     frequency INTEGER NOT NULL DEFAULT 0,
     posting_count INTEGER NOT NULL DEFAULT 0,
     quotes JSONB NOT NULL DEFAULT '[]',
     level INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS readiness_evidence (
     id SERIAL PRIMARY KEY,
     skill_id INTEGER NOT NULL REFERENCES readiness_skills (id) ON DELETE CASCADE,
     kind TEXT NOT NULL,
     title TEXT NOT NULL,
     url TEXT,
     added_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS readiness_evidence_skill ON readiness_evidence (skill_id)`,
  // One row each time the skills are pulled from postings: the history of the scorecard, quarter by quarter.
  `CREATE TABLE IF NOT EXISTS readiness_checks (
     id SERIAL PRIMARY KEY,
     at TIMESTAMPTZ NOT NULL DEFAULT now(),
     postings INTEGER NOT NULL,
     skills INTEGER NOT NULL,
     readiness INTEGER
   )`,
];

const shared = globalThis as typeof globalThis & { __frontierReadiness?: Promise<void> };

function ready(): Promise<void> {
  shared.__frontierReadiness ??= (async () => {
    for (const statement of SCHEMA) await query(statement);
  })().catch((error) => {
    shared.__frontierReadiness = undefined;
    throw error;
  });
  return shared.__frontierReadiness;
}

async function q<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return query<T>(text, params);
}

// ---------------------------------------------------------------------------------------------
// Reading

export type Evidence = { id: number; kind: string; title: string; url: string | null; addedAt: Date };

export type Skill = {
  id: number;
  name: string;
  area: string;
  description: string;
  frequency: number;
  postingCount: number;
  quotes: string[];
  claimed: number;
  level: number;
  kinds: string[];
  evidence: Evidence[];
};

export type PostingRow = Posting & { url: string | null; addedAt: Date };

export type Check = { id: number; at: Date; postings: number; skills: number; readiness: number | null };

export type Scorecard = {
  skills: Skill[];
  postings: PostingRow[];
  checks: Check[];
  lastCheck: Date | null;
  readiness: number | null;
  /** True when postings were added or removed since the last extraction. */
  stale: boolean;
  parton: boolean;
  /** The role postings are found for, and whether the learner has set it. */
  role: string;
  roleSet: boolean;
};

const date = (v: unknown) => (v instanceof Date ? v : new Date(String(v)));

export async function loadScorecard(): Promise<Scorecard> {
  const [skillRows, evidenceRows, postingRows, checkRows, role] = await Promise.all([
    q<{ id: number; name: string; area: string; description: string; frequency: number; posting_count: number; quotes: string[]; level: number }>(
      "SELECT id, name, area, description, frequency, posting_count, quotes, level FROM readiness_skills ORDER BY frequency DESC, name",
    ),
    q<{ id: number; skill_id: number; kind: string; title: string; url: string | null; added_at: unknown }>(
      "SELECT id, skill_id, kind, title, url, added_at FROM readiness_evidence ORDER BY added_at",
    ),
    q<{ id: number; company: string; role: string; url: string | null; body: string; added_at: unknown }>(
      "SELECT id, company, role, url, body, added_at FROM readiness_postings WHERE archived_at IS NULL ORDER BY added_at, id",
    ),
    q<{ id: number; at: unknown; postings: number; skills: number; readiness: number | null }>(
      "SELECT id, at, postings, skills, readiness FROM readiness_checks ORDER BY at DESC",
    ),
    getRole(),
  ]);
  const evidence = new Map<number, Evidence[]>();
  for (const e of evidenceRows) {
    const list = evidence.get(e.skill_id) ?? [];
    list.push({ id: e.id, kind: e.kind, title: e.title, url: e.url, addedAt: date(e.added_at) });
    evidence.set(e.skill_id, list);
  }
  const skills: Skill[] = skillRows.map((s) => {
    const ev = evidence.get(s.id) ?? [];
    const kinds = ev.map((e) => e.kind);
    return {
      id: s.id,
      name: s.name,
      area: s.area,
      description: s.description,
      frequency: s.frequency,
      postingCount: s.posting_count,
      quotes: Array.isArray(s.quotes) ? s.quotes : [],
      claimed: s.level,
      level: effectiveLevel(s.level, kinds),
      kinds,
      evidence: ev,
    };
  });
  const checks = checkRows.map((c) => ({ id: c.id, at: date(c.at), postings: c.postings, skills: c.skills, readiness: c.readiness }));
  const lastCheck = checks[0]?.at ?? null;
  const postings = postingRows.map((p) => ({ id: p.id, company: p.company, role: p.role, url: p.url, body: p.body, addedAt: date(p.added_at) }));
  const changed = postings.some((p) => !lastCheck || p.addedAt > lastCheck);
  const removed = lastCheck !== null && checks[0].postings !== postings.length;
  return {
    skills,
    postings,
    checks,
    lastCheck,
    readiness: readinessPercent(skills),
    stale: postings.length > 0 && (changed || removed),
    parton: partonConnected(),
    role: role ?? DEFAULT_ROLE,
    roleSet: role !== null,
  };
}

// ---------------------------------------------------------------------------------------------
// Postings

export type Result = { ok: true; message?: string } | { ok: false; error: string };

export async function addPosting(input: { company: string; role: string; url: string; body: string }): Promise<Result> {
  const body = input.body.trim();
  if (body.length < 200) return { ok: false, error: "Paste the whole posting: at least the responsibilities and requirements." };
  if (body.length > POSTING_CHARS) return { ok: false, error: `That posting is over ${POSTING_CHARS.toLocaleString("en-IN")} characters. Trim the parts about benefits and the company.` };
  const [{ n }] = await q<{ n: number }>("SELECT count(*)::int AS n FROM readiness_postings WHERE archived_at IS NULL");
  if (n >= POSTINGS_MAX) return { ok: false, error: `You already have ${POSTINGS_MAX} postings. Remove one before adding another.` };
  const url = input.url.trim() ? cleanLink(input.url) : null;
  if (input.url.trim() && !url) return { ok: false, error: "That link doesn't look like a web address." };
  await q("INSERT INTO readiness_postings (company, role, url, body) VALUES ($1, $2, $3, $4)", [
    input.company.trim().slice(0, 120),
    input.role.trim().slice(0, 160),
    url,
    body,
  ]);
  return { ok: true, message: `Posting ${n + 1} added.` };
}

export async function removePosting(id: number) {
  await q("DELETE FROM readiness_postings WHERE id = $1 AND archived_at IS NULL", [id]);
}

/** Sets the current postings aside and stores the ones Parton found in their place. */
export async function replacePostings(openings: readonly { lab: string; title: string; url: string; text: string }[]) {
  await q("UPDATE readiness_postings SET archived_at = now() WHERE archived_at IS NULL");
  for (const o of openings) {
    await q("INSERT INTO readiness_postings (company, role, url, body) VALUES ($1, $2, $3, $4)", [
      o.lab.slice(0, 120),
      o.title.slice(0, 160),
      cleanLink(o.url),
      o.text.slice(0, POSTING_CHARS),
    ]);
  }
}

// ---------------------------------------------------------------------------------------------
// The target role

export async function getRole(): Promise<string | null> {
  const rows = await q<{ value: string }>("SELECT value FROM settings WHERE key = 'readiness_role'");
  return typeof rows[0]?.value === "string" ? rows[0].value : null;
}

export async function setRole(role: string) {
  await q(
    "INSERT INTO settings (key, value) VALUES ('readiness_role', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(role.trim().slice(0, 300))],
  );
}

// ---------------------------------------------------------------------------------------------
// Extraction

export async function extractSkills(): Promise<Result> {
  const postings = await q<{ id: number; company: string; role: string; body: string }>(
    "SELECT id, company, role, body FROM readiness_postings WHERE archived_at IS NULL ORDER BY added_at, id",
  );
  if (postings.length === 0) return { ok: false, error: "Paste some postings first." };
  const existing = await q<{ id: number; key: string; name: string; description: string }>("SELECT id, key, name, description FROM readiness_skills");

  let output: ExtractOutput;
  try {
    output = await structured<ExtractOutput>({
      system: EXTRACT_SYSTEM,
      messages: [{ role: "user", content: extractRequest(postings, existing) }],
      schema: EXTRACT_SCHEMA,
      effort: "high",
      maxTokens: 32000,
    });
  } catch (error) {
    return { ok: false, error: error instanceof PartonError ? error.message : "Parton ran into a problem. Please try again." };
  }

  const skills = acceptSkills(output, postings.length, existing);
  if (skills.length === 0) return { ok: false, error: "Parton couldn't find any skills in those postings. Check that they were pasted in full." };

  const byKey = new Map(existing.map((s) => [s.key, s]));
  const kept = new Set<number>();
  for (const s of skills) {
    const prior = s.existingKey ? byKey.get(s.existingKey) : undefined;
    if (prior) {
      kept.add(prior.id);
      await q(
        `UPDATE readiness_skills SET area = $2, description = $3, frequency = $4, posting_count = $5, quotes = $6::jsonb, updated_at = now() WHERE id = $1`,
        [prior.id, s.area, s.description || prior.description, s.postings.length, postings.length, JSON.stringify(s.quotes)],
      );
    } else {
      const [row] = await q<{ id: number }>(
        `INSERT INTO readiness_skills (key, name, area, description, frequency, posting_count, quotes)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         ON CONFLICT (key) DO UPDATE SET area = EXCLUDED.area, description = EXCLUDED.description, frequency = EXCLUDED.frequency,
           posting_count = EXCLUDED.posting_count, quotes = EXCLUDED.quotes, updated_at = now()
         RETURNING id`,
        [s.key, s.name, s.area, s.description, s.postings.length, postings.length, JSON.stringify(s.quotes)],
      );
      kept.add(row.id);
    }
  }
  // Skills these postings no longer ask for keep their scores and evidence, but stop counting.
  const dropped = existing.filter((s) => !kept.has(s.id)).map((s) => s.id);
  if (dropped.length) {
    await q("UPDATE readiness_skills SET frequency = 0, posting_count = $2, quotes = '[]'::jsonb, updated_at = now() WHERE id = ANY($1::int[])", [
      dropped,
      postings.length,
    ]);
  }

  const card = await loadScorecard();
  await q("INSERT INTO readiness_checks (postings, skills, readiness) VALUES ($1, $2, $3)", [
    postings.length,
    card.skills.filter((s) => s.frequency > 0).length,
    card.readiness,
  ]);
  const fresh = skills.filter((s) => !s.existingKey).length;
  return {
    ok: true,
    message: `Parton found ${skills.length} skills across ${postings.length} postings${existing.length ? `, ${fresh} of them new` : ""}.`,
  };
}

// ---------------------------------------------------------------------------------------------
// Scores and evidence

export async function setLevel(skillId: number, level: number) {
  if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) return;
  await q("UPDATE readiness_skills SET level = $2, updated_at = now() WHERE id = $1", [skillId, level]);
}

/**
 * Attaches evidence to a skill. Exported for other features too: a drill or a project can call this with a
 * path inside Frontier as its link.
 */
export async function addEvidence(skillId: number, input: { kind: string; title: string; url: string }): Promise<Result> {
  if (!isEvidenceKind(input.kind)) return { ok: false, error: "Choose what kind of evidence this is." };
  const title = input.title.trim().slice(0, 160);
  const url = input.url.trim() ? cleanLink(input.url) : null;
  if (input.url.trim() && !url) return { ok: false, error: "That link doesn't look like a web address or a Frontier page." };
  if (!url) return { ok: false, error: "Evidence needs a link, so it can be checked later." };
  const [skill] = await q<{ id: number }>("SELECT id FROM readiness_skills WHERE id = $1", [skillId]);
  if (!skill) return { ok: false, error: "That skill is no longer on the scorecard." };
  await q("INSERT INTO readiness_evidence (skill_id, kind, title, url) VALUES ($1, $2, $3, $4)", [skillId, input.kind, title || url, url]);
  return { ok: true };
}

export async function removeEvidence(id: number) {
  await q("DELETE FROM readiness_evidence WHERE id = $1", [id]);
}

export async function removeSkill(id: number) {
  await q("DELETE FROM readiness_skills WHERE id = $1", [id]);
}

/** Every skill by name and id, for features that want to offer "count this as evidence for…". */
export async function listSkills(): Promise<{ id: number; name: string; key: string }[]> {
  const rows = await q<{ id: number; name: string }>("SELECT id, name FROM readiness_skills ORDER BY frequency DESC, name");
  return rows.map((r) => ({ ...r, key: skillKey(r.name) }));
}
