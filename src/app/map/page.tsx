import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { COURSES } from "@/lib/graph";
import { LESSON_BY_ID } from "@/lib/curriculum";
import { masteredSet } from "@/lib/learning";
import { TopBar } from "@/components/TopBar";
import { TRACK_NAMES, TRACKS, type Track } from "@/lib/types";
import { ChevronRight } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Map" };

const TIERS = ["Bridge from zero", "First-year university", "Core undergraduate", "Advanced undergraduate", "Graduate core", "Graduate specialisation"];

export default async function MapPage() {
  await requireOwner();
  const mastered = await masteredSet();
  const total = COURSES.reduce((n, c) => n + c.chapters.reduce((m, ch) => m + ch.lessons.length, 0), 0);
  const column = (track: Track, tier: number) =>
    COURSES.filter((c) => c.track === track && c.tier === tier).map((c) => {
      const ids = c.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
      const done = ids.filter((id) => mastered.has(id)).length;
      const ready = ids.filter((id) => LESSON_BY_ID.has(id) && !mastered.has(id)).length;
      return (
        <Link key={c.code} href={`/map/${c.code.toLowerCase()}`} className="course-card">
          <span className="course-code">{c.code}</span>
          <span className="course-title">{c.title}</span>
          <span className="chev"><ChevronRight size={14} /></span>
          <span className="meter" aria-hidden="true"><span style={{ width: `${(done / ids.length) * 100}%` }} /></span>
          <span className="course-stat">
            <span>{done} of {ids.length} mastered</span>
            {ready > 0 && <span className="ready">{ready} ready</span>}
          </span>
        </Link>
      );
    });

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page page-wide">
        <header className="page-head">
          <p className="eyebrow">The curriculum</p>
          <h1>Map</h1>
          <p className="lede">Three tracks that grow side by side, from school mathematics and a first program to the frontier of research.</p>
        </header>
        <div className="map-summary">
          <div><p className="eyebrow">Courses</p><p>{COURSES.length}</p></div>
          <div><p className="eyebrow">Lessons</p><p>{total.toLocaleString("en-IN")}</p></div>
          <div><p className="eyebrow">Mastered</p><p>{mastered.size.toLocaleString("en-IN")}</p></div>
        </div>
        <div className="map-head"><span>Tier</span>{TRACKS.map((t) => <span key={t}>{TRACK_NAMES[t]}</span>)}</div>
        {TIERS.map((name, tier) => (
          <section key={name} className="tier">
            <h2 className="tier-name"><span className="mono-tag">Tier {tier}</span>{name}</h2>
            <div className="tier-grid">
              {TRACKS.map((t) => (
                <div key={t} className="track"><p className="eyebrow track-label">{TRACK_NAMES[t]}</p><div className="course-col">{column(t, tier)}</div></div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
