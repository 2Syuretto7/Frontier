"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CodeRunner, type RunnerApi } from "@/components/code/CodeRunner";
import { runtime, type RunResult, type TestSpec } from "@/components/code/runtime";
import { Code } from "@/components/lesson/Code";
import { Pill } from "@/components/ui/Pill";
import { Check, Clock, Close, Play, Spark } from "@/components/ui/Icons";
import {
  drillSolutionAction, drillTestsAction, explainDrillAction, generateVariantAction, giveUpDrillAction, settleVariantAction,
  startDrillAction, submitDrillAction,
} from "@/app/drills/actions";
import type { Attempt, SessionMeta } from "@/lib/drills";
import type { DrillHint, VariantCheck } from "@/lib/parton/drills";
import type { VariantReport } from "@/lib/parton/drill-prompts";
import { clock } from "./format";

type Status = { tone: "right" | "wrong" | "info"; text: string } | null;

export type DrillMeta = {
  id: string;
  title: string;
  summary: string;
};

/** What the next attempt will be, shown before the clock starts. */
export type Upcoming = {
  level: number;
  levelName: string;
  about: string;
  limitMinutes: number;
  testCount: number;
  variant: boolean;
  /** Why the plan has put this drill where it is. */
  reason: string | null;
  /** Hidden tests that failed when the drill was last missed. */
  watch: string[];
  /** Whether the learner has passed this drill before, so a fresh variant can be offered at any level. */
  passedBefore: boolean;
};

const forgetDraft = (id: number) => { try { window.localStorage.removeItem(`frontier:drill:${id}`); } catch { /* storage is optional */ } };

