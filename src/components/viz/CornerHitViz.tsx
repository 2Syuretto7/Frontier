"use client";

import { useState } from "react";

const Q = [[1.6, 0.6], [0.6, 0.8]];
const loss = (x: number, y: number, c: [number, number]) => {
  const dx = x - c[0], dy = y - c[1];
  return 0.5 * (Q[0][0] * dx * dx + 2 * Q[0][1] * dx * dy + Q[1][1] * dy * dy);
};

function solve(c: [number, number], tau: number, l1: boolean): [number, number] {
  const inside = l1 ? Math.abs(c[0]) + Math.abs(c[1]) <= tau : Math.hypot(c[0], c[1]) <= tau;
  if (inside) return c;
  let best: [number, number] = [tau, 0], bv = Infinity;
  for (let i = 0; i < 4000; i++) {
    const a = (2 * Math.PI * i) / 4000;
    const ca = Math.cos(a), sa = Math.sin(a);
    const s = l1 ? tau / (Math.abs(ca) + Math.abs(sa)) : tau;
    const p: [number, number] = [s * ca, s * sa];
    const v = loss(p[0], p[1], c);
    if (v < bv) { bv = v; best = p; }
  }
  return best;
}

/** Least squares constrained to an ℓ₁ ball or an ℓ₂ ball: the elliptical level sets usually first touch the diamond at a corner, where one coordinate is exactly zero, and the round ball almost never. */
export function CornerHitViz() {
  const [ang, setAng] = useState(30);
  const [tau, setTau] = useState(1);
  const [l1, setL1] = useState(true);
  const c: [number, number] = [2.2 * Math.cos((ang * Math.PI) / 180), 2.2 * Math.sin((ang * Math.PI) / 180)];
  const x = solve(c, tau, l1);
  const lv = loss(x[0], x[1], c);
  const W = 300, H = 300, R = 3;
  const X = (u: number) => W / 2 + (u / R) * (W / 2 - 6);
  const Y = (v: number) => H / 2 - (v / R) * (H / 2 - 6);
  const ellipse = (level: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const a = (2 * Math.PI * i) / 120;
      const d = [Math.cos(a), Math.sin(a)];
      const q = 0.5 * (Q[0][0] * d[0] * d[0] + 2 * Q[0][1] * d[0] * d[1] + Q[1][1] * d[1] * d[1]);
      const r = Math.sqrt(level / q);
      pts.push(`${X(c[0] + r * d[0]).toFixed(1)},${Y(c[1] + r * d[1]).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const zero = Math.abs(x[0]) < 1e-3 || Math.abs(x[1]) < 1e-3;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={l1} onClick={() => setL1(true)}>ℓ₁ ball</button>
        <button type="button" className="seg" aria-pressed={!l1} onClick={() => setL1(false)}>ℓ₂ ball</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          direction {ang}°
          <input type="range" min={0} max={359} value={ang} onChange={(e) => setAng(Number(e.target.value))} aria-label="direction of the unconstrained minimum" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          radius {tau.toFixed(1)}
          <input type="range" min={0.2} max={2.4} step={0.1} value={tau} onChange={(e) => setTau(Number(e.target.value))} aria-label="radius of the ball" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="Elliptical level sets of a least-squares loss touching an l1 or l2 ball">
        <defs>
          <clipPath id="ch-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <line x1={X(-R)} x2={X(R)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={Y(-R)} y2={Y(R)} stroke="var(--border)" />
        {l1 ? (
          <polygon points={`${X(tau)},${Y(0)} ${X(0)},${Y(tau)} ${X(-tau)},${Y(0)} ${X(0)},${Y(-tau)}`} fill="var(--accent)" opacity={0.2} stroke="var(--accent)" />
        ) : (
          <circle cx={X(0)} cy={Y(0)} r={X(tau) - X(0)} fill="var(--accent)" opacity={0.2} stroke="var(--accent)" />
        )}
        <g clipPath="url(#ch-clip)">
          {lv > 1e-9 ? <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} points={ellipse(lv)} /> : null}
          {[0.5, 1.5].map((m) => (lv > 1e-9 ? <polyline key={m} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" points={ellipse(lv * m)} /> : null))}
        </g>
        <circle cx={X(c[0])} cy={Y(c[1])} r={3} fill="var(--text)" />
        <circle cx={X(x[0])} cy={Y(x[1])} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        solution ({(x[0] + 0).toFixed(3)}, {(x[1] + 0).toFixed(3)}){zero ? ": one coordinate is exactly zero" : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The black point is the unconstrained least-squares minimum and the ellipses are level sets of the loss around it.
        The constrained solution, in red, is where the smallest level set that meets the ball first touches it. The ℓ₁ ball
        is a diamond whose corners stick out along the axes, so over a wide range of directions the first contact is a
        corner, where the other coordinate is exactly 0. The ℓ₂ ball has no corners, and its solution is zero in a
        coordinate only when the minimum lies exactly on an axis.
      </figcaption>
    </figure>
  );
}
