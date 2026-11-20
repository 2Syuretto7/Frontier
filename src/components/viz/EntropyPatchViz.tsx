"use client";

import { useState } from "react";

const TRAIN = "the model reads the text one byte at a time and the bytes of common words are easy to predict once the first letters are seen, while the start of each new word is hard to predict. the next word could be almost anything, but the rest of a word is often fixed by its first few letters. ";
const TEXT = "the start of each word is hard to predict";
const THRESH = [1.0, 2.0, 3.0];

/** Entropy in bits of the next character under a two-character context model trained on TRAIN, backing off to one character. */
export function entropies(text: string) {
  const ctx2 = new Map<string, Map<string, number>>(), ctx1 = new Map<string, Map<string, number>>();
  const add = (m: Map<string, Map<string, number>>, k: string, c: string) => {
    const row = m.get(k) ?? new Map<string, number>();
    row.set(c, (row.get(c) ?? 0) + 1);
    m.set(k, row);
  };
  for (let i = 2; i < TRAIN.length; i++) { add(ctx2, TRAIN.slice(i - 2, i), TRAIN[i]); add(ctx1, TRAIN[i - 1], TRAIN[i]); }
  const H = (row?: Map<string, number>) => {
    if (!row) return 4.5;
    const t = [...row.values()].reduce((a, b) => a + b, 0);
    return [...row.values()].reduce((a, c) => a + (c / t) * Math.log2(t / c), 0);
  };
  return Array.from(text, (_, i) => (i < 2 ? 4.5 : ctx2.has(text.slice(i - 2, i)) ? H(ctx2.get(text.slice(i - 2, i))) : H(ctx1.get(text[i - 1]))));
}

export function EntropyPatchViz() {
  const [ti, setTi] = useState(1);
  const h = entropies(TEXT);
  const starts = h.map((v, i) => i === 0 || v > THRESH[ti]);
  const nPatches = starts.filter(Boolean).length;
  const CW = 7.6, X0 = 6, W = 330, BASE = 70, HS = 13;
  let patch = -1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">new patch above</span>
        <div className="segmented" role="group" aria-label="Entropy threshold">
          {THRESH.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={ti === j} onClick={() => setTi(j)}>{`${v} bits`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${BASE + 22}`} style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto" }} role="img" aria-label="Next-character entropy and patches">
        <line x1={X0} x2={X0 + TEXT.length * CW} y1={BASE - THRESH[ti] * HS} y2={BASE - THRESH[ti] * HS} stroke="var(--text)" strokeDasharray="3 3" />
        {Array.from(TEXT).map((ch, i) => {
          if (starts[i]) patch++;
          const fill = patch % 2 === 0 ? "var(--accent)" : "var(--text-muted)";
          return (
            <g key={i}>
              <rect x={X0 + i * CW + 0.5} y={BASE - Math.min(h[i], 4.5) * HS} width={CW - 1} height={Math.min(h[i], 4.5) * HS} style={{ fill }} opacity={0.55} />
              <text x={X0 + i * CW + CW / 2} y={BASE + 14} textAnchor="middle" className="mono" style={{ fontSize: 11, fill: starts[i] ? "var(--accent)" : "var(--text)" }}>{ch === " " ? "␣" : ch}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {TEXT.length} bytes in {nPatches} patches, {(TEXT.length / nPatches).toFixed(1)} bytes per patch on average
      </div>
      <figcaption className="viz-caption">
        Bars show how uncertain a small character model is about each next character, in bits; a new patch starts wherever the
        uncertainty is above the dashed threshold, and patches alternate in colour. Hard-to-predict characters, typically the first
        letters of words, open patches, and the predictable rest of a word joins them, so compute follows information.
      </figcaption>
    </figure>
  );
}
