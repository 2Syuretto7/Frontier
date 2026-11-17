"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { addEvidenceAction, addPostingAction, extractSkillsAction, findPostingsAction, scoreSkillsAction, type ReadinessState } from "@/app/readiness/actions";
import { EVIDENCE_KINDS, POSTINGS_MIN } from "@/lib/readiness/core";
import { BOARDS } from "@/lib/readiness/sourcing";

function Submit({ children, pending, className = "btn btn-primary", disabled = false }: { children: React.ReactNode; pending: string; className?: string; disabled?: boolean }) {
  const status = useFormStatus();
  return (
    <button type="submit" className={className} disabled={disabled || status.pending} aria-busy={status.pending}>
      {status.pending ? pending : children}
    </button>
  );
}

function Status({ state }: { state: ReadinessState }) {
  if (state?.error) return <p className="error" role="alert">{state.error}</p>;
  if (state?.done) return <p className="success" role="status">{state.done}</p>;
  return null;
}

/** Clears a form after each successful submit. */
function useResetOnDone(state: ReadinessState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.done) ref.current?.reset();
  }, [state?.at, state?.done]);
  return ref;
}

export function PostingForm({ count }: { count: number }) {
  const [state, action] = useActionState(addPostingAction, undefined);
  const ref = useResetOnDone(state);
  return (
    <form action={action} ref={ref} className="rd-posting-form">
      <div className="rd-row">
        <div className="field">
          <label htmlFor="rd-company">Lab</label>
          <input id="rd-company" name="company" className="input" placeholder="Anthropic" maxLength={120} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="rd-role">Role</label>
          <input id="rd-role" name="role" className="input" placeholder="Research Engineer, Pretraining" maxLength={160} autoComplete="off" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="rd-url">Link <span className="muted">(optional)</span></label>
        <input id="rd-url" name="url" className="input" placeholder="https://…" inputMode="url" autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="rd-body">The posting</label>
        <textarea id="rd-body" name="body" className="input rd-textarea" required rows={8}
          placeholder="Paste the whole posting, especially the responsibilities and what they are looking for." />
      </div>
      <Status state={state} />
      <Submit pending="Adding…" className="btn">{count === 0 ? "Add the first posting" : `Add posting ${count + 1}`}</Submit>
    </form>
  );
}

export function ExtractButton({ count, hasSkills, stale, parton }: { count: number; hasSkills: boolean; stale: boolean; parton: boolean }) {
  const [state, action] = useActionState(extractSkillsAction, undefined);
  const label = hasSkills ? "Re-read postings with Parton" : "Pull out the skills with Parton";
  return (
    <form action={action} className="rd-extract">
      <Status state={state} />
      {!parton && <p className="hint">Parton is not connected, so skills can't be pulled out yet. Add ANTHROPIC_API_KEY in Vercel.</p>}
      {parton && count > 0 && count < POSTINGS_MIN && (
        <p className="hint">{count} posting{count === 1 ? "" : "s"} so far. {POSTINGS_MIN} or more give a much truer picture of what labs keep asking for.</p>
      )}
      {parton && hasSkills && stale && <p className="hint">The postings have changed since Parton last read them.</p>}
      <Submit pending="Parton is reading the postings… (up to two minutes)" className={stale || !hasSkills ? "btn btn-primary" : "btn"}
        disabled={!parton || count === 0}>
        {label}
      </Submit>
    </form>
  );
}

export function EvidenceForm({ skillId }: { skillId: number }) {
  const [state, action] = useActionState(addEvidenceAction, undefined);
  const ref = useResetOnDone(state);
  return (
    <form action={action} ref={ref} className="rd-evidence-form">
      <input type="hidden" name="skill" value={skillId} />
      <div className="rd-row rd-row-evidence">
        <div className="field">
          <label htmlFor={`rd-kind-${skillId}`}>Kind</label>
          <select id={`rd-kind-${skillId}`} name="kind" className="input" defaultValue="repo">
            {EVIDENCE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`rd-title-${skillId}`}>What it shows</label>
          <input id={`rd-title-${skillId}`} name="title" className="input" placeholder="nanoGPT from scratch, trained on TinyStories" maxLength={160} autoComplete="off" />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`rd-link-${skillId}`}>Link</label>
        <input id={`rd-link-${skillId}`} name="url" className="input" required placeholder="https://github.com/… or a Frontier page such as /drills/attention" autoComplete="off" />
      </div>
      <Status state={state} />
      <Submit pending="Adding…" className="btn btn-sm">Add evidence</Submit>
    </form>
  );
}

