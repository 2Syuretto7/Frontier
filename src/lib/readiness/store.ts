import "server-only";
import { query } from "@/lib/db";
import { PartonError, partonConnected, structured } from "@/lib/parton/claude";
import {
  ASSESS_SCHEMA,
  ASSESS_SYSTEM,
  EXTRACT_SCHEMA,
  EXTRACT_SYSTEM,
  MAX_LEVEL,
  TARGET_LEVEL,
  acceptAssessment,
  assessRequest,
  drillFound,
  fingerprint,
  gapScore,
  lessonFound,
  projectFound,
  recheckDue,
  sharesOf,
  skillTrends,
  supportedLevel,
  type AssessOutput,
  type FoundEvidence,
  type NextOption,
  type NextStep,
  type Shares,
  type Trend,
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
  // Evidence Frontier finds by itself (passed drills, published projects, mastered lessons) is stored with
  // source 'parton' and a stable ref. The learner can dismiss it; dismissed evidence stays hidden on re-scoring.
  `ALTER TABLE readiness_evidence ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'learner'`,
  `ALTER TABLE readiness_evidence ADD COLUMN IF NOT EXISTS ref TEXT`,
  `ALTER TABLE readiness_evidence ADD COLUMN IF NOT EXISTS dismissed BOOLEAN NOT NULL DEFAULT false`,
  // Who set each skill's level: 'parton' (Parton's score, not yet confirmed), 'confirmed' (Parton's score, which
  // the learner confirmed) or 'learner' (the learner chose it). Parton only ever changes a level it set itself.
  `ALTER TABLE readiness_skills ADD COLUMN IF NOT EXISTS level_source TEXT`,
  `UPDATE readiness_skills SET level_source = CASE WHEN level > 0 THEN 'learner' ELSE 'parton' END WHERE level_source IS NULL`,
  `ALTER TABLE readiness_skills ADD COLUMN IF NOT EXISTS suggested_level INTEGER`,
  `ALTER TABLE readiness_skills ADD COLUMN IF NOT EXISTS suggested_reason TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE readiness_skills ADD COLUMN IF NOT EXISTS next_step JSONB`,
  // Each skill's share of the postings at each check, to show which skills are new or fading.
  `ALTER TABLE readiness_checks ADD COLUMN IF NOT EXISTS shares JSONB`,
  // The lessons that teach each skill, as Parton picked them, for the weekly plan that steers Learn.
  `ALTER TABLE readiness_skills ADD COLUMN IF NOT EXISTS lessons JSONB`,
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

export type Evidence = { id: number; kind: string; title: string; url: string | null; addedAt: Date; auto: boolean };

export type LevelSource = "parton" | "confirmed" | "learner";

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
  key: string;
  /** Who set the claimed level. */
  levelSource: LevelSource;
  /** Parton's latest score from the evidence, and why, or null before Parton has scored the skill. */
  suggested: number | null;
  reason: string;
  /** The best next step to raise the skill, when it is below Built. */
  next: NextStep | null;
  /** How the skill moved since the previous check of postings. */
  trend: Trend | null;
  /** How much the skill holds readiness back, 0 to 1. */
  gap: number;
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
  /** Skills whose level is Parton's score and not yet confirmed. */
  unconfirmed: number;
  /** Whether the latest check can be compared with an earlier one for new and fading skills. */
  compared: boolean;
};

const date = (v: unknown) => (v instanceof Date ? v : new Date(String(v)));

