import "server-only";
import { query } from "@/lib/db";

/**
 * Tables for Parton's help with projects. Created here, on first use, rather than in db.ts, so the feature stays
 * in its own files.
 */
const SCHEMA = [
  // Project questions Parton suggested from the Readiness gaps. Kept until used or replaced by a fresh batch.
  `CREATE TABLE IF NOT EXISTS project_suggestions (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     question TEXT NOT NULL,
     why TEXT NOT NULL,
     skills JSONB NOT NULL DEFAULT '[]',
     first_step TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     used_project_id INTEGER
   )`,
  // One draft of each kind per project. status is 'pending' while Parton is writing it, 'ready' or 'failed'.
  `CREATE TABLE IF NOT EXISTS project_drafts (
     project_id INTEGER NOT NULL REFERENCES projects (id),
     kind TEXT NOT NULL,
     status TEXT NOT NULL,
     body TEXT NOT NULL DEFAULT '',
     error TEXT NOT NULL DEFAULT '',
     at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (project_id, kind)
   )`,
  // Every completeness check, and every time the learner moved on despite one, with their reason.
  `CREATE TABLE IF NOT EXISTS project_reviews (
     id SERIAL PRIMARY KEY,
     project_id INTEGER NOT NULL REFERENCES projects (id),
     stage TEXT NOT NULL,
     fingerprint TEXT NOT NULL,
     complete BOOLEAN NOT NULL,
     gaps JSONB NOT NULL DEFAULT '[]',
     override TEXT,
     at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS project_reviews_project ON project_reviews (project_id, stage, at)`,
];

const shared = globalThis as typeof globalThis & { __frontierProjectAssist?: Promise<void> };

function ready(): Promise<void> {
  shared.__frontierProjectAssist ??= (async () => {
    for (const statement of SCHEMA) await query(statement);
  })().catch((error) => {
    shared.__frontierProjectAssist = undefined;
    throw error;
  });
  return shared.__frontierProjectAssist;
}

export async function q<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return query<T>(text, params);
}
