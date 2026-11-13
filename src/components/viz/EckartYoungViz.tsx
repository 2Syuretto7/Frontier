"use client";

import { useState } from "react";
import { svd, type Mat } from "./la";

const M = 10, N = 8;
const A: Mat = Array.from({ length: M }, (_, i) => Array.from({ length: N }, (_, j) => {
  let t = 0, w = 3;
  for (let q = 1; q <= 8; q++) { t += w * Math.cos(q * i * 0.7 + q) * Math.sin(q * j * 0.5 + 0.3 * q); w *= 0.6; }
  return t;
}));
const S = svd(A).s.slice().sort((a, b) => b - a);
const fro = (X: Mat) => Math.sqrt(X.flat().reduce((a, x) => a + x * x, 0));
const spec = (X: Mat) => Math.max(...svd(X).s);

/** Residual of projecting A's columns onto the span of its k largest columns: a natural rank-k competitor. */
function columnSelect(k: number): Mat {
  const order = Array.from({ length: N }, (_, j) => j).sort((a, b) => fro(A.map((r) => [r[b]])) - fro(A.map((r) => [r[a]])));
  const Q: number[][] = [];
  for (const j of order.slice(0, k)) {
    let w = A.map((r) => r[j]);
    for (const q of Q) { const c = q.reduce((s, x, i) => s + x * w[i], 0); w = w.map((x, i) => x - c * q[i]); }
    const n = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
    if (n > 1e-12) Q.push(w.map((x) => x / n));
  }
  return A.map((row, i) => row.map((_, j) => {
    let p = 0;
    for (const q of Q) { let c = 0; for (let r = 0; r < M; r++) c += q[r] * A[r][j]; p += c * q[i]; }
    return A[i][j] - p;
  }));
}

/** Eckart–Young: truncating the SVD after k terms leaves error σ_{k+1} (spectral) and √(Σ_{j>k} σ_j²) (Frobenius), and nothing of rank k does better. */
export function EckartYoungViz() {
  const [k, setK] = useState(2);
  const ef = Math.sqrt(S.slice(k).reduce((a, x) => a + x * x, 0));
  const es = k < S.length ? S[k] : 0;
  const R = columnSelect(k);
  const W = 320, H = 140, bw = (W - 40) / S.length;
  const Y = (v: number) => H - 20 - (v / S[0]) * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          rank k = {k}
          <input type="range" min={0} max={N} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="rank of the approximation" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Singular values, kept and dropped">
        <line x1={30} x2={W - 10} y1={H - 20} y2={H - 20} stroke="var(--border)" />
        {S.map((v, j) => (
          <g key={j}>
            <rect x={32 + j * bw} y={Y(v)} width={bw - 6} height={H - 20 - Y(v)} fill={j < k ? "var(--accent)" : "var(--border)"} />
            <text x={32 + j * bw + (bw - 6) / 2} y={H - 6} textAnchor="middle" className="viz-label">σ{j + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        truncated SVD: spectral {es.toFixed(3)}, Frobenius {ef.toFixed(3)}
        <br />
        best k columns: spectral {(k === N ? 0 : spec(R)).toFixed(3)}, Frobenius {fro(R).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A is a 10×8 matrix. Keeping its k largest singular values (blue) gives a rank-k matrix whose error is exactly the
        first dropped singular value in the spectral norm, and the root-sum-square of all dropped ones in the Frobenius norm.
        A sensible competitor, projecting onto the span of the k largest columns of A, is also rank k and always does worse,
        as Eckart–Young guarantees.
      </figcaption>
    </figure>
  );
}
