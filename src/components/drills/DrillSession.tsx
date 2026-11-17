"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CodeRunner, type RunnerApi } from "@/components/code/CodeRunner";
import { Code } from "@/components/lesson/Code";
import { Pill } from "@/components/ui/Pill";
import { Check, Clock, Close, Play, Spark } from "@/components/ui/Icons";
import {
  drillSolutionAction, drillTestsAction, giveUpDrillAction, startDrillAction, submitDrillAction,
} from "@/app/drills/actions";
import type { Attempt } from "@/lib/drills";
import { clock } from "./format";

type Status = { tone: "right" | "wrong" | "info"; text: string } | null;

export type DrillMeta = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  starter: string;
  setup?: string;
  testCount: number;
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

export function DrillSession({ drill, initial, serverNow, solutionAvailable, children }: {
  drill: DrillMeta;
  /** An attempt still under way when the page loaded, which carries on. */
  initial: Attempt | null;
  serverNow: number;
  solutionAvailable: boolean;
  /** The brief, shown once the clock starts. */
  children: ReactNode;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(initial);
  const [skew] = useState(() => serverNow - Date.now());
  const elapsed = useElapsed(attempt, skew);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [canSolve, setCanSolve] = useState(solutionAvailable);
  const lastResult = useRef<{ passed: number; total: number } | null>(null);

  const limit = drill.minutes * 60;
  const running = attempt !== null && attempt.finishedAt === null;
  const over = elapsed > limit;

  const start = async () => {
    setBusy(true);
    setStatus(null);
    setSolution(null);
    try {
      const next = await startDrillAction(drill.id);
      if (!next) { setStatus({ tone: "info", text: "Could not start this drill." }); return; }
      lastResult.current = null;
      setAttempt(next);
      router.refresh();
    } catch {
      setStatus({ tone: "info", text: "Could not start the drill. Check your connection and try again." });
    } finally {
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
        const t = res.attempt.seconds ?? 0;
        setStatus({
          tone: "right",
          text: t <= limit
            ? `Passed every hidden test in ${clock(t)}, inside the ${drill.minutes}-minute limit.`
            : `Passed every hidden test in ${clock(t)}, ${clock(t - limit)} over the ${drill.minutes}-minute limit.`,
        });
        router.refresh();
      } else {
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
    if (!attempt || !window.confirm("Give up this attempt? It counts as a miss in your pass rate, and the reference solution becomes available.")) return;
    setBusy(true);
    try {
      const ended = await giveUpDrillAction(attempt.id);
      if (ended) {
        forgetDraft(attempt.id);
        setAttempt(ended);
        setCanSolve(true);
        setStatus({ tone: "info", text: `Attempt ended after ${clock(ended.seconds ?? 0)}. Read the reference solution, then try again from a blank editor.` });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const reveal = async () => {
    const text = await drillSolutionAction(drill.id);
    setSolution(text ?? "The reference solution opens once an attempt has ended.");
  };

  if (!attempt) {
    return (
      <div className="drill-start">
        <p className="drill-start-summary">{drill.summary}</p>
        <p className="muted">
          The brief opens and the clock starts when you press Start. Aim for {drill.minutes} minutes. Submit as often
          as you like against {drill.testCount} hidden tests; the attempt passes when all of them do. Your code runs
          only in this browser.
        </p>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => void start()} disabled={busy}>
          <Play size={14} />Start the clock
        </button>
        {canSolve && (
          <p><button type="button" className="text-link drill-solution-link" onClick={() => void reveal()}>See the reference solution</button></p>
        )}
        {solution && <Code>{solution}</Code>}
        {status && <Feedback status={status} />}
      </div>
    );
  }

  const tone = attempt.outcome === "passed" ? (attempt.seconds! <= limit ? "success" : "accent") : running ? (over ? "danger" : "neutral") : "muted";

  return (
    <div className="drill-session">
      <div className={`drill-timer ${running ? "is-running" : ""} ${over ? "is-over" : ""}`} role="timer" aria-live="off">
        <Clock size={16} />
        <span className="drill-clock">{clock(elapsed)}</span>
        <span className="muted">of {drill.minutes}:00</span>
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

      <div className="prose drill-brief">{children}</div>

      <CodeRunner
        key={attempt.id}
        initial={drill.starter}
        original={drill.starter}
        setup={drill.setup}
        draftKey={running ? `frontier:drill:${attempt.id}` : undefined}
        brief={children}
        label={`Code editor for the ${drill.title} drill`}
        actions={(api) => running ? (
          <>
            <button type="button" className="btn btn-primary" disabled={api.busy || busy || !api.source.trim()} onClick={() => void submit(api)}>
              <span className="code-check-mark" aria-hidden="true"><Check size={14} /></span>
              {busy ? "Testing…" : `Submit (${drill.testCount} hidden tests)`}
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => void quit()}>Give up</button>
          </>
        ) : null}
      />

      {status && <Feedback status={status} />}

      {!running && (
        <div className="drill-after">
          <button type="button" className="btn btn-primary" onClick={() => void start()} disabled={busy}>
            <Play size={14} />Try again from scratch
          </button>
          {canSolve && !solution && <button type="button" className="btn" onClick={() => void reveal()}>See the reference solution</button>}
        </div>
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

function Feedback({ status }: { status: NonNullable<Status> }) {
  return (
    <p className={`feedback feedback-${status.tone}`} role="status">
      {status.tone === "right" ? <Check /> : status.tone === "wrong" ? <Close /> : <Spark />}
      <span>{status.text}</span>
    </p>
  );
}
