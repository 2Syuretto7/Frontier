"use client";

import { useState } from "react";

const pstar = (u: number) => Math.max(0, 1 - u) ** 2;

/** Optimal value of minimising x² subject to x ≥ 1 − u as the constraint is loosened or tightened, against the bound from the multiplier λ* = 2. */
export function SensitivityViz() {
  const [u, setU] = useState(0.3);
  const us = Array.from({ length: 241 }, (_, i) => -1 + i / 80);
  const W = 300, H = 200;
  const X = (v: number) => 20 + ((v + 1) / 3) * (W - 32);
  const Y = (v: number) => H - 16 - ((Math.min(Math.max(v, -2.2), 4.2) + 2.2) / 6.4) * (H - 26);
  const bound = (v: number) => 1 - 2 * v;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          perturbation u = {u.toFixed(2)}
          <input type="range" min={-1} max={2} step={0.05} value={u} onChange={(e) => setU(Number(e.target.value))} aria-label="constraint perturbation" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Perturbed optimal value and its linear lower bound">
        <line x1={X(-1)} x2={X(2)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={8} y2={H - 14} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} strokeDasharray="5 3" points={us.map((v) => `${X(v).toFixed(1)},${Y(bound(v)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={us.map((v) => `${X(v).toFixed(1)},${Y(pstar(v)).toFixed(1)}`).join(" ")} />
        <circle cx={X(u)} cy={Y(pstar(u))} r={4} fill="var(--accent)" />
        <circle cx={X(u)} cy={Y(bound(u))} r={3} fill="var(--danger)" />
        <circle cx={X(0)} cy={Y(1)} r={3} fill="var(--text)" />
        <text x={X(2)} y={Y(0) - 4} textAnchor="end" className="viz-label">u</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        p*(u) = {pstar(u).toFixed(3)}; bound p*(0) − λ*u = {bound(u).toFixed(3)}; {u > 0 ? "loosened" : u < 0 ? "tightened" : "unperturbed"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The constraint 1 − x ≤ 0 is perturbed to 1 − x ≤ u. Positive u loosens it and lowers the optimal value p*(u) (solid
        curve); negative u tightens it and raises the value. The dual optimal multiplier λ* = 2 gives the line p*(0) − λ*u
        (dashed), which lies below the curve for every u, not just small ones, and touches it at u = 0 with the same slope:
        λ* is the rate at which the optimal value falls as the constraint is relaxed. Once u ≥ 1 the constraint no longer
        binds and the value stays at 0.
      </figcaption>
    </figure>
  );
}
