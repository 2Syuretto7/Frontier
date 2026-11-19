import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { GRAPH } from "@/lib/curriculum";
import { partonConnected } from "@/lib/parton/claude";
import { MODES, MODE_ORDER, isMode, type QuestionState } from "@/lib/interview/core";
import { interviewState, sessionScores } from "@/lib/interview/store";
import { startInterviewAction } from "./actions";
import { TopBar } from "@/components/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ChevronRight } from "@/components/ui/Icons";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";
// Starting a session can ask Parton to write a fresh question.
export const maxDuration = 300;
export const metadata = { title: "Mock interviews" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const pct = (x: number) => `${Math.round(x * 100)}%`;

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string }> }) {
  await requireOwner();
  const params = await searchParams;
  const [state, scores] = await Promise.all([interviewState(), sessionScores()]);
  const focus = isMode(params.mode) ? params.mode : state.next?.mode ?? null;
  const prompts = new Map(state.questions.map((q) => [q.id, q]));
  const connected = partonConnected();
  const reread = state.remedies.filter((r, i, all) => all.findIndex((x) => x.lessonId === r.lessonId) === i);
  const past = state.sessions.filter((s) => s.status !== "open");

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page page-wide">
        <header className="page-head">
          <p className="eyebrow">Interview practice</p>
          <h1>Mock interviews</h1>
          <p className="lede">
            Parton plays the interviewer in five modes, follows up where your answer is thin, and scores you against a
            rubric. Every answer is kept so you can read it back. Each question opens only once you have mastered the
            lessons it rests on, and a weak score sends you back to the lessons behind it.
          </p>
        </header>

        {params.error && <p className="iv-error" role="alert">{params.error}</p>}
        {!connected && <p className="iv-error" role="status">Mock interviews need Parton, which is not connected yet (ANTHROPIC_API_KEY).</p>}

        {state.open && (
          <Link href={`/interview/${state.open.id}`} className="iv-resume">
            <Pill tone="accent" icon="clock">Under way</Pill>
            <span>Your {MODES[state.open.mode].title.toLowerCase()} interview, started {when(state.open.startedAt)}. Continue it</span>
            <span className="chev"><ChevronRight size={14} /></span>
          </Link>
        )}

        <div className="iv-modes">
          {MODE_ORDER.map((mode) => {
            const m = state.summaries.find((s) => s.mode === mode)!;
            const states = state.states.filter((s) => s.mode === mode);
            // The locked question nearest to opening says what the mode is waiting for.
            const firstLock = states.filter((s) => s.kind === "locked").sort((a, b) => a.missing - b.missing)[0];
            const isNext = state.next?.mode === mode;
            return (
              <section key={mode} className={`iv-mode${focus === mode ? " is-focus" : ""}`} aria-labelledby={`mode-${mode}`}>
                <div className="iv-mode-head">
                  <h2 id={`mode-${mode}`}>{MODES[mode].title}</h2>
                  {m.open === 0 ? <Pill tone="muted" icon="lock">Locked</Pill> : isNext ? <Pill tone="accent" icon="dot">Up next</Pill> : m.ready ? <Pill tone="neutral">{m.ready} ready</Pill> : <Pill tone="muted">Nothing due</Pill>}
                </div>
                <p className="iv-mode-about">{MODES[mode].about}</p>
                <p className="iv-mode-stats">
                  <span><span className="muted">Open</span> {m.open} of {m.total}</span>
                  <span><span className="muted">Average</span> {m.mean === null ? "None yet" : pct(m.mean)}</span>
                  <span><span className="muted">Last</span> {m.lastAt ? when(m.lastAt) : "Never"}</span>
                </p>
                {isNext && state.next && <p className="iv-why">{state.next.why}</p>}
                {m.open === 0 && firstLock && <p className="iv-why">{firstLock.reason}</p>}
                {m.open > 0 && !state.open && (
                  <form action={startInterviewAction}>
                    <input type="hidden" name="mode" value={mode} />
                    <SubmitButton className={isNext ? "btn btn-primary" : "btn"} pendingText="Preparing questions…" disabled={!connected || m.ready === 0}>
                      Start a {MODES[mode].short.toLowerCase()} interview
                    </SubmitButton>
                  </form>
                )}
              </section>
            );
          })}
        </div>

        {reread.length > 0 && (
          <section className="iv-section" aria-labelledby="go-back">
            <h2 id="go-back">Lessons to go back to</h2>
            <p className="muted">Weak answers point here. The questions they came from wait until you have done this.</p>
            <ul className="iv-list">
              {reread.map((r) => (
                <li key={r.lessonId}>
                  <Link href={`/learn/${r.lessonId}`}>{GRAPH.nodes.get(r.lessonId)?.title ?? r.lessonId}</Link>
                  <span className="muted"> {r.mode === "learn" ? "Master it in Learn" : "Reread it"}, for: {prompts.get(r.questionId)?.prompt.slice(0, 90)}…</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="iv-section" aria-labelledby="bank">
          <h2 id="bank">Questions</h2>
          {MODE_ORDER.map((mode) => (
            <details key={mode} className="iv-bank" open={focus === mode}>
              <summary>{MODES[mode].title} <span className="muted">· {state.states.filter((s) => s.mode === mode).length}</span></summary>
              <ul className="iv-list">
                {state.states.filter((s) => s.mode === mode).map((s) => <QuestionRow key={s.id} s={s} prompt={prompts.get(s.id)?.prompt ?? s.id} />)}
              </ul>
            </details>
          ))}
        </section>

        {past.length > 0 && (
          <section className="iv-section" aria-labelledby="history">
            <h2 id="history">Your interviews</h2>
            <div className="drill-table-wrap">
              <table className="drill-table">
                <thead><tr><th>When</th><th>Mode</th><th>Questions</th><th>Score</th><th>Status</th></tr></thead>
                <tbody>
                  {past.slice(0, 50).map((s) => (
                    <tr key={s.id}>
                      <td><Link href={`/interview/${s.id}`}>{when(s.startedAt)}</Link></td>
                      <td>{MODES[s.mode].short}</td>
                      <td className="num">{s.questions.length}</td>
                      <td className="num">{scores.has(s.id) ? pct(scores.get(s.id)!) : ""}</td>
                      <td>{s.status === "done" ? "Scored" : s.status === "scoring" ? "Waiting for scores" : "Dropped"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function QuestionRow({ s, prompt }: { s: QuestionState; prompt: string }) {
  const pill =
    s.kind === "locked" ? <Pill tone="muted" icon="lock">Locked</Pill> :
    s.kind === "blocked" ? <Pill tone="muted">Waiting</Pill> :
    s.kind === "due" ? <Pill tone="accent" icon="dot">Due</Pill> :
    s.kind === "new" ? <Pill tone="neutral">New</Pill> :
    <Pill tone="success" icon="check">Held</Pill>;
  return (
    <li className="iv-q">
      <span className="iv-q-head">{pill}{s.score !== null && <span className="muted"> Last {pct(s.score)} · {s.answers} {s.answers === 1 ? "answer" : "answers"}</span>}</span>
      <span>{prompt}</span>
      <span className="muted iv-q-why">{s.reason}</span>
    </li>
  );
}
