"use client";

import { useMemo, useState } from "react";

const K = 10, STEPS = 2 ** K, PATHS = 200;

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Largest |B(pi_k t) - B(pi_{k-1} t)| over t, where pi_k rounds t down to the grid of spacing 2^-k. */
function levelIncrements(p: number[]) {
  return Array.from({ length: K }, (_, i) => {
    const k = i + 1, step = STEPS / 2 ** k;
    let m = 0;
    for (let j = 0; j < 2 ** k; j++) {
      const t = j * step, parent = Math.floor(j / 2) * 2 * step;
      m = Math.max(m, Math.abs(p[t] - p[parent]));
    }
    return m;
  });
}

/** PATHS Brownian paths on a grid of STEPS steps; the first path, the mean largest increment at each level, and the union bounds. */
export function simulate() {
  const r = rand(2024);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let first: number[] = [];
  const mean = new Array(K).fill(0);
  for (let s = 0; s < PATHS; s++) {
    const p = [0];
    for (let i = 0; i < STEPS; i++) p.push(p[i] + g() / Math.sqrt(STEPS));
    if (s === 0) first = p;
    levelIncrements(p).forEach((m, i) => (mean[i] += m / PATHS));
  }
  const bound = Array.from({ length: K }, (_, i) => 2 ** (-(i + 1) / 2) * Math.sqrt(2 * Math.log(2 ** (i + 2))));
  return { first, mean, bound };
}

export function DyadicChainViz() {
  const [k, setK] = useState(3);
  const { first, mean, bound } = useMemo(() => simulate(), []);
  const W = 330, X0 = 28, PW = W - 38, PH = 110, Y0 = 8, B0 = Y0 + PH + 30, BH = 90, H = B0 + BH + 24;
  const lo = Math.min(...first), hi = Math.max(...first);
  const sx = (i: number) => X0 + (i / STEPS) * PW;
  const sy = (v: number) => Y0 + PH - ((v - lo) / (hi - lo || 1)) * PH;
  const fine = first.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const step = STEPS / 2 ** k;
  let coarse = "";
  for (let j = 0; j < 2 ** k; j++) {
    const v = first[j * step];
    coarse += `${j ? "L" : "M"}${sx(j * step).toFixed(1)},${sy(v).toFixed(1)} L${sx((j + 1) * step).toFixed(1)},${sy(v).toFixed(1)} `;
  }
  const BMAX = 1.2, bw = PW / K;
  const by = (v: number) => B0 + BH - (Math.min(v, BMAX) / BMAX) * BH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="dc-k">level k = {k} (grid of {2 ** k} points)</label>
        <input id="dc-k" type="range" min={1} max={K} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A Brownian path, its dyadic approximation, and the size of the chaining increments at each level">
        <path d={fine} fill="none" stroke="var(--text-muted)" strokeWidth={0.8} />
        <path d={coarse} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        <text x={X0} y={B0 - 8} className="viz-label">mean largest increment at each level</text>
        {mean.map((m, i) => (
          <g key={i}>
            <rect x={X0 + i * bw + 3} y={by(m)} width={bw - 6} height={B0 + BH - by(m)} fill="var(--accent)" opacity={i + 1 === k ? 1 : 0.45} />
            <line x1={X0 + i * bw + 1} x2={X0 + (i + 1) * bw - 1} y1={by(bound[i])} y2={by(bound[i])} stroke="var(--danger)" strokeWidth={2} />
            <text x={X0 + (i + 0.5) * bw} y={B0 + BH + 14} textAnchor="middle" className="viz-label">{i + 1}</text>
          </g>
        ))}
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 4} y={by(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`level ${k}: mean largest increment ${mean[k - 1].toFixed(3)}, union bound ${bound[k - 1].toFixed(3)}; sum of all ${K} bounds ${bound.reduce((a, b) => a + b, 0).toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        Top: a Brownian path on 1024 steps (grey) and its approximation that rounds each time down to the grid of 2^k
        points (blue). Bottom: for each level, the largest change between the level-k and level-(k − 1) approximations,
        averaged over 200 paths, with the union bound 2^(−k/2)√(2 log 2^(k+1)) (red). There are more increments at finer
        levels, but each is smaller, and the bounds shrink geometrically, so their sum converges, to about 5.7, however fine the
        grid, whereas a single union bound over N grid points is √(2 log N), which grows without limit.
      </figcaption>
    </figure>
  );
}
