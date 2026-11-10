"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { askPartonAction } from "@/app/actions";
import { Pill } from "@/components/ui/Pill";
import { Close, Send } from "@/components/ui/Icons";

export type PanelMessage = { id: number | string; role: "user" | "parton"; html: string; rung: number | null; exerciseLabel: string | null };

type Focus = { exerciseId: string; label: string } | null;

const STARTERS = [
  "Explain the main idea of this lesson in plain words.",
  "Why does this idea matter?",
  "Give me a simpler example to start with.",
];

const RUNG_NAMES = ["", "A question back", "A pointer", "A nudge", "A skeleton", "A parallel example"];

export function PartonPanel({ lessonId, lessonTitle, initial, connected }: {
  lessonId: string;
  lessonTitle: string;
  initial: PanelMessage[];
  connected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initial);
  const [focus, setFocus] = useState<Focus>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<Focus>).detail;
      setFocus(detail);
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("frontier:ask", onAsk);
    return () => window.removeEventListener("frontier:ask", onAsk);
  }, []);

  // "/" opens Parton from anywhere on the page, unless the learner is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  const send = () => {
    const text = draft.trim();
    if (!text || pending) return;
    setError(null);
    const tempId = `pending-${Date.now()}`;
    const optimistic: PanelMessage = {
      id: tempId, role: "user", rung: null, exerciseLabel: focus?.label ?? null,
      html: text.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join(""),
    };
    setMessages((m) => [...m, optimistic]);
    setDraft("");
    start(async () => {
      const res = await askPartonAction(lessonId, focus?.exerciseId ?? null, text);
      if (!res.ok) {
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setDraft(text);
        setError(res.error);
        return;
      }
      setMessages((m) => [...m.filter((x) => x.id !== tempId), res.question, res.reply]);
    });
  };

  const starter = focus
    ? `I'm stuck on ${focus.label.toLowerCase()}. Here is what I've tried: `
    : "";

  return (
    <>
      <button ref={launcherRef} type="button" className={`parton-launcher ${open ? "is-hidden" : ""}`}
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }} aria-haspopup="dialog">
        <span className="parton-mark" aria-hidden="true">P</span>
        Ask Parton
        <kbd aria-hidden="true">/</kbd>
      </button>

      <aside className={`parton-panel ${open ? "is-open" : ""}`} role="dialog" aria-modal="false" aria-label="Parton, your tutor" aria-hidden={!open}>
        <header className="parton-head">
          <p className="parton-title">
            <span className="parton-mark" aria-hidden="true">P</span>Parton
            {connected ? <Pill tone="success" icon="dot">Online</Pill> : <Pill tone="muted" icon="dot">Offline</Pill>}
          </p>
          <button type="button" className="btn btn-ghost parton-close" onClick={close} aria-label="Close Parton" tabIndex={open ? 0 : -1}>
            <Close />
          </button>
        </header>
        <p className="parton-sub"><span className="mono-tag">Hints, never answers</span><span>{lessonTitle}</span></p>

        <div className="parton-list" ref={listRef}>
          {!connected && (
            <div className="parton-empty">
              <p><strong>Parton is not connected yet.</strong></p>
              <p>It needs an Anthropic API key, added in Vercel as <code>ANTHROPIC_API_KEY</code>. Everything else in the lesson works without it.</p>
            </div>
          )}
          {connected && messages.length === 0 && (
            <div className="parton-empty">
              <p>Ask anything about this lesson. For practice questions, I give hints, not answers. Show your working for better hints.</p>
              <div className="parton-starters">
                {STARTERS.map((t) => (
                  <button key={t} type="button" tabIndex={open ? 0 : -1}
                    onClick={() => { setDraft(t); inputRef.current?.focus(); }}>
                    {t}<span aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`parton-msg parton-msg-${m.role}`}>
              {(m.exerciseLabel || m.rung) && (
                <p className="parton-msg-meta">
                  {m.role === "user" && m.exerciseLabel}
                  {m.role === "parton" && m.rung ? `Hint ${m.rung} of 5 · ${RUNG_NAMES[m.rung]}` : null}
                </p>
              )}
              <div className="parton-prose" dangerouslySetInnerHTML={{ __html: m.html }} />
            </div>
          ))}
          {pending && (
            <div className="parton-msg parton-msg-parton" aria-live="polite">
              <p className="parton-thinking"><span /><span /><span /> Parton is thinking</p>
            </div>
          )}
        </div>

        <form className="parton-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
          {focus && (
            <p className="parton-focus">
              About {focus.label.toLowerCase()}
              <button type="button" onClick={() => setFocus(null)} aria-label="Ask a general question instead" tabIndex={open ? 0 : -1}>
                <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </p>
          )}
          {error && <p className="feedback feedback-wrong parton-error">{error}</p>}
          <div className="parton-input-row">
            <textarea ref={inputRef} className="input parton-input" rows={2} value={draft} disabled={!connected}
              placeholder={connected ? (focus ? starter || "What have you tried?" : "Ask about this lesson…") : "Parton is not connected yet"}
              onChange={(e) => setDraft(e.target.value)} tabIndex={open ? 0 : -1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
              aria-label="Your message to Parton" />
            <button type="submit" className="btn btn-primary parton-send" aria-label="Send" disabled={!connected || pending || !draft.trim()} tabIndex={open ? 0 : -1}><Send /></button>
          </div>
          <p className="hint parton-keys"><kbd>Enter</kbd> to send, <kbd>Shift</kbd> <kbd>Enter</kbd> for a new line. Maths in TeX, like $x^2$.</p>
        </form>
      </aside>
    </>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