export async function loadScorecard(): Promise<Scorecard> {
  const [skillRows, evidenceRows, postingRows, checkRows, role] = await Promise.all([
    q<{
      id: number; key: string; name: string; area: string; description: string; frequency: number; posting_count: number; quotes: string[]; level: number;
      level_source: string | null; suggested_level: number | null; suggested_reason: string; next_step: NextStep | string | null;
    }>(
      `SELECT id, key, name, area, description, frequency, posting_count, quotes, level, level_source, suggested_level, suggested_reason, next_step
         FROM readiness_skills ORDER BY frequency DESC, name`,
    ),
    q<{ id: number; skill_id: number; kind: string; title: string; url: string | null; added_at: unknown; source: string }>(
      "SELECT id, skill_id, kind, title, url, added_at, source FROM readiness_evidence WHERE NOT dismissed ORDER BY source DESC, added_at, id",
    ),
    q<{ id: number; company: string; role: string; url: string | null; body: string; added_at: unknown }>(
      "SELECT id, company, role, url, body, added_at FROM readiness_postings WHERE archived_at IS NULL ORDER BY added_at, id",
    ),
    q<{ id: number; at: unknown; postings: number; skills: number; readiness: number | null; shares: Shares | string | null }>(
      "SELECT id, at, postings, skills, readiness, shares FROM readiness_checks ORDER BY at DESC, id DESC",
    ),
    getRole(),
  ]);
  const evidence = new Map<number, Evidence[]>();
  for (const e of evidenceRows) {
    const list = evidence.get(e.skill_id) ?? [];
    list.push({ id: e.id, kind: e.kind, title: e.title, url: e.url, addedAt: date(e.added_at), auto: e.source === "parton" });
    evidence.set(e.skill_id, list);
  }
  const sharesAt = (i: number): Shares | null => {
    const v = checkRows[i]?.shares;
    return v == null ? null : typeof v === "string" ? (JSON.parse(v) as Shares) : v;
  };
  const trends = skillTrends(sharesAt(1), sharesAt(0));
  const skills: Skill[] = skillRows.map((s) => {
    const ev = evidence.get(s.id) ?? [];
    const kinds = ev.map((e) => e.kind);
    const level = effectiveLevel(s.level, kinds);
    const next = typeof s.next_step === "string" ? (JSON.parse(s.next_step) as NextStep) : s.next_step;
    return {
      id: s.id,
      name: s.name,
      area: s.area,
      description: s.description,
      frequency: s.frequency,
      postingCount: s.posting_count,
      quotes: Array.isArray(s.quotes) ? s.quotes : [],
      claimed: s.level,
      level,
      kinds,
      evidence: ev,
      key: s.key,
      levelSource: s.level_source === "confirmed" || s.level_source === "learner" ? s.level_source : "parton",
      suggested: s.suggested_level,
      reason: s.suggested_reason ?? "",
      next: next ?? null,
      trend: trends.get(s.key) ?? null,
      gap: gapScore(s.frequency, s.posting_count, level),
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
    unconfirmed: skills.filter((s) => s.frequency > 0 && s.levelSource === "parton" && s.suggested !== null).length,
    compared: sharesAt(1) !== null && sharesAt(0) !== null,
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
        `INSERT INTO readiness_skills (key, name, area, description, frequency, posting_count, quotes, level_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'parton')
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
  await q("INSERT INTO readiness_checks (postings, skills, readiness, shares) VALUES ($1, $2, $3, $4::jsonb)", [
    postings.length,
    card.skills.filter((s) => s.frequency > 0).length,
    card.readiness,
    JSON.stringify(sharesOf(card.skills, postings.length)),
  ]);
  const fresh = skills.filter((s) => !s.existingKey).length;
  return {
    ok: true,
    message: `Parton found ${skills.length} skills across ${postings.length} postings${existing.length ? `, ${fresh} of them new` : ""}.`,
  };
}

// ---------------------------------------------------------------------------------------------
// Scores and evidence

/** The learner sets (or corrects) a level. Parton won't change it again; it only suggests. */
export async function setLevel(skillId: number, level: number) {
  if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) return;
  await q(
    `UPDATE readiness_skills SET level = $2, level_source = CASE WHEN suggested_level = $2 THEN 'confirmed' ELSE 'learner' END, updated_at = now()
      WHERE id = $1`,
    [skillId, level],
  );
}

/** The learner confirms Parton's score for one skill, or for every skill when no id is given. */
export async function confirmLevel(skillId?: number) {
  if (skillId === undefined) {
    await q("UPDATE readiness_skills SET level_source = 'confirmed', updated_at = now() WHERE level_source = 'parton' AND suggested_level IS NOT NULL");
    return;
  }
  await q("UPDATE readiness_skills SET level_source = 'confirmed', updated_at = now() WHERE id = $1 AND level_source = 'parton'", [skillId]);
}

/** The learner takes Parton's newer score in place of the level they had. */
export async function acceptSuggestion(skillId: number) {
  await q(
    `UPDATE readiness_skills SET level = suggested_level, level_source = 'confirmed', updated_at = now()
      WHERE id = $1 AND suggested_level IS NOT NULL`,
    [skillId],
  );
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

/** Removes the learner's own evidence. Evidence Parton found is dismissed instead, so re-scoring doesn't bring it back. */
export async function removeEvidence(id: number) {
  await q("UPDATE readiness_evidence SET dismissed = true WHERE id = $1 AND source = 'parton'", [id]);
  await q("DELETE FROM readiness_evidence WHERE id = $1 AND source <> 'parton'", [id]);
}

export async function removeSkill(id: number) {
  await q("DELETE FROM readiness_skills WHERE id = $1", [id]);
}

/** Every skill by name and id, for features that want to offer "count this as evidence for…". */
export async function listSkills(): Promise<{ id: number; name: string; key: string }[]> {
  const rows = await q<{ id: number; name: string }>("SELECT id, name FROM readiness_skills ORDER BY frequency DESC, name");
  return rows.map((r) => ({ ...r, key: skillKey(r.name) }));
}

// ---------------------------------------------------------------------------------------------
// Evidence found automatically, and Parton's scores

/** What the learner has done in Frontier, as evidence, and what they could do next. Loaded lazily: it reads the curriculum. */
async function gather(): Promise<{ found: FoundEvidence[]; options: NextOption[] }> {
  const [{ drillEvidence }, { publishedProjects }, { masteredSet }, { GRAPH }, { isUnlocked }, { DRILLS }] = await Promise.all([
    import("@/lib/drills"),
    import("@/lib/projects"),
    import("@/lib/learning"),
    import("@/lib/curriculum"),
    import("@/lib/graph"),
    import("@/content/drills"),
  ]);
  const [passed, projects, mastered] = await Promise.all([drillEvidence(), publishedProjects(), masteredSet()]);
  const found: FoundEvidence[] = [
    ...passed.map(drillFound),
    ...projects.flatMap(projectFound),
    ...GRAPH.order.filter((id) => mastered.has(id)).map((id) => lessonFound(GRAPH.nodes.get(id)!)),
  ];
  const passedIds = new Set(passed.map((d) => d.drillId));
  const options: NextOption[] = [
    ...DRILLS.filter((d) => !passedIds.has(d.id)).map((d) => ({
      ref: `drill:${d.id}`, kind: "drill" as const, title: d.title, detail: `drill on ${d.skills.join(", ")}`, open: true,
    })),
    ...GRAPH.order
      .map((id) => GRAPH.nodes.get(id)!)
      .filter((n) => n.authored && !mastered.has(n.id))
      .map((n) => ({ ref: `lesson:${n.id}`, kind: "lesson" as const, title: n.title, detail: n.courseTitle, open: isUnlocked(GRAPH, n.id, mastered) })),
  ];
  return { found, options };
}

/**
 * The ids of everything Parton's scores depend on: the skills postings ask for, passed drills, published projects,
 * mastered lessons and the learner's own evidence. Cheap: plain queries, no curriculum.
 */
async function currentFingerprint(): Promise<string> {
  const { drillEvidence } = await import("@/lib/drills");
  const [skills, own, projects, mastered, drills] = await Promise.all([
    q<{ key: string }>("SELECT key FROM readiness_skills WHERE frequency > 0"),
    q<{ id: number }>("SELECT id FROM readiness_evidence WHERE source <> 'parton'"),
    query<{ id: number }>("SELECT id FROM projects WHERE status = 'published'"),
    query<{ lesson_id: string }>("SELECT lesson_id FROM progress WHERE status = 'mastered'"),
    drillEvidence(),
  ]);
  if (skills.length === 0) return "";
  return fingerprint([
    // Bumped when Parton's scoring asks for something new, so every scorecard is scored again once.
    "scoring:lessons-v1",
    ...skills.map((s) => `skill:${s.key}`),
    ...own.map((e) => `own:${e.id}`),
    ...projects.map((p) => `project:${p.id}`),
    ...mastered.map((m) => `lesson:${m.lesson_id}`),
    ...drills.map((d) => `drill:${d.drillId}`),
  ]);
}

const SCORED_KEY = "readiness_scored";

/** True when there are skills and something they depend on changed since Parton last scored them. */
export async function needsScoring(): Promise<boolean> {
  const [now, rows] = await Promise.all([currentFingerprint(), q<{ value: string }>("SELECT value FROM settings WHERE key = $1", [SCORED_KEY])]);
  return now !== "" && rows[0]?.value !== now;
}

/**
 * Parton scores every skill the postings ask for: it attaches the evidence it finds in Frontier, sets a level from
 * that evidence (only where the learner hasn't set one themself) and picks the best next step for each.
 */
export async function scoreSkills(): Promise<Result> {
  const print = await currentFingerprint();
  const skills = await q<{ id: number; key: string; name: string; area: string; description: string; quotes: string[] }>(
    "SELECT id, key, name, area, description, quotes FROM readiness_skills WHERE frequency > 0 ORDER BY frequency DESC, name",
  );
  if (skills.length === 0) return { ok: false, error: "There are no skills to score yet." };
  const own = await q<{ skill_id: number; kind: string; title: string; url: string }>(
    "SELECT skill_id, kind, title, url FROM readiness_evidence WHERE source <> 'parton' ORDER BY added_at",
  );
  const ownBy = new Map<number, { kind: string; title: string; url: string }[]>();
  for (const e of own) ownBy.set(e.skill_id, [...(ownBy.get(e.skill_id) ?? []), e]);
  const { found, options } = await gather();

  let output: AssessOutput;
  try {
    output = await structured<AssessOutput>({
      system: ASSESS_SYSTEM,
      messages: [{
        role: "user",
        content: assessRequest(
          skills.map((s) => ({ ...s, quotes: Array.isArray(s.quotes) ? s.quotes : [], own: ownBy.get(s.id) ?? [] })),
          found,
          options,
        ),
      }],
      schema: ASSESS_SCHEMA,
      effort: "medium",
      maxTokens: 32000,
    });
  } catch (error) {
    return { ok: false, error: error instanceof PartonError ? error.message : "Parton ran into a problem. Please try again." };
  }

  const results = acceptAssessment(
    output,
    skills.map((s) => ({ key: s.key, ownKinds: (ownBy.get(s.id) ?? []).map((e) => e.kind) })),
    found,
    options,
  );
  if (results.length === 0) return { ok: false, error: "Parton's scores didn't match the skills on the scorecard. Please try again." };

  const idByKey = new Map(skills.map((s) => [s.key, s.id]));
  const foundByRef = new Map(found.map((f) => [f.ref, f]));
  let attached = 0;
  for (const r of results) {
    const skillId = idByKey.get(r.key)!;
    const prior = await q<{ id: number; ref: string; dismissed: boolean }>(
      "SELECT id, ref, dismissed FROM readiness_evidence WHERE skill_id = $1 AND source = 'parton'",
      [skillId],
    );
    const priorByRef = new Map(prior.map((p) => [p.ref, p]));
    // Evidence the learner dismissed doesn't count, so the level is capped again without it.
    const kept = r.evidence.filter((ref) => !priorByRef.get(ref)?.dismissed);
    if (kept.length < r.evidence.length) {
      const kinds = [...kept.map((ref) => foundByRef.get(ref)!.kind), ...(ownBy.get(skillId) ?? []).map((e) => e.kind)];
      r.level = Math.min(r.level, kinds.length ? supportedLevel(kinds) : 0);
      r.evidence = kept;
    }
    const wanted = new Set(r.evidence);
    const stale = prior.filter((p) => !p.dismissed && !wanted.has(p.ref)).map((p) => p.id);
    if (stale.length) await q("DELETE FROM readiness_evidence WHERE id = ANY($1::int[])", [stale]);
    for (const ref of r.evidence) {
      const f = foundByRef.get(ref)!;
      const existing = priorByRef.get(ref);
      if (existing?.dismissed) continue;
      attached++;
      if (existing) await q("UPDATE readiness_evidence SET kind = $2, title = $3, url = $4 WHERE id = $1", [existing.id, f.kind, f.title.slice(0, 160), f.url]);
      else await q("INSERT INTO readiness_evidence (skill_id, kind, title, url, source, ref) VALUES ($1, $2, $3, $4, 'parton', $5)", [skillId, f.kind, f.title.slice(0, 160), f.url, ref]);
    }
    await q(
      `UPDATE readiness_skills
          SET suggested_level = $2, suggested_reason = $3, next_step = $4::jsonb, lessons = $5::jsonb,
              level = CASE WHEN level_source = 'parton' THEN $2 ELSE level END,
              level_source = CASE WHEN level_source = 'confirmed' AND level <> $2 THEN 'learner' ELSE level_source END,
              updated_at = now()
        WHERE id = $1`,
      [skillId, r.level, r.reason, r.next ? JSON.stringify(r.next) : null, JSON.stringify(r.lessons)],
    );
  }
  await q(
    "INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [SCORED_KEY, JSON.stringify(print)],
  );
  return { ok: true, message: `Parton scored ${results.length} skills from ${attached} piece${attached === 1 ? "" : "s"} of evidence found in Frontier.` };
}

/**
 * The skills holding readiness back most, weakest and most asked for first, each with Parton's suggested next
 * step. For other features (Drills, Projects) to aim at. Empty when there is no scorecard.
 */
export async function readinessGaps(): Promise<{
  key: string; name: string; area: string; description: string; frequency: number; postingCount: number; level: number; gap: number; next: NextStep | null;
  lessons: string[] | null;
}[]> {
  const [card, rows] = await Promise.all([loadScorecard(), q<{ key: string; lessons: string[] | string | null }>("SELECT key, lessons FROM readiness_skills")]);
  const lessons = new Map(rows.map((r) => [r.key, typeof r.lessons === "string" ? (JSON.parse(r.lessons) as string[]) : r.lessons]));
  return card.skills
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .map((s) => ({
      key: s.key, name: s.name, area: s.area, description: s.description, frequency: s.frequency, postingCount: s.postingCount, level: s.level, gap: s.gap, next: s.next,
      lessons: Array.isArray(lessons.get(s.key)) ? lessons.get(s.key)! : null,
    }));
}

/** The id of the latest check of postings, or null before the first: a new one means labs' asks may have changed. */
export async function latestCheckId(): Promise<number | null> {
  const rows = await q<{ id: number }>("SELECT id FROM readiness_checks ORDER BY at DESC, id DESC LIMIT 1");
  return rows[0] ? Number(rows[0].id) : null;
}

// ---------------------------------------------------------------------------------------------
// The scheduled run

export type ScheduledStep = "read" | "found" | "scored" | "nothing";

/**
 * One step of keeping the scorecard current, run on a schedule several times a night so each step gets its own
 * time limit: read postings that changed, else find fresh postings when the quarterly re-check is due, else
 * re-score when new evidence has appeared. Does nothing until the learner has built a scorecard once.
 */
export async function runScheduledStep(): Promise<{ step: ScheduledStep; result?: Result }> {
  if (!partonConnected()) return { step: "nothing" };
  const card = await loadScorecard();
  if (card.skills.length === 0) return { step: "nothing" };
  if (card.stale) return { step: "read", result: await extractSkills() };
  if (recheckDue(card.lastCheck)) {
    const { findPostings } = await import("./find");
    const found = await findPostings(card.role);
    if (found.openings.length === 0) return { step: "found", result: { ok: false, error: "No matching postings found." } };
    await replacePostings(found.openings);
    return { step: "found", result: { ok: true, message: `Found ${found.openings.length} postings.` } };
  }
  if (await needsScoring()) return { step: "scored", result: await scoreSkills() };
  return { step: "nothing" };
}
