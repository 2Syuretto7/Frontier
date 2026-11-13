"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const NB = [[1, 2, 3], [0, 2], [0, 1], [0]];
const PI = [3 / 8, 2 / 8, 2 / 8, 1 / 8];
const POS: [number, number][] = [[70, 70], [30, 130], [110, 130], [70, 15]];
const MAXN = 20000;

/** A random walk on a small graph: the fraction of time spent at each node approaches the stationary distribution, proportional to degree. */
export function OccupationViz() {
  const [k, setK] = useState(10);
  const [seed, setSeed] = useState(2);
  const visits = useMemo(() => {
    const r = makeRng(seed);
    const counts = new Int32Array(4 * (MAXN + 1));
    let x = 0;
    counts[0] = 1;
    for (let t = 1; t <= MAXN; t++) {
      const nb = NB[x];
      x = nb[Math.min(nb.length - 1, Math.floor(r() * nb.length))];
      for (let i = 0; i < 4; i++) counts[4 * t + i] = counts[4 * (t - 1) + i] + (i === x ? 1 : 0);
    }
    return counts;
  }, [seed]);
  const n = Math.round(Math.pow(10, 1 + (k * Math.log10(MAXN / 10)) / 40));
  const frac = [0, 1, 2, 3].map((i) => visits[4 * n + i] / (n + 1));
  const tv = 0.5 * frac.reduce((s, f, i) => s + Math.abs(f - PI[i]), 0);
  const W = 330, H = 160, bx = 160, bw = 34;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          steps = {n}
          <input type="range" min={0} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of steps, log scale" style={{ width: 160 }} />
        </label>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>new walk</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A four-node graph and bars comparing time fractions with the stationary distribution">
        {NB.map((nb, i) => nb.filter((j) => j > i).map((j) => (
          <line key={`${i}-${j}`} x1={POS[i][0]} y1={POS[i][1]} x2={POS[j][0]} y2={POS[j][1]} stroke="var(--border)" strokeWidth={1.5} />
        )))}
        {POS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={6 + 30 * frac[i]} fill="var(--accent-soft)" stroke="var(--accent)" />
            <text x={x} y={y + 4} textAnchor="middle" className="viz-label">{i}</text>
          </g>
        ))}
        {[0, 1, 2, 3].map((i) => {
          const x = bx + i * (bw + 8);
          const sc = (H - 34) / 0.5;
          return (
            <g key={i}>
              <rect x={x} y={H - 20 - frac[i] * sc} width={bw} height={frac[i] * sc} fill="var(--accent)" opacity={0.6} />
              <line x1={x - 3} x2={x + bw + 3} y1={H - 20 - PI[i] * sc} y2={H - 20 - PI[i] * sc} stroke="var(--danger)" strokeWidth={2} />
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" className="viz-label">{i}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        time fractions {frac.map((f) => f.toFixed(3)).join(", ")}; total variation from π {tv.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        At each step the walker moves to a uniformly chosen neighbour. The bars show the fraction of time spent at each node
        so far; the red ticks are the stationary distribution π = degree / (2 × edges) = (3, 2, 2, 1)/8. The ergodic theorem
        says the fractions converge to π, at roughly the 1/√n rate of Monte Carlo.
      </figcaption>
    </figure>
  );
}
