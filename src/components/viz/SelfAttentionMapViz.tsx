"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const TOKENS = ["the", "dog", "saw", "the", "cat", "and", "the", "dog"];
const D = 16;

export function sinusoidal(n: number, d: number) {
  return Array.from({ length: n }, (_, p) =>
    Array.from({ length: d }, (_, j) => {
      const ang = p / 10000 ** ((j - (j % 2)) / d);
      return j % 2 ? Math.cos(ang) : Math.sin(ang);
    }),
  );
}

/** Self-attention weights with W_q = W_k = I on token embeddings (plus positions), optionally causally masked. */
export function attentionMap(withPos: boolean, causal: boolean, seed = 9) {
  const z = makeNormal(makeRng(seed)), emb = new Map<string, number[]>();
  for (const t of TOKENS) if (!emb.has(t)) emb.set(t, Array.from({ length: D }, () => z()));
  const pe = sinusoidal(TOKENS.length, D);
  const X = TOKENS.map((t, p) => emb.get(t)!.map((v, j) => v + (withPos ? 1.5 * pe[p][j] : 0)));
  return X.map((q, i) => {
    const s = X.map((k, j) => (causal && j > i ? -Infinity : q.reduce((a, v, m) => a + v * k[m], 0) / Math.sqrt(D)));
    const mx = Math.max(...s), e = s.map((v) => Math.exp(v - mx)), tot = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / tot);
  });
}

export function SelfAttentionMapViz() {
  const [pos, setPos] = useState(false);
  const [causal, setCausal] = useState(false);
  const [A, setA] = useState<number[][] | null>(null);
  useEffect(() => setA(attentionMap(pos, causal)), [pos, causal]);
  const n = TOKENS.length, C = 28, L = 44, T = 54, W = L + n * C + 4, H = T + n * C + 4;
  const same = A ? A[1].every((v, j) => Math.abs(v - A[7][j]) < 1e-9) : false;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={pos} onClick={() => setPos(!pos)}>positional encoding</button>
        <button type="button" className="seg" aria-pressed={causal} onClick={() => setCausal(!causal)}>causal mask</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Self-attention weight matrix for an eight-word sentence">
        {TOKENS.map((t, i) => (
          <g key={i}>
            <text x={L - 4} y={T + i * C + C / 2 + 4} textAnchor="end" className="viz-label">{t}</text>
            <text x={L + i * C + C / 2} y={T - 6} textAnchor="end" className="viz-label" transform={`rotate(-50 ${L + i * C + C / 2} ${T - 6})`}>{t}</text>
          </g>
        ))}
        {A?.map((row, i) => row.map((w, j) => (
          <rect key={`${i}-${j}`} x={L + j * C} y={T + i * C} width={C - 2} height={C - 2} fill="var(--accent)" fillOpacity={Math.max(0.03, w)} stroke="var(--border)" strokeWidth={0.5} />
        )))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {A ? `rows for the two copies of "dog" are ${same ? "identical" : "different"}; "dog" (row 2) puts ${(100 * A[1][1]).toFixed(0)}% on itself` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Row i shows how the word on the left distributes its attention over the words along the top (darker is more), with
        queries and keys equal to the word vectors. Without positions, repeated words have identical rows: self-attention
        cannot tell the first &quot;dog&quot; from the last except through the mask. Adding sinusoidal position vectors breaks
        the tie. The causal mask blanks the upper triangle, so each word sees only itself and earlier words.
      </figcaption>
    </figure>
  );
}
