"use client";

import { useState } from "react";

/** For a shear, the eigenvalues stay at 1 while the singular values (the ellipse's semi-axes) spread apart. */
export function SingVsEigViz() {
  const [s10, setS10] = useState(15);
  const s = s10 / 10;
  const A = [[1, s], [0, 1]];
  // singular values of [[1, s], [0, 1]]: sqrt of the eigenvalues of AᵀA = [[1, s], [s, 1 + s²]]
  const t = 2 + s * s, disc = Math.sqrt(t * t - 4);
  const s1 = Math.sqrt((t + disc) / 2), s2 = Math.sqrt((t - disc) / 2);
  const C = 130, Sc = 40;
  const circ: string[] = [], ell: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * 2 * Math.PI, x = Math.cos(th), y = Math.sin(th);
    circ.push(`${(C + x * Sc).toFixed(1)},${(100 - y * Sc).toFixed(1)}`);
    const ax = A[0][0] * x + A[0][1] * y, ay = A[1][0] * x + A[1][1] * y;
    ell.push(`${(C + ax * Sc).toFixed(1)},${(100 - ay * Sc).toFixed(1)}`);
  }
  // major axis direction: left singular vector u1 ∝ A v1, v1 the top eigenvector of AᵀA
  const v1 = [s, s1 * s1 - 1];
  const n1 = Math.hypot(v1[0], v1[1]) || 1;
  const u1 = [(A[0][0] * v1[0] + A[0][1] * v1[1]) / n1, (A[1][0] * v1[0] + A[1][1] * v1[1]) / n1];
  const u1n = Math.hypot(u1[0], u1[1]) || 1;
  const maj = s === 0 ? [1, 0] : [u1[0] / u1n, u1[1] / u1n];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          shear s = {s.toFixed(1)}
          <input type="range" min={0} max={30} value={s10} onChange={(e) => setS10(Number(e.target.value))} aria-label="shear amount" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 260 200" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="The unit circle and its image under a shear">
        <polyline fill="none" stroke="var(--border)" points={circ.join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={ell.join(" ")} />
        <line x1={C} y1={100} x2={C + maj[0] * s1 * Sc} y2={100 - maj[1] * s1 * Sc} stroke="var(--danger)" strokeWidth={2} />
        <line x1={C} y1={100} x2={C - maj[1] * s2 * Sc} y2={100 - maj[0] * s2 * Sc} stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        eigenvalues 1, 1; singular values {s1.toFixed(3)}, {s2.toFixed(3)}; σ₁σ₂ = {(s1 * s2).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A = [[1, s], [0, 1]] maps the grey unit circle to the blue ellipse. Its eigenvalues are both 1 whatever s is, but the
        ellipse&apos;s semi-axes (red), the singular values, spread apart: σ₁ grows and σ₂ = 1/σ₁ shrinks, keeping the area
        factor |det A| = 1. Eigenvalues describe what A does to vectors it maps to multiples of themselves; singular values
        describe how much A can stretch any vector, which is what matters for norms and stability.
      </figcaption>
    </figure>
  );
}
