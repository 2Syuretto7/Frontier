"use client";

import { useState } from "react";

const NS = [365, 10000, 65536];

/** Probability of at least one collision among k uniform draws from n values: exact product against 1 − exp(−k(k−1)/2n). */
export function CollisionViz() {
  const [ni, setNi] = useState(0);
  const n = NS[ni];
  const kmax = Math.ceil(3.5 * Math.sqrt(n));
  const [frac, setFrac] = useState(0.33);
  const k = Math.max(1, Math.round(frac * kmax));
  const exact: number[] = [0];
  let logq = 0;
  for (let j = 1; j <= kmax; j++) {
    exact.push(1 - Math.exp(logq));
    logq += Math.log(1 - Math.min(j, n) / n);
    if (j >= n) logq = -Infinity;
  }
  // exact[j] = P(collision among j draws) = 1 − Π_{i<j}(1 − i/n)
  const approx = (j: number) => 1 - Math.exp((-j * (j - 1)) / (2 * n));
  const W = 320, H = 160;
  const X = (j: number) => 34 + (j / kmax) * (W - 44);
  const Y = (p: number) => H - 22 - p * (H - 34);
  const pts = (f: (j: number) => number) => {
    const out: string[] = [];
    for (let s = 0; s <= 120; s++) {
      const j = Math.round((s / 120) * kmax);
      out.push(`${X(j).toFixed(1)},${Y(f(j)).toFixed(1)}`);
    }
    return out.join(" ");
  };
  const half = exact.findIndex((p) => p >= 0.5);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {NS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>n = {v}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          k = {k}
          <input type="range" min={1} max={100} value={Math.round(frac * 100)} onChange={(e) => setFrac(Number(e.target.value) / 100)} aria-label="number of draws" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Collision probability against number of draws">
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={34} x2={W - 10} y1={Y(p)} y2={Y(p)} stroke="var(--border)" />
            <text x={30} y={Y(p) + 4} textAnchor="end" className="viz-label">{p}</text>
          </g>
        ))}
        <text x={X(kmax)} y={H - 6} textAnchor="end" className="viz-label">k = {kmax}</text>
        <polyline fill="none" stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1.6} points={pts(approx)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts((j) => exact[j])} />
        <circle cx={X(k)} cy={Y(exact[k])} r={4} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        exact {exact[k].toFixed(4)}, approximation {approx(k).toFixed(4)}; 50% first reached at k = {half}, √n = {Math.sqrt(n).toFixed(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Blue: the exact chance that k draws from n equally likely values contain a repeat. Red dashes: 1 − exp(−k(k−1)/2n),
        from 1 − x ≈ e^(−x). The curves nearly coincide, and the 50% point sits near 1.18√n for every n: collisions arrive
        after about √n draws, not n/2. This is why a 64-bit hash collides after about four billion items.
      </figcaption>
    </figure>
  );
}
