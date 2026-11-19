import "server-only";
import { cache } from "react";
import { query } from "./db";
import { DRILLS } from "@/content/drills";
import { CASES } from "@/content/gym";
import { QUESTIONS } from "@/content/interview";
import { openSections, type GateContent, type SectionId } from "./sections";

/**
 * Which practice sections are open, by the rules in `sections.ts`. When a section first opens, that is kept in settings,
 * so it never closes again.
 */

const KEY = "sections_opened";

export const GATE_CONTENT: GateContent = { drills: DRILLS, cases: CASES, questions: QUESTIONS };

export type SectionState = { open: Set<SectionId>; openedAt: Record<string, string> };

async function mastered(): Promise<Set<string>> {
  const { masteredSet } = await import("./learning");
  return masteredSet();
}

async function load(): Promise<SectionState> {
  const [have, rows] = await Promise.all([
    mastered(),
    query<{ value: Record<string, string> | string }>("SELECT value FROM settings WHERE key = $1", [KEY]),
  ]);
  const raw = rows[0]?.value;
  const openedAt: Record<string, string> = raw ? (typeof raw === "string" ? JSON.parse(raw) : { ...raw }) : {};
  const open = openSections(GATE_CONTENT, have, Object.keys(openedAt));
  const fresh = [...open].filter((s) => !openedAt[s]);
  if (fresh.length) {
    const now = new Date().toISOString();
    for (const s of fresh) openedAt[s] = now;
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [KEY, JSON.stringify(openedAt)],
    );
  }
  return { open, openedAt };
}

/** The open sections, worked out once per request. */
export const sectionState = cache(load);

export async function isOpen(section: SectionId): Promise<boolean> {
  return (await sectionState()).open.has(section);
}
