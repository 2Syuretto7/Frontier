"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const RHO = [0, 0.1, 0.3, 0.6];
const SIZES = [5, 20];
const N = 400, REPS = 400;

/**
 * Benchmarks of N questions in clusters of size m (passages, documents, repositories). A question is answered correctly when
 * √ρ·c + √(1 − ρ)·e > −0.3, with c shared by its cluster and e its own, both N(0, 1). Over REPS benchmarks drawn afresh, returns
 * the actual spread of the score, the average naive and clustered standard errors, and how often each 95% interval covers the
 * true accuracy.
 */
export function clusterSim(rho: number, m: number, seed = 23) {
  const r = rand(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const truth = 0.6179;
  const C = N / m;
  const means: number[] = [];
  let naive = 0, clus = 0, cn = 0, cc = 0;
  for (let rep = 0; rep < REPS; rep++) {
    const sums: number[] = [];
    let tot = 0;
    for (let c = 0; c < C; c++) {
      const u = gauss();
      let s = 0;
      for (let i = 0; i < m; i++) if (Math.sqrt(rho) * u + Math.sqrt(1 - rho) * gauss() > -0.3) s++;
      sums.push(s); tot += s;
    }
    const mean = tot / N;
    const se0 = Math.sqrt((mean * (1 - mean)) / (N - 1));
    const se1 = Math.sqrt(sums.reduce((a, s) => a + (s - m * mean) ** 2, 0)) / N;
    naive += se0; clus += se1; means.push(mean);
    if (Math.abs(mean - truth) <= 1.96 * se0) cn++;
    if (Math.abs(mean - truth) <= 1.96 * se1) cc++;
  }
  const mu = means.reduce((a, b) => a + b, 0) / REPS;
  const sd = Math.sqrt(means.reduce((a, b) => a + (b - mu) ** 2, 0) / (REPS - 1));
  return { sd, naive: naive / REPS, clustered: clus / REPS, coverNaive: cn / REPS, coverClustered: cc / REPS };
}

export function ClusterSeViz() {
  const [k, setK] = useState(2);
  const [m, setM] = useState(1);
  const res = useMemo(() => clusterSim(RHO[k], SIZES[m]), [k, m]);
  const bars = [
    { name: "actual spread", v: res.sd, col: "var(--text-muted)" },
    { name: "naive standard error", v: res.naive, col: "var(--danger)" },
    { name: "clustered standard error", v: res.clustered, col: "var(--accent)" },
  ];
  const W = 330, H = 120, X0 = 150, PW = 170, MAX = 0.08;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Shared difficulty within a cluster">
          {["no sharing", "low", "medium", "high"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Questions per cluster">
          {SIZES.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{s} per cluster</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Actual spread of the score against naive and clustered standard errors">
        {bars.map((b, i) => (
          <g key={b.name}>
            <text x={X0 - 6} y={20 + i * 32} textAnchor="end" className="viz-label">{b.name}</text>
            <rect x={X0} y={8 + i * 32} width={(Math.min(b.v, MAX) / MAX) * PW} height={16} style={{ fill: b.col }} />
            <text x={X0 + (Math.min(b.v, MAX) / MAX) * PW + 4} y={20 + i * 32} className="viz-label">{(100 * b.v).toFixed(1)}</text>
          </g>
        ))}
        <text x={X0} y={H - 6} className="viz-label">percentage points</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        95% intervals covering the truth: naive {(100 * res.coverNaive).toFixed(0)}%, clustered {(100 * res.coverClustered).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        A 400-question benchmark built from clusters of related questions, drawn afresh {REPS} times. When questions in a cluster
        share difficulty, the score varies more than the naive formula assumes, and its intervals miss the truth far more often
        than 5% of the time. The clustered standard error tracks the actual spread. Larger clusters make the problem worse.
      </figcaption>
    </figure>
  );
}
