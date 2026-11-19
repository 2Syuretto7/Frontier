import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { renderParton } from "@/lib/parton/render";
import { MODES, SCORE_MAX } from "@/lib/interview/core";
import { getQuestion, getSession, reportsFor, turnsFor, type Report, type TurnRow } from "@/lib/interview/store";
import type { InterviewQuestion } from "@/content/interview/types";
import { abandonInterviewAction, scoreInterviewAction } from "../actions";
import { TopBar } from "@/components/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ArrowLeft } from "@/components/ui/Icons";
import { SubmitButton } from "@/components/SubmitButton";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { Code } from "@/components/lesson/Code";

export const dynamic = "force-dynamic";
// Each answer waits for the interviewer, and the last one for scoring, which can take a minute or two.
export const maxDuration = 300;
export const metadata = { title: "Mock interview" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const pct = (x: number) => `${Math.round(x * 100)}%`;
const minutes = (s: number | null) => (s === null ? "" : s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`);

export default async function InterviewSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireOwner();
  const { sessionId } = await params;
  const session = await getSession(Math.floor(Number(sessionId)));
  if (!session) notFound();
  const [turns, reports, questions] = await Promise.all([
    turnsFor(session.id),
    reportsFor(session.id),
    Promise.all(session.questions.map((id) => getQuestion(id))),
  ]);
  const asked = questions.filter((q): q is InterviewQuestion => q !== null);

  if (session.status === "open") {
    const current = asked[session.current] ?? null;
    return (
      <Shell title={`${MODES[session.mode].title} interview`} meta={`Question ${session.current + 1} of ${session.questions.length} · started ${when(session.startedAt)}`}>
        <InterviewSession
          sessionId={session.id}
          index={session.current}
          total={session.questions.length}
          minutes={current?.minutes ?? 5}
          coding={current?.starter ? { questionId: current.id, starter: current.starter, hasChecks: Boolean(current.checks?.length) } : null}
          turns={turns.map((t) => ({ id: t.id, questionId: t.questionId, role: t.role, html: t.role === "interviewer" ? renderParton(t.body) : null, body: t.body, code: t.code, at: t.at }))}
          questionIds={session.questions}
        />
        <form action={abandonInterviewAction} className="iv-abandon">
          <input type="hidden" name="session" value={session.id} />
          <SubmitButton className="btn btn-ghost" pendingText="Dropping…">Drop this interview without scoring</SubmitButton>
        </form>
      </Shell>
    );
  }

  const mean = reports.length ? reports.reduce((s, r) => s + r.score, 0) / reports.length : null;
  return (
    <Shell
      title={`${MODES[session.mode].title} interview`}
      meta={`${when(session.startedAt)}${mean !== null ? ` · ${pct(mean)} overall` : ""}`}
    >
      {session.status === "scoring" && (
        <div className="drill-locked" role="status">
          <p><Pill tone="accent" icon="spin">Waiting for scores</Pill> Parton has not finished scoring every answer.</p>
          <form action={scoreInterviewAction}>
            <input type="hidden" name="session" value={session.id} />
            <SubmitButton className="btn btn-primary" pendingText="Scoring…">Score it now</SubmitButton>
          </form>
        </div>
      )}
      {session.status === "abandoned" && <p className="muted">You dropped this interview, so it was not scored. Your answers are kept below.</p>}
      {asked.map((q, i) => (
        <QuestionBlock key={q.id} n={i + 1} q={q} turns={turns.filter((t) => t.questionId === q.id)} report={reports.find((r) => r.questionId === q.id) ?? null} />
      ))}
    </Shell>
  );
}

function Shell({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page iv-page">
        <Link href="/interview" className="back"><ArrowLeft size={14} /> Mock interviews</Link>
        <header className="page-head">
          <p className="eyebrow">Mock interview</p>
          <h1>{title}</h1>
          <p className="muted">{meta}</p>
        </header>
        {children}
      </main>
    </div>
  );
}

function QuestionBlock({ n, q, turns, report }: { n: number; q: InterviewQuestion; turns: TurnRow[]; report: Report | null }) {
  const answered = turns.some((t) => t.role === "candidate");
  return (
    <section className="iv-review" aria-labelledby={`q-${n}`}>
      <div className="iv-review-head">
        <h2 id={`q-${n}`}>Question {n}</h2>
        {report ? <Pill tone={report.score >= 0.75 ? "success" : report.score >= 0.5 ? "neutral" : "danger"}>{pct(report.score)}</Pill> : !answered ? <Pill tone="muted">Not reached</Pill> : null}
      </div>
      <ol className="iv-transcript">
        {turns.map((t) => (
          <li key={t.id} className={`iv-turn iv-${t.role}`}>
            <span className="mono-tag">{t.role === "interviewer" ? "Interviewer" : `You${t.seconds !== null ? ` · ${minutes(t.seconds)}` : ""}`}</span>
            {t.role === "interviewer"
              ? <div className="parton-prose" dangerouslySetInnerHTML={{ __html: renderParton(t.body) }} />
              : t.body && <p className="iv-said">{t.body}</p>}
            {t.code && <Code>{t.code}</Code>}
            {t.checks && t.checks.length > 0 && (
              <ul className="iv-checks">
                {t.checks.map((c) => <li key={c.name} className={c.passed ? "is-pass" : "is-miss"}>{c.passed ? "Passed" : "Failed"}: {c.name}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ol>
      {report && (
        <div className="iv-report">
          <table className="iv-rubric">
            <thead><tr><th>Criterion</th><th>Score</th><th>What Parton saw</th></tr></thead>
            <tbody>
              {report.criteria.map((c) => (
                <tr key={c.id} className={c.score <= 1 ? "is-weak" : undefined}>
                  <td>{c.text}</td>
                  <td className="num">{c.score} / {SCORE_MAX}</td>
                  <td>
                    {c.evidence && <span className="iv-evidence">{c.evidence}</span>}
                    {c.note && <span>{c.note}</span>}
                    {c.score <= 1 && c.lessons.length > 0 && (
                      <span className="iv-lessons">Go back to {c.lessons.map((l, i) => <span key={l.id}>{i ? ", " : ""}<Link href={`/learn/${l.id}`}>{l.title}</Link></span>)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.feedback && <div className="parton-prose iv-feedback" dangerouslySetInnerHTML={{ __html: renderParton(report.feedback) }} />}
          {report.outline && (
            <details className="iv-outline">
              <summary>A strong answer, in outline</summary>
              <div className="parton-prose" dangerouslySetInnerHTML={{ __html: renderParton(report.outline) }} />
            </details>
          )}
          {q.solution && (
            <details className="iv-outline">
              <summary>A reference solution</summary>
              <Code>{q.solution}</Code>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
