"use client";

import { useState } from "react";

type D = { F: (x: number) => number; Q: (u: number) => number; lo: number; hi: number; steps?: boolean };
const DISTS: Record<string, D> = {
  "Exponential(1)": { F: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), Q: (u) => -Math.log(1 - u), lo: 0, hi: 5 },
  logistic: { F: (x) => 1 / (1 + Math.exp(-x)), Q: (u) => Math.log(u / (1 - u)), lo: -5, hi: 5 },
  "die (discrete)": { F: (x) => Math.min(1, Math.max(0, Math.floor(x) / 6)), Q: (u) => Math.max(1, Math.ceil(u * 6 - 1e-12)), lo: 0, hi: 7, steps: true },
};

/** Inverse-CDF sampling: a uniform u on the vertical axis is mapped across to the CDF and down to x = F⁻¹(u). */
export function InverseCdfViz() {
  const [name, setName] = useState("Exponential(1)");
  const [k, setK] = useState(70);
  const d = DISTS[name];
  const u = k / 100;
  const x = Math.min(d.hi, Math.max(d.lo, d.Q(u)));
  const W = 320, H = 180;
  const X = (v: number) => 34 + ((v - d.lo) / (d.hi - d.lo)) * (W - 44);
  const Y = (v: number) => H - 22 - v * (H - 34);
  const pts: string[] = [];
  for (let i = 0; i <= 300; i++) {
    const v = d.lo + ((d.hi - d.lo) * i) / 300;
    pts.push(`${X(v).toFixed(1)},${Y(d.F(v)).toFixed(1)}`);
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(DISTS).map((n) => (
          <button key={n} type="button" className="seg" aria-pressed={name === n} onClick={() => setName(n)}>{n}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A CDF with a uniform value mapped to its quantile">
        <line x1={34} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={34} x2={34} y1={Y(0)} y2={Y(1)} stroke="var(--border)" />
        <text x={30} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={30} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts.join(" ")} />
        <line x1={34} x2={X(x)} y1={Y(u)} y2={Y(u)} stroke="var(--danger)" strokeDasharray="4 3" />
        <line x1={X(x)} x2={X(x)} y1={Y(u)} y2={Y(0)} stroke="var(--danger)" strokeDasharray="4 3" />
        <circle cx={34} cy={Y(u)} r={4} fill="var(--danger)" />
        <circle cx={X(x)} cy={Y(0)} r={4} fill="var(--danger)" />
        <text x={X(d.lo)} y={H - 6} textAnchor="middle" className="viz-label">{d.lo}</text>
        <text x={X(d.hi)} y={H - 6} textAnchor="middle" className="viz-label">{d.hi}</text>
      </svg>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          u = {u.toFixed(2)}
          <input type="range" min={1} max={99} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="uniform value" style={{ width: 150 }} />
        </label>
        <span className="mono" style={{ fontSize: 13 }}>x = F⁻¹(u) = {d.steps ? x.toFixed(0) : x.toFixed(4)}</span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Go across from u until you meet the CDF, then down. If u is uniform on (0, 1), the resulting x has CDF F, because x ≤
        t exactly when u ≤ F(t). Where F is steep, many values of u land in a short stretch of x: that is where the density
        is high. For a discrete variable F jumps, and every u inside a jump maps to the same value, so the rule is to take
        the smallest x with F(x) ≥ u.
      </figcaption>
    </figure>
  );
}
