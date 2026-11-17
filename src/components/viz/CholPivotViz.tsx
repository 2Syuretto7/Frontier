"use client";

import { useState } from "react";

const N = 5;

function factor(c: number) {
  const A = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : c)));
  const L = Array.from({ length: N }, () => Array(N).fill(0));
  const d: number[] = [];
  let failed = -1;
  for (let j = 0; j < N; j++) {
    let s = A[j][j];
    for (let k = 0; k < j; k++) s -= L[j][k] * L[j][k];
    d.push(s);
    if (s <= 1e-12) { failed = j; break; }
    L[j][j] = Math.sqrt(s);
    for (let i = j + 1; i < N; i++) {
      let t = A[i][j];
      for (let k = 0; k < j; k++) t -= L[i][k] * L[j][k];
      L[i][j] = t / L[j][j];
    }
  }
  return { L, d, failed };
}

/** Cholesky of the 5 × 5 equicorrelation matrix (1 on the diagonal, c elsewhere): the pivots dⱼ, and where the factorisation stops when the matrix is not positive definite. */
export function CholPivotViz() {
  const [k, setK] = useState(50);
  const c = k / 100;
  const { L, d, failed } = factor(c);
  const W = 330, H = 150;
  const cell = 22, gx = 12, gy = 14;
  const bx = 160, bw = 28;
  const Yd = (v: number) => 80 - (Math.max(-1.5, Math.min(v, 2.5)) / 2.5) * 66;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          off-diagonal c = {c.toFixed(2)}
          <input type="range" min={-50} max={120} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="off-diagonal entry" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The Cholesky factor and its pivots for an equicorrelation matrix">
        {L.map((row, i) =>
          row.map((v, j) => {
            const done = failed < 0 || j < failed;
            const show = j <= i && done;
            return (
              <g key={`${i}-${j}`}>
                <rect x={gx + j * cell} y={gy + i * cell} width={cell - 2} height={cell - 2} fill={show ? "var(--accent)" : "var(--border)"} opacity={show ? 0.15 + 0.7 * Math.min(Math.abs(v), 1) : 0.25} />
                {show && <text x={gx + j * cell + cell / 2 - 1} y={gy + i * cell + cell / 2 + 3} textAnchor="middle" className="viz-label" style={{ fontSize: 8 }}>{v.toFixed(2)}</text>}
              </g>
            );
          }),
        )}
        <text x={gx} y={gy + N * cell + 12} className="viz-label">L</text>
        <line x1={bx - 4} x2={bx + N * (bw + 6)} y1={Yd(0)} y2={Yd(0)} stroke="var(--border)" />
        {d.map((v, j) => (
          <g key={j}>
            <rect x={bx + j * (bw + 6)} y={Math.min(Yd(v), Yd(0))} width={bw} height={Math.abs(Yd(v) - Yd(0))} fill={v > 1e-12 ? "var(--accent)" : "var(--danger)"} opacity={0.75} />
            <text x={bx + j * (bw + 6) + bw / 2} y={128} textAnchor="middle" className="viz-label">d{j + 1}</text>
          </g>
        ))}
        <text x={bx} y={H - 4} className="viz-label">pivots dⱼ = aⱼⱼ − Σ lⱼₖ²</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {failed < 0
          ? `positive definite: log det = 2 Σ log lⱼⱼ = ${(2 * L.reduce((a, r, j) => a + Math.log(r[j]), 0)).toFixed(4)}`
          : `stops at step ${failed + 1}: d = ${d[failed].toFixed(4)} ≤ 0, so the matrix is not positive definite`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The matrix has 1 on the diagonal and c everywhere else; it is positive definite exactly when −1/4 &lt; c &lt; 1. Each
        step takes the square root of a pivot dⱼ, the diagonal entry minus the squares already used in its row. For a
        positive definite matrix every pivot is positive and every entry of L is at most the square root of its diagonal
        entry, so nothing can grow. Push c outside the interval and a pivot becomes zero or negative: the factorisation stops,
        which is the cheapest reliable test of positive definiteness.
      </figcaption>
    </figure>
  );
}
