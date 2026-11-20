import Link from "next/link";
import type { ReactNode } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { requireOwner } from "@/lib/auth";
import { SECTION_TITLES, type SectionId } from "@/lib/sections";
import { isOpen } from "@/lib/sections-store";

const WAITS_FOR: Record<SectionId, string> = {
  drills: "Drills open once you have mastered every lesson one drill tests.",
  gym: "The Debugging gym opens once you have mastered every lesson one of its cases rests on.",
  interview: "Mock interviews open once you have mastered what three questions in one mode rest on, a full session.",
  projects: "Projects open once you have mastered Ablations and The lab notebook, so you can train and diagnose a network and keep a reproducible record of experiments.",
  readiness: "The Readiness scorecard opens once Drills and Projects are both open, so you can earn evidence for every level it asks for.",
};

/**
 * Renders a practice section only once it has opened (see `src/lib/sections.ts`). Before then, it shows
 * what it waits for instead.
 */
export async function SectionGate({ section, children }: { section: SectionId; children: ReactNode }) {
  if (await isOpen(section)) return children;
  await requireOwner();
  return (
    <AuthFrame>
      <div className="card">
        <p className="eyebrow"><span className="mono-meta">{SECTION_TITLES[section].toLowerCase()} / locked</span></p>
        <h1>Locked</h1>
        <p className="lede">{WAITS_FOR[section]}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/map" className="btn">Open the map</Link>
        </div>
      </div>
    </AuthFrame>
  );
}
