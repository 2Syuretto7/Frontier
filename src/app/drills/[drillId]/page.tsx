import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { DRILL_BY_ID } from "@/content/drills";
import { attemptsFor, canSeeSolution, inTime, openAttempt, summarise } from "@/lib/drills";
import { TopBar } from "@/components/TopBar";
import { DrillSession } from "@/components/drills/DrillSession";
import { ArrowLeft } from "@/components/ui/Icons";
import { clock, percent } from "@/components/drills/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ drillId: string }> }) {
  const { drillId } = await params;
  return { title: DRILL_BY_ID.get(drillId)?.title ?? "Drill" };
}

export default async function DrillPage({ params }: { params: Promise<{ drillId: string }> }) {
  await requireOwner();
  const { drillId } = await params;
  const drill = DRILL_BY_ID.get(drillId);
  if (!drill) notFound();
  const [open, attempts, solution] = await Promise.all([openAttempt(drill.id), attemptsFor(drill.id), canSeeSolution(drill.id)]);
  const stats = summarise(drill.id, attempts);

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page drill-page">
        <Link href="/drills" className="back"><ArrowLeft size={14} /> Drills</Link>
        <header className="page-head">
          <p className="eyebrow">Drill · {drill.minutes} minutes · {drill.skills.join(", ")}</p>
          <h1>{drill.title}</h1>
          <p className="drill-meta-line">
            <span><span className="muted">Best</span> {stats.bestSeconds !== null ? clock(stats.bestSeconds) : "None yet"}</span>
            <span><span className="muted">Pass rate</span> {stats.finished ? `${percent(stats.passRate)} of ${stats.finished}` : "None yet"}</span>
            <span><span className="muted">In time</span> {stats.passesInTime}</span>
          </p>
        </header>

        <DrillSession
          drill={{ id: drill.id, title: drill.title, summary: drill.summary, minutes: drill.minutes, starter: drill.starter, setup: drill.setup, testCount: drill.tests.length }}
          initial={open}
          serverNow={Date.now()}
          solutionAvailable={solution}
        >
          {drill.brief}
        </DrillSession>

        {attempts.some((a) => a.finishedAt) && (
          <section className="drill-history" aria-labelledby="history">
            <h2 id="history">Your attempts</h2>
            <ul className="drill-attempts">
              {attempts.filter((a) => a.finishedAt).slice(0, 12).map((a) => (
                <li key={a.id}>
                  <span className={a.outcome === "passed" ? "is-pass" : "is-miss"}>
                    {a.outcome === "passed" ? (inTime(a) ? "Passed in time" : "Passed over time") : a.outcome === "gave_up" ? "Gave up" : "Abandoned"}
                  </span>
                  <span className="num">{clock(a.seconds ?? 0)}</span>
                  <span className="muted">{a.bestPassed} of {a.totalTests} tests, {a.submissions} {a.submissions === 1 ? "submit" : "submits"}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
