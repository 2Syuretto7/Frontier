"use client";

import { useState } from "react";

const mm = (A: number[][], B: number[][]) => [0, 1].map((i) => [0, 1].map((j) => A[i][0] * B[0][j] + A[i][1] * B[1][j]));
const tr = (A: number[][]) => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];

function eigvecs(A: number[][]) {
  // real 2×2 with real distinct eigenvalues here
  const t = A[0][0] + A[1][1], d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const disc = Math.sqrt(Math.max(0, (t * t) / 4 - d));
  return [t / 2 - disc, t / 2 + disc].map((l) => {
    const v = Math.abs(A[0][1]) > 1e-12 ? [A[0][1], l - A[0][0]] : Math.abs(A[1][0]) > 1e-12 ? [l - A[1][1], A[1][0]] : l === A[0][0] ? [1, 0] : [0, 1];
    const n = Math.hypot(v[0], v[1]);
    return [v[0] / n, v[1] / n];
  });
}

/** Eigenvectors of a symmetric matrix stay orthogonal; those of a non-normal one can become nearly parallel. */
export function NormalityViz() {
  const [kind, setKind] = useState<"sym" | "upper">("upper");
  const [s10, setS10] = useState(10);
  const s = s10 / 10;
  const A = kind === "sym" ? [[1, s], [s, 2]] : [[1, s], [0, 2]];
  const [u, v] = eigvecs(A);
  const cos = Math.abs(u[0] * v[0] + u[1] * v[1]);
  const ang = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
  const D = mm(A, tr(A)).map((r, i) => r.map((x, j) => x - mm(tr(A), A)[i][j]));
  const comm = Math.sqrt(D.flat().reduce((a, x) => a + x * x, 0));
  const C = 100, R = 80;
  const ln = (e: number[], color: string) => (
    <line x1={C - e[0] * R} y1={C + e[1] * R} x2={C + e[0] * R} y2={C - e[1] * R} stroke={color} strokeWidth={2} />
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={kind === "upper"} onClick={() => setKind("upper")}>[[1, s], [0, 2]]</button>
        <button type="button" className="seg" aria-pressed={kind === "sym"} onClick={() => setKind("sym")}>[[1, s], [s, 2]]</button>
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          s = {s.toFixed(1)}
          <input type="range" min={0} max={40} value={s10} onChange={(e) => setS10(Number(e.target.value))} aria-label="off-diagonal entry s" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }} role="img" aria-label="The two eigenvector directions">
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border)" />
        {ln(u, "var(--accent)")}
        {ln(v, "var(--danger)")}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        angle between eigenvectors {ang.toFixed(1)}°, ‖AA* − A*A‖ = {comm.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {kind === "sym"
          ? "A symmetric matrix is self-adjoint, so the spectral theorem applies: whatever s is, the eigenvectors are perpendicular and the commutator AA* − A*A is zero."
          : "The upper-triangular matrix has eigenvalues 1 and 2 for every s, but it is normal only at s = 0. As s grows the eigenvectors swing towards each other, and an eigenvector basis, though it exists, becomes badly conditioned."}
      </figcaption>
    </figure>
  );
}
