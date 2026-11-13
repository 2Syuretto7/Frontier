"use client";

import { useState } from "react";

const PROBS = [
  { label: "convex", f0: (x: number) => x * x, f1: (x: number) => 1 - x, lmax: 4 },
  { label: "non-convex", f0: (x: number) => Math.min((x + 2) ** 2, (x - 2) ** 2 + 0.5), f1: (x: number) => -x, lmax: 1 },
];

const XS = Array.from({ length: 1201 }, (_, i) => -4 + i / 150);

/** The set of (constraint, cost) pairs of a one-variable problem and the supporting lines that define the dual function. */
export function DualityGapViz() {
  const [k, setK] = useState(0);
  const [lam, setLam] = useState(1);
  const P = PROBS[k];
  const pts = XS.map((x) => [P.f1(x), P.f0(x)] as [number, number]);
  const pstar = Math.min(...pts.filter(([u]) => u <= 0).map(([, t]) => t));
  const g = (l: number) => Math.min(...pts.map(([u, t]) => t + l * u));
  const ls = Array.from({ length: 201 }, (_, i) => (P.lmax * i) / 200);
  const gs = ls.map(g);
  const dstar = Math.max(...gs);
  const gl = g(Math.min(lam, P.lmax));
  const l = Math.min(lam, P.lmax);
  const W = 300, H = 220;
  const ulo = -3, uhi = 3, tlo = -0.5, thi = 4;
  const X = (u: number) => 14 + ((u - ulo) / (uhi - ulo)) * (W - 28);
  const Y = (t: number) => H - 14 - ((t - tlo) / (thi - tlo)) * (H - 24);
  const vis = pts.filter(([u, t]) => u >= ulo && u <= uhi && t <= thi);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PROBS.map((p, i) => (
          <button key={p.label} type="button" className="seg" aria-pressed={k === i} onClick={() => { setK(i); setLam(i === 0 ? 1 : 0.1); }}>{p.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {l.toFixed(3)}
          <input type="range" min={0} max={P.lmax} step={P.lmax / 200} value={l} onChange={(e) => setLam(Number(e.target.value))} aria-label="multiplier" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Set of constraint and cost values with a supporting line">
        <defs>
          <clipPath id="dg-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <rect x={X(ulo)} y={6} width={X(0) - X(ulo)} height={H - 20} fill="var(--accent)" opacity={0.07} />
        <line x1={X(0)} x2={X(0)} y1={6} y2={H - 14} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={vis.map(([u, t]) => `${X(u).toFixed(1)},${Y(t).toFixed(1)}`).join(" ")} />
        <g clipPath="url(#dg-clip)">
          <line x1={X(ulo)} y1={Y(gl - l * ulo)} x2={X(uhi)} y2={Y(gl - l * uhi)} stroke="var(--danger)" strokeWidth={1.5} />
        </g>
        <circle cx={X(0)} cy={Y(gl)} r={3.5} fill="var(--danger)" />
        <circle cx={X(0)} cy={Y(pstar)} r={4} fill="none" stroke="var(--text)" strokeWidth={1.6} />
        <text x={X(uhi)} y={H - 2} textAnchor="end" className="viz-label">u = f₁(x)</text>
        <text x={X(0) + 4} y={14} className="viz-label">t = f₀(x)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        g(λ) = {gl.toFixed(4)}; best dual bound d* = {dstar.toFixed(4)}; optimal value p* = {pstar.toFixed(4)}; gap {(pstar - dstar).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the set of pairs (f₁(x), f₀(x)) as x varies; feasible points are those with u ≤ 0 (shaded), and p* (open
        circle) is the lowest of them. For each λ the red line of slope −λ is pushed up until it touches the curve; it
        crosses u = 0 at height g(λ) (red dot), which is always at most p*. For the convex problem some line passes through
        p*, so the best bound is exact. For the non-convex problem the curve has a dent, no line can reach the open circle,
        and a duality gap of about 0.25 remains.
      </figcaption>
    </figure>
  );
}
