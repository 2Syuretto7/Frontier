"use client";

import { useState, useTransition, type ReactNode } from "react";
import { checkExerciseAction, codeTestsAction } from "@/app/actions";
import { CodeRunner, type RunnerApi } from "@/components/code/CodeRunner";
import { AnswerBox, clearDraft } from "@/components/lesson/AnswerBox";
import { Pill } from "@/components/ui/Pill";
import { Check, Close, Spark } from "@/components/ui/Icons";

export type ExerciseView = {
  id: string;
  rung: "check" | "apply" | "prove" | "stretch";
  kind: "numeric" | "expression" | "choice" | "written" | "code";
  options?: string[];
  multiple?: boolean;
  variables?: string[];
  code?: { starter: string; setup?: string; files?: Record<string, string>; checks: number };
  solved: boolean;
  response: string | null;
  verdict: "accepted" | "revise" | "pending" | null;
  feedbackHtml: string | null;
};

const RUNG: Record<ExerciseView["rung"], string> = { check: "Check", apply: "Apply", prove: "Prove or argue", stretch: "Stretch" };

type Status = { tone: "right" | "wrong" | "info"; text: string } | null;

const WRITTEN_STATUS: Record<NonNullable<ExerciseView["verdict"]>, Status> = {
  accepted: { tone: "right", text: "Accepted by Parton." },
  revise: { tone: "info", text: "Nearly there. Parton has a friendly suggestion below; revise and submit again whenever you like." },
  pending: { tone: "info", text: "Submitted. Parton marks written work once connected; until then it counts as submitted." },
};

function initialStatus(view: ExerciseView): Status {
  if (view.kind === "written" && view.verdict) return WRITTEN_STATUS[view.verdict];
  return view.solved ? { tone: "right", text: "Solved." } : null;
}

export function askParton(exerciseId: string, label: string) {
  window.dispatchEvent(new CustomEvent("frontier:ask", { detail: { exerciseId, label } }));
}

