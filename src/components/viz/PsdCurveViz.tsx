"use client";

import { useState } from "react";

/** The quadratic form of a symmetric 2×2 matrix on the unit circle: positive semidefinite exactly when the curve stays above 0. */
export function PsdCurveViz() {
  const [a, setA] = useState(20), [b, setB] = useState(10), [c, setC] = useState(10);
  const A = a / 10, B = b / 10, Cc = c / 10;
  const q = (t: number) => A * Math.cos(t) * Math.cos(t) + 2 * B * Math.sin(t) * Math.cos(t) + Cc * Math.sin(t) * Math.sin(t);
  const mid = (A + Cc) / 2, rad = Math.sqrt(((A - Cc) / 2) * ((A - Cc) / 2) + B * B);
  const lmin = mid - rad, lmax = mid + rad;
  const psd = lmin >= -1e-12;
  const W = 320, H = 150;
  const X = (t: number) => 30 + (t / Math.PI) * (W - 40), Y = (v: number) => 75 - v * 12;
  const pts: string[] = [];
  for (let i = 0; i <= 180; i++) pts.push(`${X((i * Math.PI) / 180).toFixed(1)},${Y(q((i * Math.PI) / 180)).toFixed(1)}`);
  const slider = (label: string, v: number, set: (x: number) => void) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {(v / 10).toFixed(1)}
      <input type="range" min={-20} max={30} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider("a", a, setA)}
        {slider("b", b, setB)}
        {slider("c", c, setC)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The quadratic form on the unit circle">
        <line x1={30} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={30} x2={W - 10} y1={Y(lmin)} y2={Y(lmin)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <line x1={30} x2={W - 10} y1={Y(lmax)} y2={Y(lmax)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={26} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X(Math.PI)} y={H - 4} textAnchor="end" className="viz-label">θ = π</text>
        <polyline fill="none" stroke={psd ? "var(--accent)" : "var(--danger)"} strokeWidth={2} points={pts.join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        A = [[a, b], [b, c]], eigenvalues {lmin.toFixed(2)} and {lmax.toFixed(2)}: {psd ? "positive semidefinite" : "not positive semidefinite"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is ⟨Ax, x⟩ for the unit vector x = (cos θ, sin θ). Its lowest and highest values are exactly the two
        eigenvalues (dashed), reached at the eigenvectors. So A is positive semidefinite, ⟨Ax, x⟩ ≥ 0 for all x, exactly when
        its smallest eigenvalue is at least 0, which for 2×2 matrices means a ≥ 0, c ≥ 0 and ac ≥ b². Positive diagonal
        entries are not enough: try a = c = 1 and b = 1.5.
      </figcaption>
    </figure>
  );
}
