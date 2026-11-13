"use client";

import { useState } from "react";

const LR = 0.01;

/** How much of each curvature direction gradient descent has fitted after t steps, against the ridge filter with λ = 1/(ηt). */
export function EarlyStopFilterViz() {
  const [tExp, setTExp] = useState(3);
  const t = Math.round(10 ** tExp);
  const lam = 1 / (LR * t);
  const gd = (h: number) => 1 - (1 - LR * h) ** t;
  const ridge = (h: number) => h / (h + lam);
  const W = 320, H = 170, lo = -3, hi = 2;
  const px = (e: number) => 34 + ((e - lo) / (hi - lo)) * (W - 44);
  const py = (f: number) => 10 + (1 - f) * (H - 34);
  const curve = (f: (h: number) => number) => {
    const pts: string[] = [];
    for (let e = lo; e <= hi + 1e-9; e += 0.02) pts.push(`${px(e).toFixed(1)},${py(f(10 ** e)).toFixed(1)}`);
    return pts.join(" ");
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          steps t = {t}
          <input type="range" min={0} max={5} step={0.1} value={tExp} onChange={(e) => setTExp(Number(e.target.value))} aria-label="number of steps, log scale" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Fraction fitted against curvature">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={34} x2={W - 10} y1={py(f)} y2={py(f)} stroke="var(--border)" />
            <text x={30} y={py(f) + 4} textAnchor="end" className="viz-label">{f}</text>
          </g>
        ))}
        {[-3, -2, -1, 0, 1, 2].map((e) => <text key={e} x={px(e)} y={H - 8} textAnchor="middle" className="viz-label">1e{e}</text>)}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(gd)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 3" points={curve(ridge)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        η = {LR}, matching ridge λ = 1/(ηt) = {lam.toPrecision(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient descent from 0 on least squares fits each eigen-direction of the data's curvature, h, by the fraction 1 −
        (1 − ηh)^t (blue). Steep directions are fitted within a few steps; flat ones, often noise, take about 1/(ηh) steps.
        Ridge regression shrinks direction h by h/(h + λ) (red, dashed), and with λ = 1/(ηt) the two curves nearly coincide.
        Stopping early is choosing a ridge strength.
      </figcaption>
    </figure>
  );
}
