"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CodeRunner, type RunnerApi } from "@/components/code/CodeRunner";
import { Code } from "@/components/lesson/Code";
import { Send } from "@/components/ui/Icons";
import { answerAction, finishInterviewAction, interviewChecksAction } from "@/app/interview/actions";

export type ShownTurn = { id: number; questionId: string; role: "interviewer" | "candidate"; html: string | null; body: string; code: string | null; at: string };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * One interview under way: the conversation so far, and the answer box. Answers can be typed or dictated (speech
 * to text in the browser, Indian English). Coding questions add an editor; handing in code runs its checks here in
 * the browser, and the results go to the interviewer with the code.
 */
export function InterviewSession({ sessionId, index, total, minutes, coding, turns, questionIds }: {
  sessionId: number;
  index: number;
  total: number;
  minutes: number;
  coding: { questionId: string; starter: string; hasChecks: boolean } | null;
  turns: ShownTurn[];
  questionIds: string[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const source = useRef(coding?.starter ?? "");
  const codeChanged = useRef(false);
  const lastAsked = turns.filter((t) => t.role === "interviewer").at(-1);
  const askedAt = useMemo(() => (lastAsked ? Date.parse(lastAsked.at) : Date.now()), [lastAsked]);
  const [now, setNow] = useState(() => Date.now());
  const canDictate = useMemo(() => speechRecognition() !== null, []);
  const end = useRef<HTMLDivElement | null>(null);
  const draftKey = `frontier:interview:${sessionId}:${index}`;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    try { setDraft(window.localStorage.getItem(draftKey) ?? ""); } catch { /* storage is optional */ }
    end.current?.scrollIntoView({ block: "nearest" });
  }, [draftKey, turns.length]);
  useEffect(() => () => recognition.current?.stop(), []);

  const saveDraft = (v: string) => {
    setDraft(v);
    try { if (v) window.localStorage.setItem(draftKey, v); else window.localStorage.removeItem(draftKey); } catch { /* storage is optional */ }
  };

  const dictate = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Ctor = speechRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let said = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript;
      if (said.trim()) setDraft((d) => {
        const next = `${d}${d && !/\s$/.test(d) ? " " : ""}${said.trim()}`;
        try { window.localStorage.setItem(draftKey, next); } catch { /* storage is optional */ }
        return next;
      });
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognition.current = r;
    r.start();
    setListening(true);
  };

  const send = (moveOn: boolean, api?: RunnerApi) => {
    setError(null);
    recognition.current?.stop();
    start(async () => {
      let code: string | null = null;
      let checks: { name: string; passed: boolean; message?: string }[] | null = null;
      if (coding && (api || codeChanged.current)) {
        code = api?.source ?? source.current;
        if (coding.hasChecks && api) {
          setStatus("Running the checks on your code…");
          const tests = await interviewChecksAction(sessionId);
          if (tests) {
            const result = await api.runChecks(tests);
            if (result?.stopped === "user") { setStatus(null); return; }
            checks = result?.tests ?? (result?.error ? [{ name: "the program runs", passed: false, message: result.error.split("\n").at(-1) }] : null);
          }
        }
      }
      if (!moveOn && !draft.trim() && !code) { setStatus(null); setError("Say something first, or press Move on."); return; }
      setStatus(moveOn && index + 1 >= total ? "Scoring your interview…" : "The interviewer is reading your answer…");
      const res = await answerAction(sessionId, { body: draft, code, checks, seconds: Math.round((Date.now() - askedAt) / 1000), moveOn });
      setStatus(null);
      if (!res.ok) { setError(res.error); return; }
      saveDraft("");
      codeChanged.current = false;
      router.refresh();
    });
  };

  const finish = () => {
    setStatus("Scoring your interview…");
    start(async () => { await finishInterviewAction(sessionId); });
  };

  const elapsed = Math.max(0, Math.round((now - askedAt) / 1000));
  const over = elapsed > minutes * 60;

  return (
    <div className="iv-session">
      <ol className="iv-transcript">
        {turns.map((t) => {
          const q = questionIds.indexOf(t.questionId);
          const first = turns.find((x) => x.questionId === t.questionId)?.id === t.id;
          return (
            <li key={t.id} className={`iv-turn iv-${t.role}`}>
              <span className="mono-tag">{t.role === "interviewer" ? (first ? `Question ${q + 1} of ${total}` : "Interviewer") : "You"}</span>
              {t.html !== null ? <div className="parton-prose" dangerouslySetInnerHTML={{ __html: t.html }} /> : t.body && <p className="iv-said">{t.body}</p>}
              {t.code && <Code>{t.code}</Code>}
            </li>
          );
        })}
      </ol>
      <div ref={end} />

      {coding && (
        <CodeRunner
          key={coding.questionId}
          initial={coding.starter}
          original={coding.starter}
          draftKey={`frontier:interview-code:${sessionId}:${coding.questionId}`}
          label="Code editor for this interview question"
          onSourceChange={(s) => { source.current = s; codeChanged.current = true; }}
          actions={(api) => (
            <button type="button" className="btn btn-primary" disabled={pending || api.busy} onClick={() => send(false, api)}>
              <Send size={14} /> Hand in code and answer
            </button>
          )}
        />
      )}

      <div className="iv-answer">
        <label htmlFor="iv-draft" className="eyebrow">Your answer</label>
        <textarea
          id="iv-draft"
          className="input iv-textarea"
          rows={7}
          value={draft}
          onChange={(e) => saveDraft(e.target.value)}
          placeholder={coding ? "Explain your approach, its complexity and how you would test it. Your code goes with it when you hand it in." : "Answer as you would aloud. Think out loud; the interviewer cares how you reason."}
          disabled={pending}
        />
        <div className="iv-answer-bar">
          <span className={`mono-meta iv-clock${over ? " is-over" : ""}`} aria-live="off">
            {clock(elapsed)} <span className="muted">/ about {minutes} min</span>
          </span>
          {canDictate && (
            <button type="button" className="btn" onClick={dictate} disabled={pending} aria-pressed={listening}>
              {listening ? "Stop dictating" : "Dictate"}
            </button>
          )}
          {!coding && (
            <button type="button" className="btn btn-primary" onClick={() => send(false)} disabled={pending || !draft.trim()}>
              <Send size={14} /> Answer
            </button>
          )}
          <button type="button" className="btn" onClick={() => send(true)} disabled={pending} title="Hand in what you have and go to the next question">
            {index + 1 >= total ? "Finish" : "Move on"}
          </button>
        </div>
        {status && <p className="hint" role="status">{status}</p>}
        {error && <p className="iv-error" role="alert">{error}</p>}
        <p className="hint">
          Question {index + 1} of {total}. The interviewer may follow up up to twice before moving on. Scores come at the end.{" "}
          {index > 0 && <button type="button" className="text-link iv-finish" onClick={finish} disabled={pending}>End now and score what I have answered</button>}
        </p>
      </div>
    </div>
  );
}
