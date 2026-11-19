"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CodeRunner, type RunnerApi } from "@/components/code/CodeRunner";
import { runtime, workspaces, type RunResult, type TestSpec } from "@/components/code/runtime";
import { Pill } from "@/components/ui/Pill";
import { Check, Clock, Close, Play, Spark } from "@/components/ui/Icons";
import {
  caseTestsAction, diagnoseAction, freshCaseAction, giveUpCaseAction, gymHintAction, settleFreshCaseAction, startCaseAction, submitFixAction,
} from "@/app/gym/actions";
import type { GymAttempt, GymSessionMeta } from "@/lib/gym";
import type { CaseCheck, GymHint } from "@/lib/parton/gym";
import type { CaseReport } from "@/lib/parton/gym-prompts";
import { clock } from "@/components/drills/format";

type Status = { tone: "right" | "wrong" | "info"; text: string } | null;

export type Upcoming = {
  level: number;
  levelName: string;
  about: string;
  limitMinutes: number;
  testCount: number;
  /** Level 3: Parton writes a fresh case first. */
  fresh: boolean;
  reason: string | null;
  /** Whether the learner has solved this case before, so a fresh case can be offered at any level. */
  solvedBefore: boolean;
};

const forgetDraft = (id: number) => { try { window.localStorage.removeItem(`frontier:gym:${id}`); } catch { /* storage is optional */ } };

function useElapsed(attempt: GymAttempt | null, skew: number) {
  const [now, setNow] = useState(() => Date.now());
  const running = attempt !== null && attempt.finishedAt === null;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  if (!attempt) return 0;
  if (attempt.seconds !== null) return attempt.seconds;
  return Math.max(0, (now + skew - Date.parse(attempt.startedAt)) / 1000);
}

async function quietRun(code: string, tests: TestSpec[]): Promise<RunResult> {
  return runtime().run({ code, tests }, {}).done;
}

/** Checks a fresh case before its clock starts: the buggy script runs and fails a test; the fixed one passes them all. */
async function checkCase(c: CaseCheck): Promise<CaseReport> {
  const buggy = await quietRun(c.program, c.tests);
  const fixed = await quietRun(c.fixed, c.tests);
  return {
    buggyError: buggy.error,
    buggyFailed: (buggy.tests ?? []).some((t) => !t.passed),
    fixedError: fixed.error,
    fixedFailures: fixed.error ? [] : (fixed.tests ?? []).filter((t) => !t.passed).map((t) => `${t.name}${t.message ? ` (${t.message})` : ""}`),
  };
}

