import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { CASES, CASE_BY_ID } from "@/content/gym";
import { KIND_BY_ID } from "@/content/gym/types";
import { gymPlan, kindName, summarise, type CaseStats, type GymAttempt } from "@/lib/gym";
import { gymLevel, type GymPick, type KindRow } from "@/lib/gym-plan";
import { TopBar } from "@/components/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ChevronRight } from "@/components/ui/Icons";
import { clock, percent } from "@/components/drills/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Debugging gym" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function GymPage() {
  await requireOwner();
  const plan = await gymPlan();
  const picks = new Map(plan.queue.map((p) => [p.caseId, p]));
  const stats = CASES.map((c) => summarise(c.id, plan.attempts));
  const finished = plan.attempts.filter((a) => a.finishedAt);
  const solved = finished.filter((a) => a.outcome === "solved");
  const firstGuess = solved.filter((a) => a.wrongGuesses === 0);
  const openCases = plan.queue.filter((p) => p.kind !== "locked").length;
  const upNext = plan.queue.filter((p) => p.kind !== "later" && p.kind !== "locked").slice(0, 4);

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page page-wide">
        <header className="page-head">
          <p className="eyebrow">Debugging practice</p>
          <h1>Debugging gym</h1>
          <p className="lede">
            Training scripts with a bug planted in each: leaky splits, broken schedules, wrong masks, silent dtype problems,
            gradient accumulation gone wrong. The script runs; the loss curve just looks wrong. Find out why, name the cause,
            then fix it against hidden tests. Each case opens once Learn has taught what it relies on.
          </p>
        </header>

        <div className="map-summary drill-summary">
          <div><p className="eyebrow">Open</p><p>{openCases} of {CASES.length}</p></div>
          <div><p className="eyebrow">Solved</p><p>{stats.filter((s) => s.solves > 0).length} of {CASES.length}</p></div>
          <div><p className="eyebrow">Cause named first time</p><p>{solved.length ? percent(firstGuess.length / solved.length) : "None yet"}</p></div>
          <div><p className="eyebrow">Attempts</p><p>{finished.length}</p></div>
        </div>

        <section className="drill-plan" aria-labelledby="up-next">
          <div className="drill-next">
            <p className="eyebrow" id="up-next">Up next</p>
            {plan.next ? <NextCase pick={plan.next} /> : openCases === 0 ? (
              <p className="muted">Every case opens once you have mastered the lessons it relies on. Each card says which. Keep going in Learn; the first cases open early in Introduction to Machine Learning.</p>
            ) : (
              <p className="muted">Nothing is due. The next case comes back on {
                plan.queue.find((p) => p.kind === "later")?.due ? when(plan.queue.find((p) => p.kind === "later")!.due!) : "its review date"}.</p>
            )}
            {upNext.length > 1 && (
              <ol className="drill-queue">
                {upNext.slice(1).map((p) => (
                  <li key={p.caseId}>
                    <Link href={`/gym/${p.caseId}`}>{CASE_BY_ID.get(p.caseId)!.title}</Link>
                    <span className="muted"> {p.reason}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <KindPanel kinds={plan.kinds} />
        </section>

        <div className="drill-list">
          {CASES.map((c, i) => <CaseCard key={c.id} stats={stats[i]} pick={picks.get(c.id)!} />)}
        </div>

        {finished.length > 0 && (
          <section className="drill-history" aria-labelledby="history">
            <h2 id="history">Recent attempts</h2>
            <div className="drill-table-wrap">
              <table className="drill-table">
                <thead><tr><th>Case</th><th>When</th><th>Result</th><th>Cause</th><th>Time</th><th>Level</th></tr></thead>
                <tbody>{finished.slice(0, 25).map((a) => <HistoryRow key={a.id} a={a} />)}</tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function NextCase({ pick }: { pick: GymPick }) {
  const c = CASE_BY_ID.get(pick.caseId)!;
  const info = gymLevel(pick.level);
  return (
    <Link href={`/gym/${c.id}`} className="drill-next-card">
      <span className="drill-card-title">{c.title}<span className="chev"><ChevronRight size={14} /></span></span>
      <span className="drill-reason">{pick.reason}</span>
      <span className="drill-card-skills">Level {pick.level} of 3, {info.name} · {pick.limitMinutes} minutes · {kindName(c.kind)}</span>
    </Link>
  );
}

function KindPanel({ kinds }: { kinds: KindRow[] }) {
  return (
    <div className="drill-skills">
      <p className="eyebrow">Kinds of bug, weakest first</p>
      <ul>
        {kinds.map((k) => (
          <li key={k.kind}>
            <span className="drill-skill-name">{kindName(k.kind)}</span>
            <span className="drill-skill-bar" aria-hidden="true"><span style={{ width: `${Math.round(k.mastery * 100)}%` }} /></span>
            <span className="muted drill-skill-num">{k.tried ? percent(k.mastery) : "Untried"}</span>
          </li>
        ))}
      </ul>
      <p className="hint">From your recent attempts on the cases you can open. A clean solve names the cause first time, inside the time. The plan picks the case that is due and plants your weakest kind.</p>
    </div>
  );
}

function CaseCard({ stats, pick }: { stats: CaseStats; pick: GymPick }) {
  const c = CASE_BY_ID.get(stats.caseId)!;
  const state =
    stats.open ? <Pill tone="accent" icon="clock">In progress</Pill> :
    stats.firstGuess > 0 ? <Pill tone="success" icon="check">Solved cleanly</Pill> :
    stats.solves > 0 ? <Pill tone="neutral">Solved</Pill> :
    stats.finished > 0 ? <Pill tone="muted">Not solved yet</Pill> :
    <Pill tone="muted">New</Pill>;
  return (
    <Link href={`/gym/${c.id}`} className="drill-card">
      <span className="drill-card-head">
        <span className="mono-tag">{KIND_BY_ID.get(c.kind)?.name} · Level {pick.level}</span>
        {pick.kind === "locked" ? <Pill tone="muted" icon="lock">Locked</Pill> : pick.kind === "retry" || pick.kind === "due" ? <Pill tone="accent" icon="dot">Due</Pill> : state}
      </span>
      <span className="drill-card-title">{c.title}<span className="chev"><ChevronRight size={14} /></span></span>
      <span className="drill-card-summary">{c.summary}</span>
      {pick.kind === "locked" && <span className="drill-reason">{pick.reason}</span>}
      <span className="drill-card-stats">
        <span><span className="muted">Best</span> {stats.bestSeconds !== null ? clock(stats.bestSeconds) : "None"}</span>
        <span><span className="muted">Solved</span> {stats.finished ? `${stats.solves} of ${stats.finished}` : "None yet"}</span>
      </span>
    </Link>
  );
}

function HistoryRow({ a }: { a: GymAttempt }) {
  const c = CASE_BY_ID.get(a.caseId);
  return (
    <tr>
      <td><Link href={`/gym/${a.caseId}`}>{c?.title ?? a.caseId}</Link></td>
      <td>{when(a.startedAt)}</td>
      <td className={a.outcome === "solved" ? "is-pass" : "is-miss"}>{a.outcome === "solved" ? "Solved" : a.outcome === "gave_up" ? "Gave up" : "Abandoned"}</td>
      <td>{a.diagnosed ? (a.wrongGuesses ? `${a.wrongGuesses} wrong first` : "First time") : "Not named"}</td>
      <td className="num">{a.seconds !== null ? clock(a.seconds) : ""}<span className="muted"> / {a.limitMinutes}:00</span></td>
      <td className="num">{a.level}{a.variantId ? " (fresh)" : ""}</td>
    </tr>
  );
}
