"use client";

import { useState } from "react";

const PI = [0.8, 0.2];
const A = [[0.9, 0.1], [0.2, 0.8]];
const B = [[0.7, 0.25, 0.05], [0.2, 0.5, 0.3]];
const OBS = ["fast", "slow", "timeout"];
const START = [0, 0, 1, 0, 2, 2, 1, 2, 0, 0, 1, 0];

function run(obs: number[]) {
  const T = obs.length;
  const alpha: number[][] = [], c: number[] = [];
  for (let t = 0; t < T; t++) {
    const a = [0, 1].map((j) => (t === 0 ? PI[j] : alpha[t - 1][0] * A[0][j] + alpha[t - 1][1] * A[1][j]) * B[j][obs[t]]);
    const s = a[0] + a[1];
    c.push(s); alpha.push(a.map((v) => v / s));
  }
  const beta: number[][] = Array.from({ length: T }, () => [1, 1]);
  for (let t = T - 2; t >= 0; t--) beta[t] = [0, 1].map((i) => (A[i][0] * B[0][obs[t + 1]] * beta[t + 1][0] + A[i][1] * B[1][obs[t + 1]] * beta[t + 1][1]) / c[t + 1]);
  const gamma = alpha.map((a, t) => { const g = [a[0] * beta[t][0], a[1] * beta[t][1]]; const s = g[0] + g[1]; return g.map((v) => v / s); });
  let d = [0, 1].map((j) => Math.log(PI[j]) + Math.log(B[j][obs[0]]));
  const back: number[][] = [];
  for (let t = 1; t < T; t++) {
    const nb: number[] = [], nd: number[] = [];
    for (let j = 0; j < 2; j++) {
      const c0 = d[0] + Math.log(A[0][j]), c1 = d[1] + Math.log(A[1][j]);
      nb.push(c0 >= c1 ? 0 : 1); nd.push(Math.max(c0, c1) + Math.log(B[j][obs[t]]));
    }
    back.push(nb); d = nd;
  }
  const path = [d[0] >= d[1] ? 0 : 1];
  for (let t = back.length - 1; t >= 0; t--) path.push(back[t][path[path.length - 1]]);
  path.reverse();
  return { alpha, gamma, path, ll: c.reduce((s, v) => s + Math.log(v), 0) };
}

/** A two-state hidden Markov model of a server that is healthy or degraded: click the observations to change them, and compare filtered and smoothed probabilities of being degraded with the Viterbi path. */
export function HmmPosteriorViz() {
  const [obs, setObs] = useState(START);
  const [smooth, setSmooth] = useState(true);
  const r = run(obs);
  const probs = (smooth ? r.gamma : r.alpha).map((g) => g[1]);
  const T = obs.length, W = 330, H = 130;
  const cw = (W - 20) / T;
  const Y = (p: number) => H - 20 - p * (H - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!smooth} onClick={() => setSmooth(false)}>filtered (forward only)</button>
        <button type="button" className="seg" aria-pressed={smooth} onClick={() => setSmooth(true)}>smoothed (forward-backward)</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", margin: "6px 0" }}>
        {obs.map((o, t) => (
          <button key={t} type="button" className="seg mono" style={{ fontSize: 11, padding: "2px 5px", minWidth: 0 }} aria-label={`observation ${t + 1}: ${OBS[o]}, click to change`} onClick={() => setObs(obs.map((v, i) => (i === t ? (v + 1) % 3 : v)))}>
            {OBS[o]}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of the degraded state at each time, with the Viterbi path">
        <line x1={10} x2={W - 10} y1={Y(0.5)} y2={Y(0.5)} stroke="var(--border)" strokeDasharray="2 3" />
        {probs.map((p, t) => (
          <g key={t}>
            <rect x={10 + t * cw + 3} y={Y(p)} width={cw - 6} height={Y(0) - Y(p)} fill="var(--accent)" opacity={0.6} />
            <circle cx={10 + t * cw + cw / 2} cy={H - 9} r={4} fill={r.path[t] ? "var(--danger)" : "var(--border)"} />
          </g>
        ))}
        <line x1={10} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={12} y={10} className="viz-label">P(degraded | observations)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        log p(observations) = {r.ll.toFixed(3)}; Viterbi path: {r.path.map((s) => (s ? "D" : "H")).join("")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A server is healthy (H) or degraded (D), and stays in its state with probability 0.9 or 0.8 each step. A healthy
        server answers fast 70% of the time; a degraded one is mostly slow or times out. Bars show the probability of being
        degraded at each step: filtered uses only observations up to that step, smoothed uses the whole sequence, so it
        reacts to evidence that comes later. The dots below mark the single most likely state sequence (Viterbi), which
        need not agree with the step-by-step most likely states.
      </figcaption>
    </figure>
  );
}
