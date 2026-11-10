import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { COURSE_BY_CODE, isUnlocked } from "@/lib/graph";
import { GRAPH, LESSON_BY_ID } from "@/lib/curriculum";
import { loadProgress } from "@/lib/learning";
import { TopBar } from "@/components/TopBar";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ArrowLeft } from "@/components/ui/Icons";
import { TRACK_NAMES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  return { title: COURSE_BY_CODE.get(course.toUpperCase())?.title ?? "Course" };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  await requireOwner();
  const { course: code } = await params;
  const course = COURSE_BY_CODE.get(code.toUpperCase());
  if (!course) notFound();
  const progress = await loadProgress();
  const status = new Map(progress.map((p) => [p.lesson_id, p.status]));
  const mastered = new Set(progress.filter((p) => p.status === "mastered").map((p) => p.lesson_id));
  const ids = course.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
  const lessonCount = ids.length;
  const masteredHere = ids.filter((id) => mastered.has(id)).length;
  const writtenHere = ids.filter((id) => LESSON_BY_ID.has(id)).length;
  const courseLink = (c: string) => {
    const other = COURSE_BY_CODE.get(c)!;
    return <Link key={c} href={`/map/${c.toLowerCase()}`} className="chip"><span className="mono-meta">{c}</span>{other.title}</Link>;
  };

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page">
        <Link href="/map" className="back"><ArrowLeft size={14} /> Map</Link>
        <p className="eyebrow">{course.code} · Tier {course.tier} · {TRACK_NAMES[course.track]}</p>
        <h1>{course.title}</h1>
        <p className="lede">{course.source}</p>
        <div className="map-summary">
          <div><p className="eyebrow">Lessons</p><p>{lessonCount}</p></div>
          <div><p className="eyebrow">Mastered</p><p>{masteredHere}</p></div>
          <div><p className="eyebrow">Written so far</p><p>{writtenHere}</p></div>
        </div>
        {(course.requires.length > 0 || course.parallels.length > 0) && (
          <div className="course-links">
            {course.requires.length > 0 && <div><span className="muted">Requires</span> {course.requires.map(courseLink)}</div>}
            {course.parallels.length > 0 && <div><span className="muted">Runs parallel to</span> {course.parallels.map(courseLink)}</div>}
          </div>
        )}
        {course.chapters.map((ch) => (
          <section key={ch.n} className="chapter">
            <h2><span className="mono-meta">Chapter {ch.n}</span>{ch.title}</h2>
            <ol className="lesson-list">
              {ch.lessons.map((l) => {
                const s = status.get(l.id);
                const authored = LESSON_BY_ID.has(l.id);
                const open = authored && (s !== undefined || isUnlocked(GRAPH, l.id, mastered));
                const state = s === "mastered" ? "mastered" : s === "in_progress" ? "started" : !authored ? "unwritten" : open ? "open" : "locked";
                const [label, tone, icon] = STATE[state];
                return (
                  <li key={l.id} className={`lesson-row is-${state}`}>
                    <span className="mono-meta">{l.id}</span>
                    {open ? <Link href={`/learn/${l.id}`}>{l.title}</Link> : <span>{l.title}</span>}
                    <Pill tone={tone} icon={icon}>{label}</Pill>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </main>
    </div>
  );
}

const STATE: Record<string, [string, PillTone, "check" | "dot" | "lock" | "pen" | undefined]> = {
  mastered: ["Mastered", "success", "check"],
  started: ["In progress", "accent", "dot"],
  open: ["Ready", "neutral", undefined],
  locked: ["Locked", "muted", "lock"],
  unwritten: ["Being written", "muted", "pen"],
};
