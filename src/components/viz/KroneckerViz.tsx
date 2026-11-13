"use client";

import { useState } from "react";

const B = [[1, 0.5, 0], [0.5, 1, 0.5], [0, 0.5, 1]];

/** A ⊗ B is a block matrix whose (i, j) block is a_ij·B; its eigenvalues are all products λ_i(A)·μ_j(B). */
export function KroneckerViz() {
  const [a, setA] = useState(20), [b, setB] = useState(5), [c, setC] = useState(10);
  const A = [[a / 10, b / 10], [b / 10, c / 10]];
  const K = Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, s) => A[Math.floor(r / 3)][Math.floor(s / 3)] * B[r % 3][s % 3]));
  const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const la = [tr / 2 - disc, tr / 2 + disc];
  const mu = [1 - Math.SQRT1_2, 1, 1 + Math.SQRT1_2];
  const prods = la.flatMap((l) => mu.map((m) => l * m)).sort((x, y) => x - y);
  const maxAbs = Math.max(...K.flat().map(Math.abs), 1e-9);
  const cell = 22;
  const slider = (label: string, v: number, set: (x: number) => void) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {(v / 10).toFixed(1)}
      <input type="range" min={-20} max={20} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider("a₁₁", a, setA)}
        {slider("a₁₂ = a₂₁", b, setB)}
        {slider("a₂₂", c, setC)}
      </div>
      <svg viewBox="0 0 150 150" style={{ width: "100%", maxWidth: 240, display: "block", margin: "0 auto" }} role="img" aria-label="The Kronecker product as a 6 by 6 grid">
        {K.map((row, r) => row.map((v, s) => (
          <rect key={`${r}-${s}`} x={6 + s * cell} y={6 + r * cell} width={cell - 1} height={cell - 1} fill={v >= 0 ? "var(--accent)" : "var(--danger)"} opacity={v === 0 ? 0.05 : 0.15 + 0.85 * (Math.abs(v) / maxAbs)} />
        )))}
        <line x1={6 + 3 * cell - 0.5} x2={6 + 3 * cell - 0.5} y1={6} y2={6 + 6 * cell} stroke="var(--text)" />
        <line y1={6 + 3 * cell - 0.5} y2={6 + 3 * cell - 0.5} x1={6} x2={6 + 6 * cell} stroke="var(--text)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        eig(A) = {la.map((x) => x.toFixed(2)).join(", ")}; eig(A ⊗ B) = {prods.map((x) => x.toFixed(2)).join(", ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A is the symmetric 2×2 matrix set by the sliders and B is a fixed 3×3 matrix with eigenvalues 1 − 1/√2, 1 and
        1 + 1/√2. The 6×6 product is four copies of B scaled by the entries of A (blue positive, red negative). Its six
        eigenvalues are every product of an eigenvalue of A with one of B, with eigenvectors u ⊗ v. Since B is positive
        definite, A ⊗ B is positive definite exactly when A is.
      </figcaption>
    </figure>
  );
}
