"use client";

import { useState } from "react";

function factor(lam: number, lr: number, beta: number) {
  const b = 1 + beta - lr * lam;
  const disc = b * b - 4 * beta;
  if (disc < 0) return Math.sqrt(beta);
  const s = Math.sqrt(disc);
  return Math.max(Math.abs((b + s) / 2), Math.abs((b - s) / 2));
}

/** Worst-case convergence factor on a quadratic with curvatures 1 to κ, against the learning rate, with and without momentum. */
export function MomentumRateViz() {
  const [kExp, setKExp] = useState(2);
  const [beta, setBeta] = useState(0.67);
  const kappa = 10 ** kExp;
  const worst = (lr: number, b: number) => Math.max(factor(1, lr, b), factor(kappa, lr, b));
  const W = 320, H = 170, eLo = -4, eHi = 0.5;
  const px = (e: number) => 34 + ((e - eLo) / (eHi - eLo)) * (W - 44);
  const py = (r: number) => 10 + (1 - Math.min(r, 1.2) / 1.2) * (H - 34);
  const curve = (b: number) => {
    const pts: string[] = [];
    for (let e = eLo; e <= eHi + 1e-9; e += 0.02) pts.push(`${px(e).toFixed(1)},${py(worst(10 ** e, b)).toFixed(1)}`);
    return pts.join(" ");
  };
  let bestGd = 2, bestM = 2;
  for (let e = eLo; e <= eHi; e += 0.005) {
    bestGd = Math.min(bestGd, worst(10 ** e, 0));
    bestM = Math.min(bestM, worst(10 ** e, beta));
  }
  const steps = (r: number) => (r < 1 ? Math.ceil(Math.log(1e-3) / Math.log(r)) : Infinity);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          κ = {Math.round(kappa)}
          <input type="range" min={0.5} max={3} step={0.1} value={kExp} onChange={(e) => setKExp(Number(e.target.value))} aria-label="condition number, log scale" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          β = {beta.toFixed(2)}
          <input type="range" min={0} max={0.99} step={0.01} value={beta} onChange={(e) => setBeta(Number(e.target.value))} aria-label="momentum" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Convergence factor against learning rate">
        {[0, 0.5, 1].map((r) => (
          <g key={r}>
            <line x1={34} x2={W - 10} y1={py(r)} y2={py(r)} stroke="var(--border)" strokeDasharray={r === 1 ? "4 3" : undefined} />
            <text x={30} y={py(r) + 4} textAnchor="end" className="viz-label">{r}</text>
          </g>
        ))}
        {[-4, -3, -2, -1, 0].map((e) => <text key={e} x={px(e)} y={H - 8} textAnchor="middle" className="viz-label">1e{e}</text>)}
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} points={curve(0)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(beta)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        best factor: GD {bestGd.toFixed(3)} ({steps(bestGd)} steps per 1000×), momentum {bestM.toFixed(3)} ({steps(bestM)} steps)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        On a quadratic with curvatures from 1 to κ, each step multiplies the error by at most this factor (lower is faster,
        above 1 diverges). Plain gradient descent (grey) is limited by the stiffest direction and can do no better than
        (κ − 1)/(κ + 1). With β = ((√κ − 1)/(√κ + 1))², momentum (blue) reaches (√κ − 1)/(√κ + 1): for κ = 100, 0.82 instead
        of 0.98, about ten times fewer steps.
      </figcaption>
    </figure>
  );
}
