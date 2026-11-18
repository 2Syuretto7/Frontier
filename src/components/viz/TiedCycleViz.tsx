"use client";

import { useMemo, useState } from "react";

const V = 3, D = 3, LR = 0.5, STEPS = 2000;
const PAIRS: [number, number][] = [[0, 1], [1, 2], [2, 0]];
const NAMES = ["A", "B", "C"];

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

/** Train a zero-layer model (logits = embedding times unembedding) on the cycle A→B→C→A, tied or untied. */
export function fitCycle(tied: boolean, seed = 5) {
  const g = gaussian(seed);
  const E = Array.from({ length: V }, () => Array.from({ length: D }, () => 0.1 * g()));
  const U = Array.from({ length: D }, () => Array.from({ length: V }, () => 0.1 * g()));
  const out = (k: number, c: number) => (tied ? E[c][k] : U[k][c]);
  const probs = () => E.map((e) => {
    const z = Array.from({ length: V }, (_, c) => e.reduce((s, ek, k) => s + ek * out(k, c), 0));
    const m = Math.max(...z), ex = z.map((q) => Math.exp(q - m)), s = ex.reduce((a, b) => a + b, 0);
    return ex.map((q) => q / s);
  });
  for (let t = 0; t < STEPS; t++) {
    const P = probs();
    const gE = E.map((r) => r.map(() => 0)), gU = U.map((r) => r.map(() => 0));
    for (const [x, y] of PAIRS) {
      const G = P[x].map((p, c) => (p - (c === y ? 1 : 0)) / PAIRS.length);
      for (let c = 0; c < V; c++) for (let k = 0; k < D; k++) {
        gE[x][k] += G[c] * out(k, c);
        if (tied) gE[c][k] += G[c] * E[x][k]; else gU[k][c] += G[c] * E[x][k];
      }
    }
    for (let i = 0; i < V; i++) for (let k = 0; k < D; k++) E[i][k] -= LR * gE[i][k];
    if (!tied) for (let k = 0; k < D; k++) for (let c = 0; c < V; c++) U[k][c] -= LR * gU[k][c];
  }
  const P = probs();
  const pCorrect = PAIRS.reduce((s, [x, y]) => s + P[x][y], 0) / PAIRS.length;
  return { P, pCorrect, norms: E.map((e) => Math.hypot(...e)) };
}

export function TiedCycleViz() {
  const [tied, setTied] = useState(true);
  const run = useMemo(() => fitCycle(tied), [tied]);
  const cell = 64, X0 = 40, Y0 = 30;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={tied} onClick={() => setTied(true)}>tied: U = Eᵀ</button>
        <button type="button" className="seg" aria-pressed={!tied} onClick={() => setTied(false)}>untied</button>
      </div>
      <svg viewBox={`0 0 ${X0 + 3 * cell + 10} ${Y0 + 3 * cell + 10}`} style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }} role="img" aria-label="Predicted next-token probabilities for each current token">
        {NAMES.map((n, c) => (
          <text key={`c${n}`} x={X0 + c * cell + cell / 2} y={Y0 - 10} textAnchor="middle" className="viz-label">{`next ${n}`}</text>
        ))}
        {NAMES.map((n, r) => (
          <text key={`r${n}`} x={X0 - 8} y={Y0 + r * cell + cell / 2 + 4} textAnchor="end" className="viz-label">{n}</text>
        ))}
        {run.P.map((row, r) => row.map((p, c) => (
          <g key={`${r}${c}`}>
            <rect x={X0 + c * cell} y={Y0 + r * cell} width={cell - 2} height={cell - 2} fill="var(--accent)" fillOpacity={0.1 + 0.85 * p} stroke={PAIRS[r][1] === c ? "var(--danger)" : "var(--border)"} strokeWidth={PAIRS[r][1] === c ? 2.5 : 1} />
            <text x={X0 + c * cell + cell / 2 - 1} y={Y0 + r * cell + cell / 2 + 4} textAnchor="middle" className="mono" style={{ fontSize: 13 }} fill="var(--text)">{p.toFixed(2)}</text>
          </g>
        )))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`mean probability of the correct next token ${run.pCorrect.toFixed(2)}; embedding norms ${run.norms.map((n) => n.toFixed(2)).join(", ")}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A model with no layers at all, whose logits are the input token&apos;s embedding times the unembedding, trained on
        the cycle A → B → C → A. Red outlines mark the correct next token. With separate matrices it learns the cycle
        exactly. With tied matrices a token&apos;s score for itself is its squared norm, and a token can rank another above
        itself only if the other has a larger norm, which no cycle allows; here training stalls at uniform predictions.
      </figcaption>
    </figure>
  );
}
