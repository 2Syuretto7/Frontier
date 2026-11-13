"use client";

import { useState } from "react";

/** The unit circle and orthogonality under the inner product ⟨x, y⟩ = xᵀMy for a positive definite M. */
export function WeightedInnerViz() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0.5);
  const [ang, setAng] = useState(30);
  const c = 2;
  const det = a * c - b * b;
  const pd = a > 0 && det > 0.01;
  const t = (ang * Math.PI) / 180;
  const u = [Math.cos(t), Math.sin(t)];
  const Mu = [a * u[0] + b * u[1], b * u[0] + c * u[1]];
  const w0 = [-Mu[1], Mu[0]];
  const nw = pd ? Math.sqrt(w0[0] * (a * w0[0] + b * w0[1]) + w0[1] * (b * w0[0] + c * w0[1])) : 1;
  const w = [w0[0] / nw, w0[1] / nw];
  const nu = pd ? Math.sqrt(u[0] * Mu[0] + u[1] * Mu[1]) : 1;
  const uu = [u[0] / nu, u[1] / nu];
  const W = 300, H = 240, cx = 150, cy = 120, s = 70;
  const X = (x: number) => cx + s * x, Y = (y: number) => cy - s * y;
  const ellipse: string[] = [];
  if (pd) {
    for (let k = 0; k <= 120; k++) {
      const th = (2 * Math.PI * k) / 120, d = [Math.cos(th), Math.sin(th)];
      const q = a * d[0] * d[0] + 2 * b * d[0] * d[1] + c * d[1] * d[1];
      const r = 1 / Math.sqrt(q);
      ellipse.push(`${X(r * d[0]).toFixed(1)},${Y(r * d[1]).toFixed(1)}`);
    }
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          M₁₁ = {a.toFixed(1)}
          <input type="range" min={0.2} max={3} step={0.1} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="M 1 1" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          M₁₂ = {b.toFixed(1)}
          <input type="range" min={-1.5} max={1.5} step={0.1} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="M 1 2" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          u at {ang}°
          <input type="range" min={0} max={180} step={5} value={ang} onChange={(e) => setAng(Number(e.target.value))} aria-label="direction of u" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Unit ball and orthogonal vectors of a weighted inner product">
        <circle cx={cx} cy={cy} r={s} fill="none" stroke="var(--border)" strokeDasharray="3 3" />
        <line x1={10} x2={W - 10} y1={cy} y2={cy} stroke="var(--border)" />
        <line x1={cx} x2={cx} y1={10} y2={H - 10} stroke="var(--border)" />
        {pd && <polygon points={ellipse.join(" ")} fill="var(--accent-soft)" stroke="var(--accent)" />}
        {pd && <line x1={cx} y1={cy} x2={X(uu[0])} y2={Y(uu[1])} stroke="var(--text)" strokeWidth={2.4} />}
        {pd && <line x1={cx} y1={cy} x2={X(w[0])} y2={Y(w[1])} stroke="var(--danger)" strokeWidth={2.4} />}
        {pd && <text x={X(uu[0] * 1.15)} y={Y(uu[1] * 1.15)} textAnchor="middle" className="viz-label">u</text>}
        {pd && <text x={X(w[0] * 1.15)} y={Y(w[1] * 1.15)} textAnchor="middle" className="viz-label">w</text>}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        M = [[{a.toFixed(1)}, {b.toFixed(1)}], [{b.toFixed(1)}, {c}]] {pd ? `, ⟨u, w⟩_M = 0, ordinary angle ${((Math.acos(Math.max(-1, Math.min(1, (uu[0] * w[0] + uu[1] * w[1]) / Math.hypot(...uu) / Math.hypot(...w)))) * 180) / Math.PI).toFixed(0)}°` : " is not positive definite: not an inner product"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded ellipse is the unit ball {"{x : xᵀMx ≤ 1}"}; the dashed circle is the ordinary one. u and w both have
        length 1 under M and are orthogonal under M, yet the ordinary angle between them is usually not 90°. They are
        conjugate directions of the ellipse. Push M₁₂ too far and M stops being positive definite: some vectors would have
        length zero or imaginary length.
      </figcaption>
    </figure>
  );
}
