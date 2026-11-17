"use client";

import { useState } from "react";

/** Solving Ax = b with the columns of A at an angle θ: a circle of perturbations of b maps to an ellipse of solutions whose axis ratio is the condition number κ(A). */
export function CondEllipseViz() {
  const [deg, setDeg] = useState(30);
  const t = (deg * Math.PI) / 180;
  const A = [[1, Math.cos(t)], [0, Math.sin(t)]];
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const inv = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
  const x: [number, number] = [1, 1];
  const r = 0.12;
  const pts = Array.from({ length: 121 }, (_, i) => {
    const a = (2 * Math.PI * i) / 120;
    const db = [r * Math.cos(a), r * Math.sin(a)];
    return [x[0] + inv[0][0] * db[0] + inv[0][1] * db[1], x[1] + inv[1][0] * db[0] + inv[1][1] * db[1]];
  });
  const a = A[0][0] ** 2 + A[1][0] ** 2, c = A[0][1] ** 2 + A[1][1] ** 2, bb = A[0][0] * A[0][1] + A[1][0] * A[1][1];
  const disc = Math.sqrt(((a - c) / 2) ** 2 + bb * bb);
  const s1 = Math.sqrt((a + c) / 2 + disc), s2 = Math.sqrt(Math.max((a + c) / 2 - disc, 0));
  const kappa = s1 / s2;
  const W = 300, H = 260, R = 3.2;
  const X = (u: number) => W / 2 + ((u - 1) / R) * (W / 2 - 6);
  const Y = (v: number) => H / 2 - ((v - 1) / R) * (H / 2 - 6) * (W / H);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          angle between columns θ = {deg}°
          <input type="range" min={2} max={90} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="angle between the columns" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Ellipse of solutions produced by a circle of right-hand-side perturbations">
        <defs>
          <clipPath id="ce-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#ce-clip)">
          <polygon points={pts.map(([u, v]) => `${X(u).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} fill="var(--accent)" opacity={0.25} stroke="var(--accent)" />
          <circle cx={X(1)} cy={Y(1)} r={((r / R) * (W / 2 - 6))} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        </g>
        <circle cx={X(1)} cy={Y(1)} r={3} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        κ₂(A) = σ₁/σ₂ = {kappa.toFixed(2)}; digits at risk ≈ log₁₀ κ = {Math.log10(kappa).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A has unit columns e₁ and (cos θ, sin θ). The red point is the solution x = (1, 1) of Ax = b. Perturb b anywhere on
        a small circle (the dashed circle shows its size) and the solutions fill the shaded ellipse A⁻¹(circle). Its longest
        axis is 1/σ₂ times the radius, so a relative change in b can be magnified by up to κ = σ₁/σ₂ in x. As the columns
        become nearly parallel, σ₂ → 0, the ellipse stretches without bound, and the problem itself, not any algorithm,
        becomes ill conditioned.
      </figcaption>
    </figure>
  );
}
