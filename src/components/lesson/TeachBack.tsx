"use client";

import { useState, useTransition } from "react";
import { teachBackAction } from "@/app/actions";
import { AnswerBox, clearDraft } from "@/components/lesson/AnswerBox";

type Review = { strength: string; questions: string[] };

export function TeachBack({ lessonId, prompt, initial, initialReview, connected }: {
  lessonId: string;
  prompt: string;
  initial: string | null;
  initialReview: Review | null;
  connected: boolean;
}) {
  const [text, setText] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial !== null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(initialReview);
  const [pending, start] = useTransition();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const save = () => start(async () => {
    const res = await teachBackAction(lessonId, text);
    if (!res.ok) { setError(res.error ?? "Could not save."); return; }
    clearDraft(`frontier:teach:${lessonId}`);
    setError(res.reviewError ?? null);
    setSaved(true);
    if (res.review) setReview(res.review);
    if (res.lessonMastered) window.dispatchEvent(new CustomEvent("frontier:mastered"));
  });

  return (
    <div className="teachback">
      <p className="teachback-prompt">{prompt}</p>
      <AnswerBox value={text} rows={5} label="Your explanation" draftKey={`frontier:teach:${lessonId}`}
        onChange={(t) => { setText(t); setSaved(false); }}
        onSubmit={() => { if (!pending && !saved && words > 0) save(); }}
        placeholder="A few plain sentences are enough. Or tap Dictate and say it as you would to a friend." />
      <div className="teachback-foot">
        <span className="hint">{words} words</span>
        <button type="button" className="btn btn-primary" disabled={pending || saved || words === 0}
          onClick={save}>
          {pending ? (connected ? "Parton is reading…" : "Saving…") : saved ? "Saved" : initial !== null || review ? "Save revision" : "Save explanation"}
        </button>
      </div>
      {error && <p className="feedback feedback-wrong">{error}</p>}
      {saved && !error && !connected && (
        <p className="hint">Saved. Once Parton is connected, it reads your explanation and tells you what works.</p>
      )}
      {review && (
        <div className="parton-feedback" aria-live="polite">
          <p className="parton-feedback-head"><span className="parton-mark" aria-hidden="true">P</span>Parton read your explanation</p>
          <div className="parton-prose" dangerouslySetInnerHTML={{ __html: review.strength }} />
          {review.questions.length > 0 ? (
            <>
              <p className="parton-feedback-sub">Something you could add, if you like:</p>
              <ol className="parton-questions">
                {review.questions.map((q, i) => <li key={i} className="parton-prose" dangerouslySetInnerHTML={{ __html: q }} />)}
              </ol>
              <p className="hint">Your explanation is saved and counts already. Revising it is optional.</p>
            </>
          ) : (
            <p className="hint">Well explained. Your explanation is saved and counts towards mastering this lesson.</p>
          )}
        </div>
      )}
    </div>
  );
}
