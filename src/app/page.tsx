import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { GRAPH } from "@/lib/curriculum";
import { COURSES } from "@/lib/graph";
import { nextStep, overallStats } from "@/lib/learning";
import type { LearnStep } from "@/lib/scheduler";
import { learnAction } from "./actions";
import { TopBar } from "@/components/TopBar";
import { RevealText } from "@/components/ui/RevealText";
import { Pill } from "@/components/ui/Pill";
import { ArrowRight, ChevronRight } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-IN");

export default async function Home() {
  await requireOwner();
  const [step, stats] = await Promise.all([nextStep(), overallStats()]);
  const total = GRAPH.order.length;
  const lede =
    stats.mastered === 0
      ? `One button, a map of ${fmt(total)} lessons from school arithmetic to frontier research, and a tutor who gives hints, never answers.`
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
                <button type="submit" className="btn btn-primary btn-lg learn" disabled={step.kind === "rest"}>
                  Learn <span className="chev"><ChevronRight /></span>
                </button>
              </form>
              <Link href="/map" className="text-link">Browse the map <ArrowRight size={14} /></Link>
            </div>
          </div>
          <NextPanel step={step} />
        </section>

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

function NextPanel({ step }: { step: LearnStep }) {
  const head =
    step.kind === "begin" ? <Pill tone="accent" icon="dot">New lesson</Pill> :
    step.kind === "continue" ? <Pill tone="success" icon="dot">In progress</Pill> :
    step.kind === "review" ? <Pill tone="accent" icon="clock">Review due</Pill> :
    <Pill tone="muted">Resting</Pill>;

  let title: string;
  let meta: string;
  let code: string;
  if (step.kind === "begin" || step.kind === "continue") {
    title = step.lesson.title;
    meta = `${step.lesson.courseTitle} · Chapter ${step.lesson.chapter}, ${step.lesson.chapterTitle}`;
    code = `${step.lesson.course} / ${step.lesson.id}`;
  } else if (step.kind === "review") {
    const n = Math.min(step.count, 12);
    title = n === 1 ? "One question to review" : `${n} questions to review`;
    meta = "Earlier ideas, mixed together, just before you would forget them.";
    code = "review / spaced";
  } else if (step.reason === "pace") {
    title = "That's today's new learning done";
    meta = "Come back tomorrow. Reviews are never limited, and the map is always open.";
    code = "pace / reached";
  } else {
    title = "You're ahead of the writing";
    meta = "New lessons are on their way. Until then, the map shows everything that is ready.";
    code = "frontier / waiting";
  }

  return (
    <aside className="next-panel fade-up" style={{ animationDelay: "420ms" }} aria-label="Up next">
      <div className="panel-bar">
        <span className="mono-tag">Up next</span>
        {head}
      </div>
      <div className="next-body">
        <p className="next-title">{title}</p>
        <p className="next-meta">{meta}</p>
      </div>
      <div className="panel-foot">
        <span className="mono-meta">{code}</span>
        <span className="next-progress" aria-hidden="true"><span /></span>
      </div>
    </aside>
  );
}
