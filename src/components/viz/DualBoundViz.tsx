"use client";

import { useState } from "react";

const f0 = (x: number) => x * x;
const f1 = (x: number) => 1 - x;
const g = (l: number) => l - (l * l) / 4;

/** The Lagrangian of minimising x² subject to x ≥ 1: for each λ ≥ 0 its minimum over all x is a lower bound on the optimal value 1. */
export function DualBoundViz() {
  const [lam, setLam] = useState(1);
  const xs = Array.from({ length: 161 }, (_, i) => -2 + i / 40);
  const L = (x: number) => f0(x) + lam * f1(x);
  const xmin = lam / 2;
  const W = 330, H = 190, half = 170;
  const ylo = -1.5, yhi = 5;
  const Y = (v: number) => H - 14 - ((Math.min(Math.max(v, ylo), yhi) - ylo) / (yhi - ylo)) * (H - 24);
  const X1 = (x: number) => 10 + ((x + 2) / 4) * (half - 20);
  const X2 = (l: number) => half + 12 + (l / 5) * (W - half - 22);
  const ls = Array.from({ length: 101 }, (_, i) => i / 20);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          multiplier λ = {lam.toFixed(2)}
          <input type="range" min={0} max={5} step={0.05} value={lam} onChange={(e) => setLam(Number(e.target.value))} aria-label="Lagrange multiplier" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Lagrangian curves and the dual function">
        <rect x={X1(1)} y={6} width={X1(2) - X1(1)} height={H - 20} fill="var(--accent)" opacity={0.08} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} strokeDasharray="4 3" points={xs.map((x) => `${X1(x).toFixed(1)},${Y(f0(x)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={xs.map((x) => `${X1(x).toFixed(1)},${Y(L(x)).toFixed(1)}`).join(" ")} />
        <line x1={X1(-2)} x2={X1(2)} y1={Y(1)} y2={Y(1)} stroke="var(--text)" strokeWidth={1} />
        <line x1={X1(-2)} x2={X1(2)} y1={Y(g(lam))} y2={Y(g(lam))} stroke="var(--danger)" strokeDasharray="3 3" />
        <circle cx={X1(xmin)} cy={Y(L(xmin))} r={3.5} fill="var(--danger)" />
        <line x1={half} x2={half} y1={6} y2={H - 6} stroke="var(--border)" />
        <line x1={X2(0)} x2={X2(5)} y1={Y(1)} y2={Y(1)} stroke="var(--text)" strokeWidth={1} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={ls.map((l) => `${X2(l).toFixed(1)},${Y(g(l)).toFixed(1)}`).join(" ")} />
        <circle cx={X2(lam)} cy={Y(g(lam))} r={3.5} fill="var(--danger)" />
        <text x={12} y={16} className="viz-label">L(x, λ) over x</text>
        <text x={half + 12} y={16} className="viz-label">g(λ)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        g(λ) = min over x of x² + λ(1 − x) = {g(lam).toFixed(3)} at x = {xmin.toFixed(2)}; optimal value p* = 1; gap {(1 - g(lam)).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Left: the objective x² (dashed), the feasible region x ≥ 1 (shaded) and the Lagrangian x² + λ(1 − x) (solid). On the
        feasible region the added term is never positive, so the Lagrangian lies below the objective there, and its minimum
        over all x, the dual function g(λ) (red dashed line), lies below p* = 1 (black line). Right: g(λ) = λ − λ²/4 is
        concave, and its maximum, at λ = 2, equals p* exactly: the best lower bound is tight for this convex problem.
      </figcaption>
    </figure>
  );
}
