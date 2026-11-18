import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { DRILLS, DRILL_BY_ID } from "@/content/drills";
import { allStats, drillPlan, inTime, type Attempt, type DrillStats } from "@/lib/drills";
import { levelInfo, type Pick, type SkillRow } from "@/lib/drill-plan";
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
  const [{ drills, attempts }, plan] = await Promise.all([allStats(), drillPlan()]);
  const picks = new Map(plan.queue.map((p) => [p.drillId, p]));
  const upNext = plan.queue.filter((p) => p.kind !== "later").slice(0, 4);
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

        <section className="drill-plan" aria-labelledby="up-next">
          <div className="drill-next">
            <p className="eyebrow" id="up-next">Up next</p>
            {plan.next ? <NextDrill pick={plan.next} /> : (
              <p className="muted">Nothing is due. Every drill is held for now; the next one comes back on {
                plan.queue[0]?.due ? when(plan.queue[0].due) : "its review date"}.</p>
            )}
            {upNext.length > 1 && (
              <ol className="drill-queue">
                {upNext.slice(1).map((p) => (
                  <li key={p.drillId}>
                    <Link href={`/drills/${p.drillId}`}>{DRILL_BY_ID.get(p.drillId)!.title}</Link>
                    <span className="muted"> {p.reason}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <SkillPanel skills={plan.skills} usesReadiness={plan.usesReadiness} />
        </section>

        <div className="drill-list">
          {DRILLS.map((d) => <DrillCard key={d.id} stats={drills.find((s) => s.drillId === d.id)!} pick={picks.get(d.id)!} />)}
        </div>

        {finished.length > 0 && (
          <section className="drill-history" aria-labelledby="history">
            <h2 id="history">Recent attempts</h2>
            <div className="drill-table-wrap">
              <table className="drill-table">
                <thead><tr><th>Drill</th><th>When</th><th>Result</th><th>Time</th><th>Level</th><th>Tests</th><th>Submits</th></tr></thead>
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

function NextDrill({ pick }: { pick: Pick }) {
  const d = DRILL_BY_ID.get(pick.drillId)!;
  const info = levelInfo(pick.level);
  return (
    <Link href={`/drills/${d.id}`} className="drill-next-card">
      <span className="drill-card-title">{d.title}<span className="chev"><ChevronRight size={14} /></span></span>
      <span className="drill-reason">{pick.reason}</span>
      <span className="drill-card-skills">
        Level {pick.level} of 4, {info.name} · {info.editor === "variant" ? "a new variant" : `${pick.limitMinutes} minutes`} · {d.skills.join(", ")}
      </span>
      {pick.watch.length > 0 && <span className="drill-card-skills">Failed last time: {pick.watch.join("; ")}</span>}
    </Link>
  );
}

function SkillPanel({ skills, usesReadiness }: { skills: SkillRow[]; usesReadiness: boolean }) {
  return (
    <div className="drill-skills">
      <p className="eyebrow">Drill skills, weakest first</p>
      <ul>
        {skills.slice(0, 10).map((s) => (
          <li key={s.skill}>
            <span className="drill-skill-name">{s.skill}</span>
            <span className="drill-skill-bar" aria-hidden="true"><span style={{ width: `${Math.round(s.mastery * 100)}%` }} /></span>
            <span className="muted drill-skill-num">{s.tried ? percent(s.mastery) : "Untried"}</span>
          </li>
        ))}
      </ul>
      <p className="hint">
        {skills.length > 10 ? `${skills.length - 10} stronger skills are not shown. ` : ""}From your recent attempts{usesReadiness ? ", weighted by how far short of Built the matching Readiness skills are" : ""}. The plan
        picks drills that are due and cover the weakest skills.
      </p>
    </div>
  );
}

function DrillCard({ stats, pick }: { stats: DrillStats; pick: Pick }) {
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
        <span className="mono-tag">Level {pick.level} · {levelInfo(pick.level).editor === "variant" ? "variant" : `${pick.limitMinutes} min`}</span>
        {pick.kind === "retry" || pick.kind === "due" ? <Pill tone="accent" icon="dot">Due</Pill> : state}
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
      <td className="num">{a.level}</td>
      <td className="num">{a.bestPassed} of {a.totalTests}</td>
      <td className="num">{a.submissions}</td>
    </tr>
  );
}
