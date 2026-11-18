"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const CHAINS: { name: string; P: number[][]; pi0: number; note: string }[] = [
  { name: "aperiodic", P: [[0.5, 0.5, 0, 0], [0.25, 0.5, 0.25, 0], [0, 0.25, 0.5, 0.25], [0, 0, 0.5, 0.5]], pi0: 1 / 6, note: "distribution and time average both settle" },
  { name: "periodic", P: [[0, 1, 0, 0], [0.5, 0, 0.5, 0], [0, 0.5, 0, 0.5], [0, 0, 1, 0]], pi0: 1 / 6, note: "distribution oscillates for ever, but the time average still converges" },
  { name: "reducible", P: [[0.5, 0.5, 0, 0], [0.5, 0.5, 0, 0], [0, 0, 0.5, 0.5], [0, 0, 0.5, 0.5]], pi0: 0.25, note: "the chain never leaves the half it starts in, so both curves settle at 0.5, and a start in the other half would give 0; the long-run answer depends on the start" },
];
const T = 200;

export function distTrace(P: number[][]) {
  let d = [1, 0, 0, 0];
  const out = [d[0]];
  for (let t = 1; t <= T; t++) {
    d = [0, 1, 2, 3].map((j) => d.reduce((s, v, i) => s + v * P[i][j], 0));
    out.push(d[0]);
  }
  return out;
}

export function avgTrace(P: number[][], seed: number) {
  const r = makeRng(seed);
  let x = 0, hits = 0;
  const out: number[] = [];
  for (let t = 1; t <= T; t++) {
    if (x === 0) hits++;
    out.push(hits / t);
    let u = r(), j = 0;
    while (j < 3 && u >= P[x][j]) { u -= P[x][j]; j++; }
    x = j;
  }
  return out;
}

/** Convergence in distribution versus convergence of time averages, for three four-state chains started in state 0. */
export function ErgodicityViz() {
  const [k, setK] = useState(0);
  const [avg, setAvg] = useState<number[]>([]);
  useEffect(() => setAvg(avgTrace(CHAINS[k].P, 4)), [k]);
  const c = CHAINS[k];
  const dist = distTrace(c.P);
  const W = 330, H = 170, X0 = 30, PW = W - 40, PH = 140;
  const sx = (t: number) => X0 + (t / T) * PW, sy = (p: number) => 10 + (1 - p) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {CHAINS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === k} onClick={() => setK(i)}>{q.name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of being in state 0 and the running fraction of time spent there, over 200 steps">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(c.pi0)} x2={X0 + PW} y2={sy(c.pi0)} stroke="var(--danger)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1} points={dist.map((p, t) => `${sx(t)},${sy(p)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={avg.map((p, t) => `${sx(t + 1)},${sy(p)}`).join(" ")} />
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">step 200</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Grey: P(X_t = 0) for a chain started at 0. Colour: the fraction of the first t steps one simulated run spends in 0.
        Dashed: the stationary probability π(0) (for the reducible chain, which has many stationary distributions, the one
        spreading mass evenly). This chain is {c.name}: {c.note}.
      </figcaption>
    </figure>
  );
}
