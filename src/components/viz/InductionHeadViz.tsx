"use client";

import { useMemo, useState } from "react";

const TEXT = "my aunt keeps a blue kettle and a red teapot ; on sundays my aunt keeps a blue".split(" ");
const BETA = 10;

/** Induction head on one-hot tokens: position i attends to j ≤ i whose previous token equals token i, and copies token j. */
export function induction(tokens: string[], i: number) {
  const scores = tokens.map((_, j) => (j > i ? -Infinity : j > 0 && tokens[j - 1] === tokens[i] ? BETA : 0));
  const m = Math.max(...scores), e = scores.map((s) => Math.exp(s - m)), Z = e.reduce((a, b) => a + b, 0);
  const attn = e.map((v) => v / Z);
  const mass = new Map<string, number>();
  attn.forEach((a, j) => mass.set(tokens[j], (mass.get(tokens[j]) ?? 0) + a));
  let best = tokens[0], bm = -1;
  mass.forEach((v, k) => { if (v > bm) { bm = v; best = k; } });
  return { attn, pred: best, conf: bm };
}

export function InductionHeadViz() {
  const [i, setI] = useState(TEXT.length - 1);
  const r = useMemo(() => induction(TEXT, i), [i]);
  const next = i + 1 < TEXT.length ? TEXT[i + 1] : "(end of text)";
  return (
    <figure className="viz">
      <div className="viz-label" style={{ marginBottom: 6 }}>tap a word to make it the current position</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TEXT.map((w, j) => (
          <button key={j} type="button" onClick={() => setI(j)} className="mono"
            style={{ fontSize: 13, padding: "2px 6px", borderRadius: 4, cursor: "pointer", background: "none", color: "var(--text)",
              border: j === i ? "2px solid var(--danger)" : j === i - 1 ? "2px dashed var(--text-muted)" : "1px solid var(--border)",
              boxShadow: `inset 0 -${Math.round(r.attn[j] * 14)}px 0 var(--accent-soft)` }}
            aria-pressed={j === i}>
            {w}
          </button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "10px 0 6px" }} aria-live="polite">
        {`current "${TEXT[i]}": induction head copies "${r.pred}" (attention ${r.conf.toFixed(3)}); actual next word: ${next}`}
      </div>
      <figcaption className="viz-caption">
        The current word has a red border and its predecessor a dashed one. A previous-token head has written each
        word&apos;s predecessor into its vector; the induction head then searches for positions whose predecessor equals
        the current word, attends there (shaded) and copies that word as its guess for what comes next. In the repeated
        phrase near the end it predicts the continuation correctly. On a word seen only once it has no match, attention
        spreads evenly and the guess is meaningless. On the last &quot;a&quot;, which was followed by different words
        before, it splits between the candidates.
      </figcaption>
    </figure>
  );
}
