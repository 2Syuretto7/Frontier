import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { GRAPH } from "@/lib/curriculum";
import { COURSES } from "@/lib/graph";
import { nextStep, overallStats } from "@/lib/learning";
import { reviewCount } from "@/lib/parton/recall";
import type { TodayItem } from "@/lib/guide/core";
import { learnAction } from "./actions";
import { TopBar } from "@/components/TopBar";
import { RevealText } from "@/components/ui/RevealText";
import { Pill } from "@/components/ui/Pill";
import { ArrowRight, ChevronRight } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-IN");

export default async function Home() {
  await requireOwner();
  const [queue, stats] = await Promise.all([todayQueue(), overallStats()]);
  const total = GRAPH.order.length;
  const lede =
    stats.mastered === 0
      ? `One button, a map of ${fmt(total)} lessons from school arithmetic to frontier research, and a tutor who gives more hints and fewer solutions.`
      : `${fmt(stats.mastered)} of ${fmt(total)} lessons mastered. Press Learn and Frontier picks the single best next step.`;

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-wash" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow fade-up">A personal university · Mathematics, machine learning and ML engineering</p>
            <h1 id="hero-title" className="display"><RevealText text="Frontier" delay={120} /></h1>
            <p className="hero-lede fade-up" style={{ animationDelay: "260ms" }}>{lede}</p>
            <div className="hero-actions fade-up" style={{ animationDelay: "340ms" }}>
              <form action={learnAction}>
                <button type="submit" className="btn btn-primary btn-lg learn">
                  Learn <span className="chev"><ChevronRight /></span>
                </button>
              </form>
              <Link href="/map" className="text-link">Browse the map <ArrowRight size={14} /></Link>
            </div>
          </div>
          <NextPanel item={queue[0] ?? null} />
        </section>

        {queue.length > 1 && <TodayList queue={queue} />}

        <section className="stats" aria-label="Progress">
          <Stat label="Mastered" value={fmt(stats.mastered)} note={stats.mastered === 0 ? "The first one is the hardest" : `${((stats.mastered / total) * 100).toFixed(1)} percent of the arc`} />
          <Stat label="In progress" value={fmt(Math.max(0, stats.started - stats.mastered))} note="Started, not yet mastered" />
          <Stat label="Lessons" value={fmt(total)} note="From Tier 0 to Tier 5" />
          <Stat label="Courses" value={fmt(COURSES.length)} note="Three tracks, side by side" />
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="stat">
      <p className="eyebrow">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-note">{note}</p>
    </div>
  );
}

/** Today's queue, or, if it can't be built, the scheduler's single next step. */
async function todayQueue(): Promise<TodayItem[]> {
  try {
    const { today } = await import("@/lib/guide/store");
    return await today();
  } catch (error) {
    console.error("Today's queue unavailable:", error);
    const step = await nextStep();
    if (step.kind === "continue") return [{ kind: "continue", lessonId: step.lesson.id, title: step.lesson.title, why: null }];
    if (step.kind === "review") return [{ kind: "review", count: step.count }];
    if (step.kind === "begin") return [{ kind: "begin", lessonId: step.lesson.id, title: step.lesson.title, why: step.why ?? null, pastPace: step.pastPace }];
    return [];
  }
}

const KIND_LABEL: Record<TodayItem["kind"], string> = {
  continue: "Lesson",
  review: "Review",
  revisit: "Revisit",
  begin: "Lesson",
  drill: "Drill",
  project: "Project",
};

function describe(item: TodayItem): { title: string; meta: string; code: string; href: string } {
  switch (item.kind) {
    case "continue":
    case "begin":
    case "revisit": {
      const n = GRAPH.nodes.get(item.lessonId);
      const where = n ? `${n.courseTitle} · Chapter ${n.chapter}, ${n.chapterTitle}` : "";
      let meta = item.why ?? where;
      if (item.kind === "begin" && item.pastPace) meta += " You have reached today's suggested pace; carry on whenever you like.";
      return { title: item.title, meta, code: n ? `${n.course} / ${n.id}` : item.lessonId, href: `/learn/${item.lessonId}` };
    }
    case "review":
      // A review session is three to five new questions, however many ideas are due.
      return {
        title: `${reviewCount(item.count)} new questions to review`,
        meta: "Fresh questions on earlier ideas, just before you would forget them.",
        code: "review / spaced",
        href: "/review",
      };
    case "drill":
      return { title: `${item.title} drill`, meta: item.why, code: `drills / ${item.drillId}`, href: `/drills/${item.drillId}` };
    case "project":
      return { title: item.title, meta: item.why, code: `projects / ${item.projectId}`, href: `/projects/${item.projectId}` };
  }
}

function NextPanel({ item }: { item: TodayItem | null }) {
  const head =
    !item ? <Pill tone="muted">Resting</Pill> :
    item.kind === "begin" ? <Pill tone="accent" icon="dot">New lesson</Pill> :
    item.kind === "continue" ? <Pill tone="success" icon="dot">In progress</Pill> :
    item.kind === "review" ? <Pill tone="accent" icon="clock">Review due</Pill> :
    item.kind === "revisit" ? <Pill tone="accent" icon="dot">Revisit</Pill> :
    item.kind === "drill" ? <Pill tone="accent" icon="clock">Drill</Pill> :
    <Pill tone="accent" icon="dot">Project</Pill>;

  const shown = item
    ? describe(item)
    : {
        title: "You're ahead of the writing",
        meta: "New lessons are on their way. Until then, Learn opens the map, which shows everything that is ready.",
        code: "frontier / waiting",
      };

  return (
    <aside className="next-panel fade-up" style={{ animationDelay: "420ms" }} aria-label="Up next">
      <div className="panel-bar">
        <span className="mono-tag">Up next</span>
        {head}
      </div>
      <div className="next-body">
        <p className="next-title">{shown.title}</p>
        <p className="next-meta">{shown.meta}</p>
      </div>
      <div className="panel-foot">
        <span className="mono-meta">{shown.code}</span>
        <span className="next-progress" aria-hidden="true"><span /></span>
      </div>
    </aside>
  );
}

/** The rest of the day's queue, in the order Learn will open it. */
function TodayList({ queue }: { queue: TodayItem[] }) {
  return (
    <section className="today" aria-labelledby="today-title">
      <div className="today-head">
        <h2 id="today-title">Today</h2>
        <p className="muted">Learn opens these in order. Readiness, your project and your drills steer it, but only towards lessons whose prerequisites you have already mastered.</p>
      </div>
      <ol className="today-list">
        {queue.map((item, i) => {
          const d = describe(item);
          return (
            <li key={`${item.kind}-${i}`} className={i === 0 ? "is-next" : undefined}>
              <span className="mono-tag">{KIND_LABEL[item.kind]}</span>
              <span className="today-body">
                <Link href={d.href} className="today-title">{d.title}</Link>
                {d.meta && <span className="today-why">{d.meta}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
