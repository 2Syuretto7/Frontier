"use client";

import { useState } from "react";

const T = [[1, 2], [0, 1]];
const v = [1, 1], w = [2, -1];
const WEIGHTS = [0.5, 1, 2, 4];
const mul = (A: number[][], x: number[]) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
const tr = (A: number[][]) => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];

/** The adjoint depends on the inner product: with ⟨x, y⟩ = x1y1 + a·x2y2 the transpose stops being the adjoint. */
export function AdjointWeightViz() {
  const [i, setI] = useState(2);
  const a = WEIGHTS[i];
  const ip = (x: number[], y: number[]) => x[0] * y[0] + a * x[1] * y[1];
  const Tstar = [[T[0][0], (a * T[1][0])], [T[0][1] / a, T[1][1]]];
  const rows: [string, number, string][] = [
    ["⟨Tv, w⟩", ip(mul(T, v), w), "var(--text)"],
    ["⟨v, Tᵀw⟩", ip(v, mul(tr(T), w)), "var(--danger)"],
    ["⟨v, T*w⟩", ip(v, mul(Tstar, w)), "var(--accent)"],
  ];
  const W = 320, Z = 160, S = 22;
  const fmt = (x: number) => (Math.abs(x) < 1e-12 ? "0" : Number.isInteger(x) ? String(x) : x.toFixed(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {WEIGHTS.map((x, k) => (
          <button key={x} type="button" className="seg" aria-pressed={i === k} onClick={() => setI(k)}>a = {x}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 96`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Three inner products compared">
        <line x1={Z} x2={Z} y1={4} y2={92} stroke="var(--border)" />
        {rows.map(([label, val, color], k) => (
          <g key={label}>
            <text x={4} y={24 + k * 30} className="viz-label">{label}</text>
            <rect x={Math.min(Z, Z + val * S / 4)} y={12 + k * 30} width={Math.abs(val * S / 4)} height={16} fill={color} opacity={0.75} />
            <text x={val >= 0 ? Z + val * S / 4 + 4 : Z + val * S / 4 - 4} y={24 + k * 30} textAnchor={val >= 0 ? "start" : "end"} className="viz-label">{fmt(val)}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        T = [[1, 2], [0, 1]], T* = M⁻¹TᵀM = [[{fmt(Tstar[0][0])}, {fmt(Tstar[0][1])}], [{fmt(Tstar[1][0])}, {fmt(Tstar[1][1])}]]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        v = (1, 1), w = (2, −1), and M = diag(1, a). The adjoint T* is defined by ⟨Tv, w⟩ = ⟨v, T*w⟩, so the first and last
        bars always agree. The plain transpose agrees only when a = 1, where the standard basis is orthonormal: the rule
        &ldquo;adjoint = conjugate transpose&rdquo; holds in orthonormal bases only.
      </figcaption>
    </figure>
  );
}
