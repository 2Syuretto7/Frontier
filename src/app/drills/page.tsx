import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { DRILLS, DRILL_BY_ID } from "@/content/drills";
import { allStats, inTime, type Attempt, type DrillStats } from "@/lib/drills";
import { TopBar } from "@/components/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ChevronRight } from "@/components/ui/Icons";
import { clock, percent } from "@/components/drills/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Drills" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function DrillsPage() {
  await requireOwner();
  const { drills, attempts } = await allStats();
  const finished = attempts.filter((a) => a.finishedAt);
  const passes = finished.filter((a) => a.outcome === "passed");
  const passedDrills = drills.filter((s) => s.passes > 0).length;
  const inTimeDrills = drills.filter((s) => s.passesInTime > 0).length;

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page page-wide">
        <header className="page-head">
          <p className="eyebrow">Implementation practice</p>
          <h1>Drills</h1>
          <p className="lede">
            Short, timed exercises that rebuild the core pieces of modern ML from scratch in NumPy, each checked by
            hidden tests for correctness and shapes. The closest thing here to a lab coding interview or take-home.
          </p>
        </header>

        <div className="map-summary drill-summary">
          <div><p className="eyebrow">Passed in time</p><p>{inTimeDrills} of {DRILLS.length}</p></div>
          <div><p className="eyebrow">Passed at all</p><p>{passedDrills} of {DRILLS.length}</p></div>
          <div><p className="eyebrow">Pass rate</p><p>{finished.length ? percent(passes.length / finished.length) : "None yet"}</p></div>
          <div><p className="eyebrow">Attempts</p><p>{finished.length}</p></div>
        </div>

        <div className="drill-list">
          {DRILLS.map((d) => <DrillCard key={d.id} stats={drills.find((s) => s.drillId === d.id)!} />)}
        </div>

        {finished.length > 0 && (
          <section className="drill-history" aria-labelledby="history">
            <h2 id="history">Recent attempts</h2>
            <div className="drill-table-wrap">
              <table className="drill-table">
                <thead><tr><th>Drill</th><th>When</th><th>Result</th><th>Time</th><th>Tests</th><th>Submits</th></tr></thead>
                <tbody>
                  {finished.slice(0, 25).map((a) => <HistoryRow key={a.id} a={a} />)}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function DrillCard({ stats }: { stats: DrillStats }) {
  const d = DRILL_BY_ID.get(stats.drillId)!;
  const state =
    stats.open ? <Pill tone="accent" icon="clock">In progress</Pill> :
    stats.passesInTime > 0 ? <Pill tone="success" icon="check">Passed in time</Pill> :
    stats.passes > 0 ? <Pill tone="neutral">Passed over time</Pill> :
    stats.finished > 0 ? <Pill tone="muted">Not passed yet</Pill> :
    <Pill tone="muted">New</Pill>;
  return (
    <Link href={`/drills/${d.id}`} className="drill-card">
      <span className="drill-card-head">
        <span className="mono-tag">{d.minutes} min</span>
        {state}
      </span>
      <span className="drill-card-title">{d.title}<span className="chev"><ChevronRight size={14} /></span></span>
      <span className="drill-card-summary">{d.summary}</span>
      <span className="drill-card-skills">{d.skills.join(" · ")}</span>
      <span className="drill-card-stats">
        <span><span className="muted">Best</span> {stats.bestSeconds !== null ? clock(stats.bestSeconds) : "None"}</span>
        <span><span className="muted">Pass rate</span> {stats.finished ? `${percent(stats.passRate)} of ${stats.finished}` : "None yet"}</span>
      </span>
    </Link>
  );
}

function HistoryRow({ a }: { a: Attempt }) {
  const d = DRILL_BY_ID.get(a.drillId);
  const result = a.outcome === "passed" ? (inTime(a) ? "Passed in time" : "Passed over time") : a.outcome === "gave_up" ? "Gave up" : "Abandoned";
  return (
    <tr>
      <td><Link href={`/drills/${a.drillId}`}>{d?.title ?? a.drillId}</Link></td>
      <td>{when(a.startedAt)}</td>
      <td className={a.outcome === "passed" ? "is-pass" : "is-miss"}>{result}</td>
      <td className="num">{a.seconds !== null ? clock(a.seconds) : ""}<span className="muted"> / {a.limitMinutes}:00</span></td>
      <td className="num">{a.bestPassed} of {a.totalTests}</td>
      <td className="num">{a.submissions}</td>
    </tr>
  );
}
