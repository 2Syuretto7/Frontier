"use client";

import { useState } from "react";

const CORPUS: [string, number][] = [["low", 5], ["lower", 2], ["newest", 6], ["widest", 3], ["new", 4], ["slower", 2]];
const STEPS = [0, 1, 2, 4, 6, 10];

/** Byte-pair encoding on a tiny word-count corpus: the merges learned and the segmentation after each step. */
export function bpe(steps: number) {
  let words = CORPUS.map(([w, c]) => ({ parts: w.split(""), c }));
  const merges: string[] = [];
  for (let s = 0; s < steps; s++) {
    const counts = new Map<string, number>();
    for (const { parts, c } of words) for (let i = 0; i + 1 < parts.length; i++) {
      const k = `${parts[i]}\u0000${parts[i + 1]}`;
      counts.set(k, (counts.get(k) ?? 0) + c);
    }
    if (!counts.size) break;
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    const [a, b] = best.split("\u0000");
    merges.push(`${a}+${b}`);
    words = words.map(({ parts, c }) => {
      const out: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        if (i + 1 < parts.length && parts[i] === a && parts[i + 1] === b) { out.push(a + b); i++; } else out.push(parts[i]);
      }
      return { parts: out, c };
    });
  }
  const tokens = words.reduce((t, w) => t + w.parts.length * w.c, 0);
  return { words, merges, tokens };
}

export function BpeStepsViz() {
  const [si, setSi] = useState(2);
  const { words, merges, tokens } = bpe(STEPS[si]);
  const chars = CORPUS.reduce((t, [w, c]) => t + w.length * c, 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">merges</span>
        <div className="segmented" role="group" aria-label="Number of merges">
          {STEPS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={si === j} onClick={() => setSi(j)}>{v}</button>)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", justifyContent: "center", margin: "8px 0" }}>
        {words.map(({ parts, c }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {parts.map((p, j) => (
              <span key={j} className="mono" style={{ fontSize: 13, padding: "1px 4px", border: "1px solid var(--border)", borderRadius: 3, background: p.length > 1 ? "var(--accent-soft, transparent)" : "transparent", color: p.length > 1 ? "var(--accent)" : "var(--text)" }}>{p}</span>
            ))}
            <span className="viz-label" style={{ marginLeft: 3 }}>×{c}</span>
          </div>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        merges: {merges.length ? merges.join(", ") : "none"}; {tokens} tokens for {chars} characters
      </div>
      <figcaption className="viz-caption">
        Byte-pair encoding trained on six words with their counts. Each merge joins the most frequent adjacent pair of tokens, counted
        with the word frequencies, into a new token. Frequent endings and stems such as &quot;est&quot; and &quot;new&quot; become single
        tokens first, and the corpus shrinks by the merged pair&apos;s count at every step.
      </figcaption>
    </figure>
  );
}