export function ExerciseCard({ view, context, children, index }: {
  view: ExerciseView;
  context: "lesson" | "recall" | "review";
  children: ReactNode;
  index?: number;
}) {
  const fresh = context !== "lesson";
  const [value, setValue] = useState(fresh ? "" : view.kind === "choice" ? view.response ?? "" : view.response ?? "");
  const [solved, setSolved] = useState(fresh ? false : view.solved);
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<Status>(fresh ? null : initialStatus(view));
  const [feedback, setFeedback] = useState<string | null>(fresh ? null : view.feedbackHtml);
  const label = `Practice question ${index}`;
  const askable = context === "lesson" && index !== undefined;
  const [pending, start] = useTransition();
  const picked = value.split(",").filter(Boolean).map(Number);

  const [checking, setChecking] = useState(false);

  const submit = (input: string = value) =>
    start(async () => {
      const attempt = tries + 1;
      const res = await checkExerciseAction(view.id, input, context, attempt);
      if (res.message && !res.correct) { setStatus({ tone: "info", text: res.message }); return; }
      setTries(attempt);
      if (view.kind === "written" && context === "lesson") clearDraft(`frontier:written:${view.id}`);
      if (res.verdict) {
        setSolved((s) => s || res.correct);
        setStatus(WRITTEN_STATUS[res.verdict]);
        setFeedback(res.feedbackHtml ?? null);
      } else if (res.correct) {
        setSolved(true);
        setStatus({ tone: "right", text: attempt === 1 ? "Correct." : "Correct, after another look. That counts." });
      } else if (view.kind === "code") {
        setStatus({
          tone: "wrong",
          text: attempt >= 2 && askable
            ? "Not every check passed yet. Read the failed checks above, or ask Parton for a hint."
            : "Not every check passed yet. Read the failed checks above, change your code and check again.",
        });
      } else {
        setStatus({
          tone: "wrong",
          text: attempt >= 2 && askable
            ? "Not yet. Reread the theory for the step that applies, or ask Parton for a hint."
            : "Not yet. Try again.",
        });
      }
      if (res.lessonMastered) window.dispatchEvent(new CustomEvent("frontier:mastered"));
    });

  const toggle = (i: number) => {
    const set = new Set(view.multiple ? picked : []);
    if (set.has(i)) set.delete(i); else set.add(i);
    setValue([...set].sort((a, b) => a - b).join(","));
  };

  const checkCode = async (api: RunnerApi) => {
    setChecking(true);
    try {
      const tests = await codeTestsAction(view.id);
      if (!tests) { setStatus({ tone: "info", text: "This exercise has no checks." }); return; }
      const result = await api.runChecks(tests);
      if (!result || result.stopped === "user") return;
      submit(JSON.stringify({ source: api.source, results: result.tests ?? [] }));
    } catch {
      setStatus({ tone: "info", text: "Could not fetch the checks. Check your connection and try again." });
    } finally {
      setChecking(false);
    }
  };

  const locked = solved && view.kind !== "written" && view.kind !== "code";
  const starter = view.code?.starter ?? "";

  return (
    <div className={`exercise ${solved ? "is-solved" : ""}`}>
      <p className="exercise-meta">
        {index !== undefined && <span className="exercise-index">{String(index).padStart(2, "0")}</span>}
        <span className={`rung rung-${view.rung}`}>{RUNG[view.rung]}</span>
        {view.rung === "stretch" && <span>Optional</span>}
        {solved && status?.tone === "right" && <Pill tone="success" icon="check">{view.kind === "written" ? "Accepted" : "Solved"}</Pill>}
        {(pending || checking) && <Pill tone="accent" icon="spin">{view.kind === "written" ? "Reading" : "Checking"}</Pill>}
      </p>
      <div className="exercise-body">
      <div className="exercise-prompt">{children}</div>

      {view.kind === "code" && view.code && (
        <CodeRunner
          initial={fresh ? starter : view.response ?? starter}
          original={starter}
          setup={view.code.setup}
          files={view.code.files}
          draftKey={context === "lesson" ? `frontier:code:${view.id}` : undefined}
          workspaceKey={context === "lesson" ? view.id : undefined}
          brief={children}
          label={index !== undefined ? `Code editor for practice question ${index}` : "Code editor"}
          actions={(api) => (
            <>
              <button type="button" className="btn btn-primary" disabled={api.busy || pending || checking || !api.source.trim()}
                onClick={() => void checkCode(api)}>
                <span className="code-check-mark" aria-hidden="true"><Check size={14} /></span>
                {checking || pending ? "Checking…" : `Check${view.code!.checks ? ` (${view.code!.checks} ${view.code!.checks === 1 ? "check" : "checks"})` : ""}`}
              </button>
              {askable && !solved && (
                <button type="button" className="btn" onClick={() => askParton(view.id, label)}><span className="parton-mark" aria-hidden="true">P</span>Ask Parton</button>
              )}
            </>
          )}
        />
      )}

      {view.kind !== "code" && <form className="exercise-form" onSubmit={(e) => { e.preventDefault(); if (!pending && value.trim()) submit(); }}>
        {view.kind === "choice" && (
          <div className="choices" role={view.multiple ? "group" : "radiogroup"}>
            {view.options!.map((opt, i) => (
              <label key={opt} className={`choice ${picked.includes(i) ? "is-picked" : ""}`}>
                <input type={view.multiple ? "checkbox" : "radio"} name={view.id} checked={picked.includes(i)}
                  onChange={() => toggle(i)} disabled={locked} />
                <span>{opt}</span>
              </label>
            ))}
            {view.multiple && <p className="hint">Select all that apply.</p>}
          </div>
        )}
        {(view.kind === "numeric" || view.kind === "expression") && (
          <input className="input answer-input" value={value} onChange={(e) => setValue(e.target.value)} disabled={locked}
            inputMode={view.kind === "numeric" ? "decimal" : "text"} autoComplete="off" spellCheck={false}
            placeholder={view.kind === "numeric" ? "A number, such as 12 or 3/4" : `An expression in ${view.variables?.join(", ")}, such as 2x^2 + 1`}
            aria-label="Your answer" />
        )}
        {view.kind === "written" && (
          <AnswerBox value={value} onChange={setValue} rows={6} label="Your answer"
            draftKey={context === "lesson" ? `frontier:written:${view.id}` : undefined}
            onSubmit={() => { if (!pending && value.trim()) submit(); }}
            placeholder="Brief is fine: the key steps in your own words, with symbols or notes. Or tap Dictate and say it." />
        )}
        {!locked && (
          <div className="exercise-actions">
            <button type="submit" className="btn btn-primary" disabled={pending || !value.trim()}>
              {pending ? (view.kind === "written" ? "Parton is reading…" : "Checking…") : view.kind === "written" ? (solved ? "Submit revision" : "Submit") : "Check"}
            </button>
            {askable && !(solved && view.kind !== "written") && (
              <button type="button" className="btn" onClick={() => askParton(view.id, label)}><span className="parton-mark" aria-hidden="true">P</span>Ask Parton</button>
            )}
          </div>
        )}
      </form>}
      {status && (
        <p className={`feedback feedback-${status.tone}`} role="status">
          {status.tone === "right" ? <Check /> : status.tone === "wrong" ? <Close /> : <Spark />}
          <span>{status.text}</span>
        </p>
      )}
      {feedback && (
        <div className="parton-feedback">
          <p className="parton-feedback-head"><span className="parton-mark" aria-hidden="true">P</span>Parton</p>
          <div className="parton-prose" dangerouslySetInnerHTML={{ __html: feedback }} />
        </div>
      )}
      </div>
    </div>
  );
}