const LABS = BOARDS.map((b) => b.lab);
const labList = `${LABS.slice(0, -1).join(", ")} and ${LABS[LABS.length - 1]}`;

/**
 * The one button that does the work: finds current postings for the target role at every lab, then has Parton
 * pull out the skills. Two server calls in a row, so neither runs into the time limit.
 */
export function RefreshPanel({ role, label, primary = true, parton }: { role: string; label: string; primary?: boolean; parton: boolean }) {
  const [target, setTarget] = useState(role);
  const [step, setStep] = useState<"idle" | "finding" | "reading" | "scoring">("idle");
  const [notes, setNotes] = useState<{ error?: string; done?: string[] }>({});
  const [, startTransition] = useTransition();
  const busy = step !== "idle";

  function run(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setNotes({});
    setStep("finding");
    startTransition(async () => {
      const found = await findPostingsAction(target);
      if (found.error) {
        setNotes({ error: found.error });
        setStep("idle");
        return;
      }
      setStep("reading");
      const read = await extractSkillsAction(undefined);
      if (read?.error) {
        setNotes({ done: [found.done!], error: read.error });
        setStep("idle");
        return;
      }
      setStep("scoring");
      const scored = await scoreSkillsAction();
      setNotes({ done: [found.done!, read?.done ?? "", scored?.done ?? ""].filter(Boolean), error: scored?.error });
      setStep("idle");
    });
  }

  return (
    <form onSubmit={run} className="rd-refresh">
      <div className="field">
        <label htmlFor="rd-target">Your target role</label>
        <textarea id="rd-target" className="input rd-target" rows={2} value={target} onChange={(e) => setTarget(e.target.value)}
          maxLength={300} disabled={busy} />
        <p className="hint">
          Parton reads the open roles at {labList}, keeps the ones that match this, pulls out the skills they ask for, and
          scores each from your passed drills, published projects and mastered lessons.
        </p>
      </div>
      {notes.done?.map((d) => <p key={d} className="success" role="status">{d}</p>)}
      {notes.error && <p className="error" role="alert">{notes.error}</p>}
      {!parton && <p className="hint">Parton is not connected, so this can't run yet. Add ANTHROPIC_API_KEY in Vercel.</p>}
      <button type="submit" className={primary ? "btn btn-primary" : "btn"} disabled={busy || !parton} aria-busy={busy}>
        {step === "finding" ? "Reading the labs' job boards… (up to three minutes)"
          : step === "reading" ? "Parton is pulling out the skills… (up to two minutes)"
          : step === "scoring" ? "Parton is scoring each skill from your evidence… (up to two minutes)"
          : label}
      </button>
    </form>
  );
}

/**
 * Parton's scoring. With `auto`, it starts by itself as soon as the page opens, because something the scores
 * depend on (a passed drill, a published project, a mastered lesson, a new skill) has changed since the last run.
 */
export function ScorePanel({ auto, parton }: { auto: boolean; parton: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<ReadinessState>(undefined);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    setState(undefined);
    const result = await scoreSkillsAction();
    setState(result);
    setBusy(false);
    if (!result?.error) router.refresh();
  }

  useEffect(() => {
    if (auto && parton && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, parton]);

  if (!parton) return null;
  return (
    <div className="rd-score">
      {busy && <p className="hint" role="status">Parton is scoring each skill from your latest evidence… (up to two minutes)</p>}
      <Status state={state} />
      {!busy && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={run}>
          {auto ? "Score again with Parton" : "Re-score with Parton"}
        </button>
      )}
    </div>
  );
}