/** Seconds since an attempt started, by the server's clock. */
function useElapsed(attempt: Attempt | null, skew: number) {
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

/** Runs one program and its tests in this browser's Python, without showing anything. */
async function quietRun(code: string, setup: string | undefined, tests: TestSpec[]): Promise<RunResult> {
  return runtime().run({ code, setup, tests }, {}).done;
}

/**
 * Checks a variant Parton has just written, before its clock ever starts: its reference solution must pass every
 * test, its starter must fail one, and each plausible wrong answer must fail one.
 */
async function checkVariant(v: VariantCheck): Promise<VariantReport> {
  const solved = await quietRun(v.solution, v.setup, v.tests);
  const starter = await quietRun(v.starter, v.setup, v.tests);
  const caught: boolean[] = [];
  for (const m of v.mutants) {
    const out = await quietRun(m.code, v.setup, v.tests);
    caught.push(out.error !== null || (out.tests ?? []).some((t) => !t.passed));
  }
  return {
    solutionFailures: solved.error ? [] : (solved.tests ?? []).filter((t) => !t.passed).map((t) => `${t.name}${t.message ? ` (${t.message})` : ""}`),
    solutionError: solved.error,
    starterFailed: starter.error !== null || (starter.tests ?? []).some((t) => !t.passed),
    caught,
  };
}

export function DrillSession({ drill, upcoming, initial, initialSession, initialHints, serverNow, solutionAvailable, parton, children }: {
  drill: DrillMeta;
  upcoming: Upcoming;
  /** An attempt still under way when the page loaded, which carries on. */
  initial: Attempt | null;
  initialSession: SessionMeta | null;
  initialHints: DrillHint[];
  serverNow: number;
  solutionAvailable: boolean;
  /** Whether Parton is connected. */
  parton: boolean;
  /** The drill's own brief, shown once the clock starts on an attempt that is not a variant. */
  children: ReactNode;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(initial);
  const [session, setSession] = useState<SessionMeta | null>(initialSession);
  const [skew] = useState(() => serverNow - Date.now());
  const elapsed = useElapsed(attempt, skew);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [making, setMaking] = useState<string | null>(null);
  const [variantFailed, setVariantFailed] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [canSolve, setCanSolve] = useState(solutionAvailable);
  const [hints, setHints] = useState<DrillHint[]>(initialHints);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [hintError, setHintError] = useState<string | null>(null);
  const [failing, setFailing] = useState(initial !== null && initial.failedTests.length > 0);
  const lastResult = useRef<{ passed: number; total: number } | null>(null);

  const limitMinutes = attempt?.limitMinutes ?? upcoming.limitMinutes;
  const limit = limitMinutes * 60;
  const running = attempt !== null && attempt.finishedAt === null;
  const over = elapsed > limit;
  const isVariant = Boolean(session?.variantId);

  const begin = async (opts: { variantId?: number; fallback?: boolean } = {}): Promise<void> => {
    setBusy(true);
    setStatus(null);
    setSolution(null);
    setVariantFailed(null);
    try {
      const res = await startDrillAction(drill.id, opts);
      if (res.ok) {
        lastResult.current = null;
        setHints([]);
        setFailing(false);
        setHintError(null);
        setSession(res.session);
        setAttempt(res.attempt);
        router.refresh();
        return;
      }
      if (res.needsVariant) { await makeVariant(); return; }
      setStatus({ tone: "info", text: res.error });
    } catch {
      setStatus({ tone: "info", text: "Could not start the drill. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  /** Parton writes a variant, this browser checks it, and the attempt starts on it. Two tries, then a choice. */
  const makeVariant = async () => {
    setBusy(true);
    let problem: string | null = null;
    try {
      for (let tries = 0; tries < 2; tries++) {
        setMaking("Parton is writing a new variant of this drill. This usually takes a minute or two.");
        const made = await generateVariantAction(drill.id, problem);
        if (!made.ok) {
          problem = made.error;
          if (made.offline) break;
          continue;
        }
        setMaking("Checking the new variant in this browser: its reference solution must pass, and its tests must catch plausible wrong answers.");
        runtime().warm();
        const report = await checkVariant(made.check);
        const settled = await settleVariantAction(made.check.id, report);
        if (settled.ok) {
          setMaking(null);
          await begin({ variantId: made.check.id });
          return;
        }
        problem = settled.problem;
      }
      setVariantFailed(problem ?? "something went wrong");
    } catch {
      setVariantFailed("the connection dropped");
    } finally {
      setMaking(null);
      setBusy(false);
    }
  };

  const submit = async (api: RunnerApi) => {
    if (!attempt) return;
    setBusy(true);
    try {
      const tests = await drillTestsAction(drill.id);
      if (!tests) { setStatus({ tone: "info", text: "This attempt has ended. Start a new one to try again." }); return; }
      const result = await api.runChecks(tests);
      if (!result || result.stopped === "user") return;
      const res = await submitDrillAction(attempt.id, JSON.stringify({ source: api.source, results: result.tests ?? [] }));
      if (!res.ok) { setStatus({ tone: "info", text: res.error }); return; }
      lastResult.current = { passed: res.passed, total: res.total };
      setAttempt(res.attempt);
      if (res.attempt.outcome === "passed") {
        forgetDraft(attempt.id);
        setCanSolve(true);
        setFailing(false);
        const t = res.attempt.seconds ?? 0;
        setStatus({
          tone: "right",
          text: t <= limit
            ? `Passed every hidden test in ${clock(t)}, inside the ${limitMinutes}-minute limit. ${res.attempt.level < 4 ? "The next attempt at this drill will be a level harder." : "The next attempt will be a new variant."}`
            : `Passed every hidden test in ${clock(t)}, ${clock(t - limit)} over the ${limitMinutes}-minute limit.`,
        });
        router.refresh();
      } else {
        setFailing(true);
        setStatus({
          tone: "wrong",
          text: result.error
            ? "Your program stopped with an error, so no test could run. Fix it and submit again; the clock keeps going."
            : `${res.passed} of ${res.total} hidden tests passed. Read the failures above, fix your code and submit again; the clock keeps going.`,
        });
      }
    } catch {
      setStatus({ tone: "info", text: "Could not submit. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const quit = async () => {
    if (!attempt || !window.confirm("Give up this attempt? It counts as a miss in your pass rate, the drill comes back tomorrow, and the reference solution becomes available.")) return;
    setBusy(true);
    try {
      const ended = await giveUpDrillAction(attempt.id);
      if (ended) {
        forgetDraft(attempt.id);
        setAttempt(ended);
        setCanSolve(true);
        setStatus({ tone: "info", text: `Attempt ended after ${clock(ended.seconds ?? 0)}. Read the reference solution; the drill comes back tomorrow, from a blank editor.` });
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
      const res = await explainDrillAction(attempt.id, question);
      if (res.ok) { setHints((h) => [...h, res.hint]); setQuestion(""); }
      else setHintError(res.error);
    } catch {
      setHintError("Could not reach Parton. Check your connection and try again.");
    } finally {
      setAsking(false);
    }
  };

  const reveal = async () => {
    const text = await drillSolutionAction(drill.id, attempt?.finishedAt ? session?.variantId ?? null : null);
    setSolution(text ?? "The reference solution opens once an attempt has ended.");
  };

  const variantChoice = variantFailed && (
    <div className="drill-variant-failed">
      <p className="feedback feedback-info"><Spark /><span>Parton could not make a sound variant this time: {variantFailed}.</span></p>
      <div className="drill-after">
        {parton && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void makeVariant()}>Try another variant</button>}
        <button type="button" className="btn" disabled={busy} onClick={() => void begin({ fallback: true })}><Play size={14} />Take the drill itself, bare</button>
      </div>
    </div>
  );

  if (!attempt) {
    return (
      <div className="drill-start">
        <p className="drill-start-summary">{drill.summary}</p>
        <LevelLine upcoming={upcoming} />
        {upcoming.reason && <p className="drill-reason">{upcoming.reason}</p>}
        {upcoming.watch.length > 0 && (
          <p className="muted">Last time these hidden tests failed: {upcoming.watch.join("; ")}.</p>
        )}
        <p className="muted">
          The brief opens and the clock starts when you press Start. Aim for {upcoming.limitMinutes} minutes.{" "}
          {upcoming.variant ? "Parton writes a fresh variant first, and this browser checks its tests before the clock starts. " : `Submit as often as you like against ${upcoming.testCount} hidden tests; the attempt passes when all of them do. `}
          Your code runs only in this browser.
        </p>
        {making ? <p className="code-status"><span className="pill-spin" />{making}</p> : (
          <div className="drill-after drill-start-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => void begin()} disabled={busy}>
              <Play size={14} />{upcoming.variant ? "Make a variant and start" : "Start the clock"}
            </button>
            {!upcoming.variant && upcoming.passedBefore && parton && (
              <button type="button" className="btn" onClick={() => void makeVariant()} disabled={busy}>Try a fresh variant instead</button>
            )}
          </div>
        )}
        {variantChoice}
        {canSolve && (
          <p><button type="button" className="text-link drill-solution-link" onClick={() => void reveal()}>See the reference solution</button></p>
        )}
        {solution && <Code>{solution}</Code>}
        {status && <Feedback status={status} />}
      </div>
    );
  }

  const tone = attempt.outcome === "passed" ? (attempt.seconds! <= limit ? "success" : "accent") : running ? (over ? "danger" : "neutral") : "muted";
  const starter = session?.starter ?? "";
  const brief = session?.briefHtml
    ? <div dangerouslySetInnerHTML={{ __html: session.briefHtml }} />
    : children;

  return (
    <div className="drill-session">
      <div className={`drill-timer ${running ? "is-running" : ""} ${over ? "is-over" : ""}`} role="timer" aria-live="off">
        <Clock size={16} />
        <span className="drill-clock">{clock(elapsed)}</span>
        <span className="muted">of {limitMinutes}:00</span>
        <span className="drill-timer-pill">
          <Pill tone={tone}>
            {attempt.outcome === "passed" ? (attempt.seconds! <= limit ? "Passed in time" : "Passed over time")
              : attempt.outcome === "gave_up" ? "Gave up"
              : attempt.outcome === "abandoned" ? "Abandoned"
              : over ? "Over time" : "Running"}
          </Pill>
        </span>
        {lastResult.current && running && (
          <span className="muted drill-timer-tests">{lastResult.current.passed} of {lastResult.current.total} tests</span>
        )}
        <span className="drill-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, (elapsed / limit) * 100)}%` }} /></span>
      </div>

      <p className="drill-level-line">
        <span className="mono-tag">Level {attempt.level} · {session?.levelName ?? ""}</span>
        {isVariant && session && <span><strong>Variant: {session.title}.</strong> {session.twist}</span>}
      </p>

      <div className="prose drill-brief">{brief}</div>

      <CodeRunner
        key={attempt.id}
        initial={starter}
        original={starter}
        setup={session?.setup}
        draftKey={running ? `frontier:drill:${attempt.id}` : undefined}
        brief={brief}
        label={`Code editor for the ${session?.title ?? drill.title} drill`}
        actions={(api) => running ? (
          <>
            <button type="button" className="btn btn-primary" disabled={api.busy || busy || !api.source.trim()} onClick={() => void submit(api)}>
              <span className="code-check-mark" aria-hidden="true"><Check size={14} /></span>
              {busy ? "Testing…" : `Submit (${attempt.totalTests} hidden tests)`}
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => void quit()}>Give up</button>
          </>
        ) : null}
      />

      {status && <Feedback status={status} />}

      {running && (failing || hints.length > 0) && (
        <section className="drill-parton" aria-label="Parton's hints">
          <p className="drill-parton-head"><span className="parton-mark" aria-hidden="true">P</span>Parton <span className="mono-tag">Hints, never the fix</span></p>
          {hints.map((h) => (
            <div key={h.id} className="drill-hint">
              <p className="parton-msg-meta">Hint {h.rung} of 5</p>
              <div className="parton-prose" dangerouslySetInnerHTML={{ __html: h.html }} />
            </div>
          ))}
          {parton ? (
            <form className="drill-parton-ask" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={asking}
                placeholder={hints.length ? "Still stuck? Say what you tried (optional)" : "What are you stuck on? (optional)"} aria-label="Your question to Parton" />
              <button type="submit" className="btn" disabled={asking || !failing}>
                {asking ? "Parton is thinking…" : hints.length ? "Another hint" : "Ask Parton why it failed"}
              </button>
            </form>
          ) : <p className="muted">Parton is not connected, so it cannot explain failures yet.</p>}
          {hintError && <p className="feedback feedback-wrong">{hintError}</p>}
        </section>
      )}

      {!running && (
        <>
          {making ? <p className="code-status"><span className="pill-spin" />{making}</p> : (
            <div className="drill-after">
              <button type="button" className="btn btn-primary" onClick={() => void begin()} disabled={busy}>
                <Play size={14} />Try again from scratch
              </button>
              {canSolve && !solution && <button type="button" className="btn" onClick={() => void reveal()}>See the reference solution</button>}
            </div>
          )}
          {variantChoice}
        </>
      )}
      {solution && (
        <div className="drill-solution">
          <p className="eyebrow">Reference solution</p>
          <Code>{solution}</Code>
        </div>
      )}
    </div>
  );
}

function LevelLine({ upcoming }: { upcoming: Upcoming }) {
  return (
    <p className="drill-level-line">
      <span className="mono-tag">Level {upcoming.level} of 4 · {upcoming.levelName}</span>
      <span className="muted">{upcoming.about}</span>
    </p>
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
