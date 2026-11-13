"use client";

import { useState } from "react";

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DISTS: Record<string, { xs: number[]; p: (x: number) => number }> = {
  "one die": { xs: range(1, 6), p: () => 1 / 6 },
  "sum of two dice": { xs: range(2, 12), p: (x) => (6 - Math.abs(x - 7)) / 36 },
  "max of two dice": { xs: range(1, 6), p: (x) => (2 * x - 1) / 36 },
  "geometric(1/3)": { xs: range(1, 12), p: (x) => Math.pow(2 / 3, x - 1) / 3 },
};

/** A pmf and its CDF: the CDF is a staircase whose jump at x is P(X = x). */
export function PmfCdfViz() {
  const [name, setName] = useState("max of two dice");
  const [t, setT] = useState(40);
  const d = DISTS[name];
  const lo = d.xs[0] - 1, hi = d.xs[d.xs.length - 1] + 1;
  const W = 320, H = 200;
  const X = (x: number) => 30 + ((x - lo) / (hi - lo)) * (W - 40);
  const pmax = Math.max(...d.xs.map(d.p));
  const Yp = (v: number) => 80 - (v / pmax) * 64;
  const Yc = (v: number) => 186 - v * 80;
  const x0 = lo + (t / 100) * (hi - lo);
  let F = 0;
  const steps: string[] = [`${X(lo).toFixed(1)},${Yc(0).toFixed(1)}`];
  d.xs.forEach((x) => {
    steps.push(`${X(x).toFixed(1)},${Yc(F).toFixed(1)}`);
    F += d.p(x);
    steps.push(`${X(x).toFixed(1)},${Yc(F).toFixed(1)}`);
  });
  steps.push(`${X(hi).toFixed(1)},${Yc(F).toFixed(1)}`);
  const Fx = d.xs.filter((x) => x <= x0 + 1e-9).reduce((s, x) => s + d.p(x), 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(DISTS).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={name === k} onClick={() => setName(k)}>{k}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Probability mass function above, cumulative distribution function below">
        <text x={4} y={14} className="viz-label">pmf</text>
        <text x={4} y={110} className="viz-label">CDF</text>
        {d.xs.map((x) => (
          <g key={x}>
            <line x1={X(x)} x2={X(x)} y1={80} y2={Yp(d.p(x))} stroke={x <= x0 + 1e-9 ? "var(--accent)" : "var(--text-muted)"} strokeWidth={4} />
            <text x={X(x)} y={94} textAnchor="middle" className="viz-label">{x}</text>
          </g>
        ))}
        <line x1={30} x2={W - 10} y1={Yc(0)} y2={Yc(0)} stroke="var(--border)" />
        <line x1={30} x2={W - 10} y1={Yc(1)} y2={Yc(1)} stroke="var(--border)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={steps.join(" ")} />
        <line x1={X(x0)} x2={X(x0)} y1={20} y2={Yc(0)} stroke="var(--danger)" strokeDasharray="4 3" />
        <circle cx={X(x0)} cy={Yc(Fx)} r={4} fill="var(--danger)" />
      </svg>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x = {x0.toFixed(2)}
          <input type="range" min={0} max={100} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="point at which to evaluate the CDF" style={{ width: 160 }} />
        </label>
        <span className="mono" style={{ fontSize: 13 }}>F(x) = P(X ≤ x) = {Fx.toFixed(4)}</span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        F(x) adds up the mass at every value up to and including x, the highlighted bars. It is flat between possible values
        and jumps by P(X = k) at each value k, taking the upper value at the jump (right-continuity). For the maximum of two
        dice, F(k) = (k/6)², and the pmf is read off as the jumps: (2k − 1)/36.
      </figcaption>
    </figure>
  );
}
