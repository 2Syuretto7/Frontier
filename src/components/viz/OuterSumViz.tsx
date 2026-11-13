"use client";

import { useState } from "react";
import { svd } from "./la";

const N = 6;
const U = [[1, 0.8, 0.3, -0.2, -0.6, -1], [0.2, 1, -0.5, -1, 0.4, 0.9], [1, -1, 1, -1, 1, -1]];
const V = [[1, 0.6, 0.2, 0, -0.4, -0.8], [-0.5, 0.3, 1, 0.3, -0.5, -1], [0.3, -0.3, 0.6, 0.9, -0.9, 0.2]];

/** A 2-tensor in ℝ⁶ ⊗ ℝ⁶ is a 6×6 array; a sum of k elementary tensors u ⊗ v has rank k, read off the singular values. */
export function OuterSumViz() {
  const [k, setK] = useState(1);
  const T = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
    let s = 0;
    for (let r = 0; r < k; r++) s += U[r][i] * V[r][j];
    return s;
  }));
  const sv = svd(T).s.slice().sort((a, b) => b - a);
  const maxAbs = Math.max(...T.flat().map(Math.abs), 1e-9);
  const cell = 20;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {[1, 2, 3].map((r) => (
          <button key={r} type="button" className="seg" aria-pressed={k === r} onClick={() => setK(r)}>{r} term{r > 1 ? "s" : ""}</button>
        ))}
      </div>
      <svg viewBox="0 0 300 130" style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A sum of outer products and its singular values">
        {T.map((row, i) => row.map((v, j) => (
          <rect key={`${i}-${j}`} x={4 + j * cell} y={4 + i * cell} width={cell - 1} height={cell - 1} fill={v >= 0 ? "var(--accent)" : "var(--danger)"} opacity={0.1 + 0.9 * (Math.abs(v) / maxAbs)} />
        )))}
        {sv.map((s, r) => (
          <g key={r}>
            <rect x={150 + r * 24} y={110 - (s / sv[0]) * 100} width={18} height={(s / sv[0]) * 100} fill={s > 1e-6 * sv[0] ? "var(--accent)" : "var(--border)"} />
            <text x={159 + r * 24} y={124} textAnchor="middle" className="viz-label">σ{r + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        σ = [{sv.map((s) => (s < 1e-6 * sv[0] ? "0" : s.toFixed(2))).join(", ")}]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The array is Σ uᵣ ⊗ vᵣ over the chosen number of terms, with entries uᵣ(i)vᵣ(j) (blue positive, red negative). One
        term is an elementary tensor, a single outer product. Adding terms with independent vectors raises the number of
        nonzero singular values one at a time: for two-index tensors, tensor rank is exactly matrix rank.
      </figcaption>
    </figure>
  );
}
