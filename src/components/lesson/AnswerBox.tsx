"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Mic, Stop } from "@/components/ui/Icons";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function recogniser(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function readDraft(key?: string): string | null {
  if (!key) return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeDraft(key: string | undefined, text: string) {
  if (!key) return;
  try {
    if (text.trim()) window.localStorage.setItem(key, text);
    else window.localStorage.removeItem(key);
  } catch { /* storage unavailable: the box still works */ }
}

export function clearDraft(key?: string) {
  writeDraft(key, "");
}

/** Join spoken text onto what is already there, with one space between. */
export function appendSpoken(text: string, spoken: string): string {
  const s = spoken.trim();
  if (!s) return text;
  if (!text.trim()) return s.charAt(0).toUpperCase() + s.slice(1);
  const t = /[.!?]\s*$/.test(text) ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  return /\s$/.test(text) ? text + t : `${text} ${t}`;
}

/**
 * A text box for Prove or argue and Teach it back that keeps typing to a minimum: answers can be
 * dictated, drafts are kept on this device until submitted, and Ctrl or Cmd + Enter submits.
 */
export function AnswerBox({ value, onChange, onSubmit, draftKey, rows, placeholder, label, disabled }: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  draftKey?: string;
  rows: number;
  placeholder: string;
  label: string;
  disabled?: boolean;
}) {
  const [canDictate, setCanDictate] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    setCanDictate(recogniser() !== null);
    const draft = readDraft(draftKey);
    if (draft && draft !== latest.current) onChange(draft);
    return () => rec.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const change = (text: string) => {
    onChange(text);
    writeDraft(draftKey, text);
  };

  const toggleMic = () => {
    if (listening) { rec.current?.stop(); return; }
    const R = recogniser();
    if (!R) return;
    const r = new R();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let heard = "", pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) heard += res[0].transcript; else pending += res[0].transcript;
      }
      if (heard) change(appendSpoken(latest.current, heard));
      setInterim(pending);
    };
    r.onerror = (e) => {
      setMicError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone access was blocked. Allow it in the browser to dictate."
        : e.error === "no-speech" ? "Did not hear anything. Tap the microphone and try again." : "Dictation stopped. Tap the microphone to try again.");
    };
    r.onend = () => { setListening(false); setInterim(""); rec.current = null; };
    rec.current = r;
    setMicError(null);
    try { r.start(); setListening(true); } catch { setMicError("Dictation could not start. Try again."); }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); rec.current?.stop(); onSubmit(); }
  };

  return (
    <div className="answer-box">
      <textarea className="input textarea" value={value} rows={rows} placeholder={placeholder} aria-label={label}
        disabled={disabled} onChange={(e) => change(e.target.value)} onKeyDown={onKeyDown} />
      <div className="answer-box-bar">
        {canDictate && (
          <button type="button" className={`btn btn-sm ${listening ? "is-listening" : ""}`} onClick={toggleMic} disabled={disabled}
            aria-pressed={listening} title={listening ? "Stop dictating" : "Speak your answer instead of typing"}>
            {listening ? <Stop size={14} /> : <Mic size={14} />}{listening ? "Stop" : "Dictate"}
          </button>
        )}
        <span className="hint answer-box-hint" aria-live="polite">
          {micError ?? (listening ? (interim ? `Hearing: ${interim}` : "Listening… speak your answer.") : <>Short notes and symbols are fine.<span className="kbd-hint"> Ctrl or ⌘ + Enter submits.</span></>)}
        </span>
      </div>
    </div>
  );
}