export function GymSession({ gymCase, upcoming, kinds, initial, initialSession, initialHints, serverNow, parton, children }: {
  gymCase: { id: string; title: string; summary: string };
  upcoming: Upcoming;
  kinds: { id: string; name: string; about: string }[];
  initial: GymAttempt | null;
  initialSession: GymSessionMeta | null;
  initialHints: GymHint[];
  serverNow: number;
  parton: boolean;
  /** The authored case's symptom and chart, shown when the attempt is not on a fresh case. */
  children: ReactNode;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<GymAttempt | null>(initial);
  const [session, setSession] = useState<GymSessionMeta | null>(initialSession);
  const [skew] = useState(() => serverNow - Date.now());
  const elapsed = useElapsed(attempt, skew);
  const [status, setStatus] = useState<Status>(null);
  const [verdict, setVerdict] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [making, setMaking] = useState<string | null>(null);
  const [freshFailed, setFreshFailed] = useState<string | null>(null);
  const [hints, setHints] = useState<GymHint[]>(initialHints);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [hintError, setHintError] = useState<string | null>(null);
  const [cause, setCause] = useState<number | null>(null);
  const [kind, setKind] = useState("");
  const [fn, setFn] = useState("");
  const [tested, setTested] = useState<{ passed: number; total: number } | null>(null);

  const limitMinutes = attempt?.limitMinutes ?? upcoming.limitMinutes;
  const limit = limitMinutes * 60;
  const running = attempt !== null && attempt.finishedAt === null;
  const over = elapsed > limit;
  const workspace = attempt ? `gym:${attempt.id}` : "";

  const begin = async (opts: { variantId?: number; fallback?: boolean } = {}): Promise<void> => {
    setBusy(true);
    setStatus(null);
    setFreshFailed(null);
    try {
      const res = await startCaseAction(gymCase.id, opts);
      if (res.ok) {
        setHints([]); setHintError(null); setVerdict(null); setTested(null); setCause(null); setKind(""); setFn("");
        setSession(res.session);
        setAttempt(res.attempt);
        router.refresh();
        return;
      }
      if (res.needsVariant) { await makeFresh(); return; }
      setStatus({ tone: "info", text: res.error });
    } catch {
      setStatus({ tone: "info", text: "Could not start the case. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  /** Parton writes a fresh case, this browser checks it, and the attempt starts on it. Two tries, then a choice. */
  const makeFresh = async () => {
    setBusy(true);
    let problem: string | null = null;
    try {
      for (let tries = 0; tries < 2; tries++) {
        setMaking("Parton is writing a fresh case with the same kind of bug. This usually takes a minute or two.");
        const made = await freshCaseAction(gymCase.id, problem);
        if (!made.ok) { problem = made.error; if (made.offline) break; continue; }
        setMaking("Checking the fresh case in this browser: its buggy script must run and fail a hidden test, and its fix must pass them all.");
        runtime().warm();
        const report = await checkCase(made.check);
        const settled = await settleFreshCaseAction(made.check.id, report);
        if (settled.ok) { setMaking(null); await begin({ variantId: made.check.id }); return; }
        problem = settled.problem;
      }
      setFreshFailed(problem ?? "something went wrong");
    } catch {
      setFreshFailed("the connection dropped");
    } finally {
      setMaking(null);
      setBusy(false);
    }
  };

  const guess = async () => {
    if (!attempt || !session) return;
    const d = session.causes ? (cause === null ? null : { cause }) : (kind && fn ? { kind, fn } : null);
    if (!d) { setVerdict({ tone: "info", text: session.causes ? "Pick a cause first." : "Pick a kind of bug and a function first." }); return; }
    setBusy(true);
    try {
      const res = await diagnoseAction(attempt.id, d);
      if (!res.ok) { setVerdict({ tone: "info", text: res.error }); return; }
      setAttempt(res.attempt);
      setVerdict(res.right
        ? { tone: "right", text: `${res.note} Now fix the script and press Submit fix: ${session.testCount} hidden tests check it.` }
        : { tone: "wrong", text: `${res.note} Wrong guesses so far: ${res.attempt.wrongGuesses}.` });
    } catch {
      setVerdict({ tone: "info", text: "Could not check that. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const submit = async (api: RunnerApi) => {
    if (!attempt) return;
    setBusy(true);
    try {
      const tests = await caseTestsAction(gymCase.id);
      if (!tests) { setStatus({ tone: "info", text: "Name the cause first; the fix is checked once you have." }); return; }
      const result = await api.runChecks(tests);
      if (!result || result.stopped === "user") return;
      const res = await submitFixAction(attempt.id, JSON.stringify({ source: api.source, results: result.tests ?? [] }));
      if (!res.ok) { setStatus({ tone: "info", text: res.error }); return; }
      setTested({ passed: res.passed, total: res.total });
      setAttempt(res.attempt);
      if (res.attempt.outcome === "solved") {
        forgetDraft(attempt.id);
        const t = res.attempt.seconds ?? 0;
        const clean = res.attempt.wrongGuesses === 0 && t <= limit;
        setStatus({
          tone: "right",
          text: `Fixed in ${clock(t)}${t <= limit ? `, inside the ${limitMinutes}-minute limit` : `, ${clock(t - limit)} over the limit`}${res.attempt.wrongGuesses ? `, after ${res.attempt.wrongGuesses} wrong ${res.attempt.wrongGuesses === 1 ? "guess" : "guesses"} at the cause` : ", with the cause named first time"}. ${clean ? (res.attempt.level < 3 ? "The next attempt at this case will be a level harder." : "The next attempt will be another fresh case.") : "The lessons behind this bug come back before the case does."}`,
        });
        router.refresh();
      } else {
        setStatus({
          tone: "wrong",
          text: result.error
            ? "Your script stopped with an error, so no test could run. Fix it and submit again; the clock keeps going."
            : `${res.passed} of ${res.total} hidden tests passed. Read the failures above, fix the script and submit again.`,
        });
      }
    } catch {
      setStatus({ tone: "info", text: "Could not submit. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const quit = async () => {
    if (!attempt || !window.confirm("Give up this attempt? The cause, the explanation and the fix are shown, and the lessons behind this bug come back before the case does.")) return;
    setBusy(true);
    try {
      const ended = await giveUpCaseAction(attempt.id);
      if (ended) {
        forgetDraft(attempt.id);
        setAttempt(ended);
        setStatus({ tone: "info", text: `Attempt ended after ${clock(ended.seconds ?? 0)}. The debrief below shows what was planted and why the curve looked as it did.` });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const ask = async () => {
    if (!attempt || asking) return;
    setAsking(true);
    setHintError(null);
    try {
      const ws = workspaces.get(workspace);
      const res = await gymHintAction(attempt.id, question, { source: ws?.source ?? "", output: ws?.output ?? "", error: ws?.error ?? null });
      if (res.ok) { setHints((h) => [...h, res.hint]); setQuestion(""); } else setHintError(res.error);
    } catch {
      setHintError("Could not reach Parton. Check your connection and try again.");
    } finally {
      setAsking(false);
    }
  };

  const freshChoice = freshFailed && (
    <div className="drill-variant-failed">
      <p className="feedback feedback-info"><Spark /><span>Parton could not make a sound fresh case this time: {freshFailed}.</span></p>
      <div className="drill-after">
        {parton && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void makeFresh()}>Try another fresh case</button>}
        <button type="button" className="btn" disabled={busy} onClick={() => void begin({ fallback: true })}><Play size={14} />Take this case, unguided</button>
      </div>
    </div>
  );

  if (!attempt) {
    return (
      <div className="drill-start">
        <p className="drill-start-summary">{gymCase.summary}</p>
        <p className="drill-level-line">
          <span className="mono-tag">Level {upcoming.level} of 3 · {upcoming.levelName}</span>
          <span className="muted">{upcoming.about}</span>
        </p>
        {upcoming.reason && <p className="drill-reason">{upcoming.reason}</p>}
        <p className="muted">
          The script opens and the clock starts when you press Start. Aim for {upcoming.limitMinutes} minutes. Run it, find out why the
          curve looks wrong, name the cause, then fix the script against hidden tests. Your code runs only in this browser.
        </p>
        {making ? <p className="code-status"><span className="pill-spin" />{making}</p> : (
          <div className="drill-after drill-start-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => void begin()} disabled={busy}>
              <Play size={14} />{upcoming.fresh ? "Make a fresh case and start" : "Start the clock"}
            </button>
            {!upcoming.fresh && upcoming.solvedBefore && parton && (
              <button type="button" className="btn" onClick={() => void makeFresh()} disabled={busy}>Try a fresh case instead</button>
            )}
          </div>
        )}
        {freshChoice}
        {status && <Feedback status={status} />}
      </div>
    );
  }

  const tone = attempt.outcome === "solved" ? (attempt.seconds! <= limit ? "success" : "accent") : running ? (over ? "danger" : "neutral") : "muted";
  const program = session?.program ?? "";
  const symptom = session?.symptomHtml ? <div className="prose" dangerouslySetInnerHTML={{ __html: session.symptomHtml }} /> : children;

  return (
    <div className="drill-session">
      <div className={`drill-timer ${running ? "is-running" : ""} ${over ? "is-over" : ""}`} role="timer" aria-live="off">
        <Clock size={16} />
        <span className="drill-clock">{clock(elapsed)}</span>
        <span className="muted">of {limitMinutes}:00</span>
        <span className="drill-timer-pill">
          <Pill tone={tone}>
            {attempt.outcome === "solved" ? "Solved" : attempt.outcome === "gave_up" ? "Gave up" : attempt.outcome === "abandoned" ? "Abandoned"
              : attempt.diagnosed ? "Cause named, fixing" : over ? "Over time" : "Hunting"}
          </Pill>
        </span>
        {tested && running && <span className="muted drill-timer-tests">{tested.passed} of {tested.total} tests</span>}
        <span className="drill-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, (elapsed / limit) * 100)}%` }} /></span>
      </div>

      <p className="drill-level-line">
        <span className="mono-tag">Level {attempt.level} · {session?.levelName ?? ""}</span>
        {session?.variantId ? <span><strong>Fresh case: {session.title}.</strong></span> : null}
      </p>

      <div className="gym-symptom">{symptom}</div>

      <CodeRunner
        key={attempt.id}
        initial={program}
        original={program}
        draftKey={running ? `frontier:gym:${attempt.id}` : undefined}
        workspaceKey={workspace}
        brief={symptom}
        label={`Training script for the case ${session?.title ?? gymCase.title}`}
        actions={(api) => running && attempt.diagnosed ? (
          <>
            <button type="button" className="btn btn-primary" disabled={api.busy || busy || !api.source.trim()} onClick={() => void submit(api)}>
              <span className="code-check-mark" aria-hidden="true"><Check size={14} /></span>
              {busy ? "Testing…" : `Submit fix (${attempt.totalTests} hidden tests)`}
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => void quit()}>Give up</button>
          </>
        ) : running ? <button type="button" className="btn" disabled={busy} onClick={() => void quit()}>Give up</button> : null}
      />

      {running && !attempt.diagnosed && session && (
        <section className="gym-diagnose" aria-labelledby="diagnose-title">
          <h2 id="diagnose-title">Name the cause</h2>
          {session.causes ? (
            <fieldset className="gym-causes">
              <legend className="muted">Which of these explains the curve? Test your idea in the script before you answer: wrong guesses count.</legend>
              {session.causes.map((text, i) => (
                <label key={i} className={`gym-cause ${cause === i ? "is-on" : ""}`}>
                  <input type="radio" name="cause" checked={cause === i} onChange={() => setCause(i)} disabled={busy} />
                  <span>{text}</span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className="gym-unguided">
              <p className="muted">No candidates at this level. Name the kind of bug and the function it lives in. Wrong guesses count.</p>
              <label>
                <span className="eyebrow">Kind of bug</span>
                <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} disabled={busy}>
                  <option value="">Choose…</option>
                  {kinds.map((k) => <option key={k.id} value={k.id}>{k.name}: {k.about}</option>)}
                </select>
              </label>
              <label>
                <span className="eyebrow">Function</span>
                <select className="input" value={fn} onChange={(e) => setFn(e.target.value)} disabled={busy}>
                  <option value="">Choose…</option>
                  {session.functions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            </div>
          )}
          <div className="drill-after">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void guess()}>Name this as the cause</button>
          </div>
        </section>
      )}
      {verdict && <Feedback status={verdict} />}
      {status && <Feedback status={status} />}

      {running && (
        <section className="drill-parton" aria-label="Parton's hints">
          <p className="drill-parton-head"><span className="parton-mark" aria-hidden="true">P</span>Parton <span className="mono-tag">{attempt.diagnosed ? "Hints on the fix" : "Hints on the hunt, never the cause"}</span></p>
          {hints.map((h) => (
            <div key={h.id} className="drill-hint">
              <p className="parton-msg-meta">{h.rung > 100 ? `Fix hint ${h.rung - 100}` : `Hunt hint ${h.rung}`} of 5</p>
              <div className="parton-prose" dangerouslySetInnerHTML={{ __html: h.html }} />
            </div>
          ))}
          {parton ? (
            <form className="drill-parton-ask" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={asking}
                placeholder={attempt.diagnosed ? "What does your fix still get wrong? (optional)" : "What have you tried, and what did it show? (optional)"} aria-label="Your question to Parton" />
              <button type="submit" className="btn" disabled={asking}>{asking ? "Parton is thinking…" : hints.length ? "Another hint" : "Ask Parton where to look"}</button>
            </form>
          ) : <p className="muted">Parton is not connected, so it cannot give hints yet.</p>}
          {hintError && <p className="feedback feedback-wrong">{hintError}</p>}
        </section>
      )}

      {!running && (
        <>
          {making ? <p className="code-status"><span className="pill-spin" />{making}</p> : (
            <div className="drill-after">
              <button type="button" className="btn btn-primary" onClick={() => void begin()} disabled={busy}><Play size={14} />Start again</button>
            </div>
          )}
          {freshChoice}
        </>
      )}
    </div>
  );
}

function Feedback({ status }: { status: NonNullable<Status> }) {
  return (
    <p className={`feedback feedback-${status.tone}`} role="status">
      {status.tone === "right" ? <Check /> : status.tone === "wrong" ? <Close /> : <Spark />}
      <span>{status.text}</span>
    </p>
  );
}
