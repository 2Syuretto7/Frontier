import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { CASE_BY_ID } from "@/content/gym";
import { CURVES } from "@/content/gym/curves";
import { BUG_KINDS, KIND_BY_ID, fixedProgram } from "@/content/gym/types";
import { canSeeAnswer, getVariant, gymPlan, openAttempt, sessionFor, summarise } from "@/lib/gym";
import { gymLevel } from "@/lib/gym-plan";
import { hintsFor } from "@/lib/parton/gym";
import { partonConnected } from "@/lib/parton/claude";
import { renderBrief } from "@/lib/parton/render";
import { GRAPH } from "@/lib/curriculum";
import { TopBar } from "@/components/TopBar";
import { GymSession } from "@/components/gym/GymSession";
import { LossChart } from "@/components/gym/LossChart";
import { Code } from "@/components/lesson/Code";
import { ArrowLeft } from "@/components/ui/Icons";
import { Pill } from "@/components/ui/Pill";
import { clock } from "@/components/drills/format";

export const dynamic = "force-dynamic";
// Parton writes fresh cases and hints from this page's server actions, which can take a minute or two.
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return { title: CASE_BY_ID.get(caseId)?.title ?? "Debugging gym" };
}

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  await requireOwner();
  const { caseId } = await params;
  const c = CASE_BY_ID.get(caseId);
  if (!c) notFound();
  const [open, plan] = await Promise.all([openAttempt(c.id), gymPlan()]);
  const attempts = plan.attempts.filter((a) => a.caseId === c.id);
  const stats = summarise(c.id, attempts);
  const [session, hints] = open ? await Promise.all([sessionFor(open), hintsFor(open.id)]) : [null, []];
  const pick = plan.queue.find((p) => p.caseId === c.id)!;
  const info = gymLevel(pick.level);
  const kind = KIND_BY_ID.get(c.kind)!;

  // The debrief: the last finished attempt's case, once no attempt is under way.
  const last = attempts.find((a) => a.finishedAt);
  const lastVariant = !open && last?.variantId ? await getVariant(last.variantId) : null;
  const debrief = !open && last ? await canSeeAnswer(c.id, last.variantId) : false;
  const curves = CURVES[c.id];

  const symptom = (
    <>
      <div className="prose">{c.symptom}</div>
      {curves && <LossChart title={c.chart.title} curves={curves} log={c.chart.log} />}
    </>
  );

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page drill-page">
        <Link href="/gym" className="back"><ArrowLeft size={14} /> Debugging gym</Link>
        <header className="page-head">
          <p className="eyebrow">Debugging gym · {kind.name} · {c.minutes} minutes</p>
          <h1>{c.title}</h1>
          <p className="drill-meta-line">
            <span><span className="muted">Solved</span> {stats.solves ? `${stats.solves} of ${stats.finished}` : "Not yet"}</span>
            <span><span className="muted">Cause named first time</span> {stats.firstGuess}</span>
            <span><span className="muted">Best</span> {stats.bestSeconds !== null ? clock(stats.bestSeconds) : "None yet"}</span>
            <span><span className="muted">Next level</span> {pick.level} of 3, {info.name}</span>
          </p>
        </header>

        {!open && pick.kind === "locked" ? (
          <div className="drill-locked" role="status">
            <p className="drill-start-summary">{c.summary}</p>
            <p><Pill tone="muted" icon="lock">Locked</Pill> {pick.reason}</p>
            <p className="muted">
              A case opens once you have mastered, through Learn, the lessons that teach what it relies on:{" "}
              {c.lessons.map((id) => GRAPH.nodes.get(id)?.title ?? id).join(", ")}.
            </p>
          </div>
        ) : (
          <GymSession
            gymCase={{ id: c.id, title: c.title, summary: c.summary }}
            upcoming={{
              level: pick.level, levelName: info.name, about: info.about, limitMinutes: pick.limitMinutes, testCount: c.tests.length,
              fresh: pick.level >= 3, reason: pick.kind === "open" ? null : pick.reason, solvedBefore: stats.solves > 0,
            }}
            kinds={BUG_KINDS.map((k) => ({ id: k.id, name: k.name, about: k.about }))}
            initial={open}
            initialSession={session}
            initialHints={hints}
            serverNow={Date.now()}
            parton={partonConnected()}
          >
            {symptom}
          </GymSession>
        )}

        {debrief && last && (
          <section className="gym-debrief" aria-labelledby="debrief">
            <h2 id="debrief">Debrief{lastVariant ? `: ${lastVariant.title}` : ""}</h2>
            {lastVariant ? (
              <>
                <p><span className="muted">The bug:</span> a {kind.name.toLowerCase()} bug in <code>{lastVariant.suspect}</code>.</p>
                <div className="prose" dangerouslySetInnerHTML={{ __html: renderBrief(lastVariant.explanation) }} />
                <p className="eyebrow">The fixed script</p>
                <Code>{lastVariant.fixed}</Code>
              </>
            ) : (
              <>
                <p><span className="muted">The cause:</span> {c.causes.find((x) => x.right)?.text}</p>
                <div className="prose">{c.explanation}</div>
                <p className="eyebrow">The fix, in <code>{c.suspect}</code></p>
                {c.fix.map(([from, to], i) => (
                  <div key={i} className="gym-fix">
                    <Code>{from.split("\n").map((l) => `- ${l}`).join("\n")}</Code>
                    <Code>{to.split("\n").map((l) => `+ ${l}`).join("\n")}</Code>
                  </div>
                ))}
                <details>
                  <summary>The whole fixed script</summary>
                  <Code>{fixedProgram(c)}</Code>
                </details>
              </>
            )}
          </section>
        )}

        {attempts.some((a) => a.finishedAt) && (
          <section className="drill-history" aria-labelledby="history">
            <h2 id="history">Your attempts</h2>
            <ul className="drill-attempts">
              {attempts.filter((a) => a.finishedAt).slice(0, 12).map((a) => (
                <li key={a.id}>
                  <span className={a.outcome === "solved" ? "is-pass" : "is-miss"}>
                    {a.outcome === "solved" ? "Solved" : a.outcome === "gave_up" ? "Gave up" : "Abandoned"}
                  </span>
                  <span className="num">{clock(a.seconds ?? 0)}<span className="muted"> / {a.limitMinutes}:00</span></span>
                  <span className="mono-tag">Level {a.level}{a.variantId ? " · fresh case" : ""}</span>
                  <span className="muted">{a.diagnosed ? (a.wrongGuesses ? `cause named after ${a.wrongGuesses} wrong ${a.wrongGuesses === 1 ? "guess" : "guesses"}` : "cause named first time") : "cause not named"}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
