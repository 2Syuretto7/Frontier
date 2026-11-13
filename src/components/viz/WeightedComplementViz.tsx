"use client";

import { useState } from "react";

const U = [1, 0.5], V = [0.5, 1.6];
const WEIGHTS = [0.25, 0.5, 1, 2, 4];

/** The orthogonal complement of a line, and the split v = Pv + (v − Pv), under the inner product x1y1 + a·x2y2. */
export function WeightedComplementViz() {
  const [i, setI] = useState(2);
  const a = WEIGHTS[i];
  const ip = (x: number[], y: number[]) => x[0] * y[0] + a * x[1] * y[1];
  const c = ip(U, V) / ip(U, U);
  const P = [c * U[0], c * U[1]];
  const d = [-a * U[1], U[0]];
  const S = 60, O = 160, Oy = 110;
  const X = (x: number) => O + x * S, Y = (y: number) => Oy - y * S;
  const ell: string[] = [];
  for (let k = 0; k <= 72; k++) {
    const t = (k / 72) * 2 * Math.PI;
    ell.push(`${X(Math.cos(t)).toFixed(1)},${Y(Math.sin(t) / Math.sqrt(a)).toFixed(1)}`);
  }
  const line = (dir: number[], color: string, dash?: string) => {
    const n = Math.hypot(dir[0], dir[1]);
    const e = [(dir[0] / n) * 3, (dir[1] / n) * 3];
    return <line x1={X(-e[0])} y1={Y(-e[1])} x2={X(e[0])} y2={Y(e[1])} stroke={color} strokeDasharray={dash} />;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {WEIGHTS.map((w, k) => (
          <button key={w} type="button" className="seg" aria-pressed={i === k} onClick={() => setI(k)}>a = {w}</button>
        ))}
      </div>
      <svg viewBox="0 0 320 220" style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A line, its orthogonal complement and the projection of a vector">
        <defs>
          <clipPath id="wcv-clip"><rect x={0} y={0} width={320} height={220} /></clipPath>
        </defs>
        <g clipPath="url(#wcv-clip)">
          <polyline fill="none" stroke="var(--border)" points={ell.join(" ")} />
          {line(U, "var(--accent)")}
          {line(d, "var(--danger)", "5 4")}
          <line x1={X(0)} y1={Y(0)} x2={X(V[0])} y2={Y(V[1])} stroke="var(--text)" strokeWidth={2} />
          <line x1={X(P[0])} y1={Y(P[1])} x2={X(V[0])} y2={Y(V[1])} stroke="var(--danger)" strokeWidth={1.6} />
          <circle cx={X(P[0])} cy={Y(P[1])} r={4} fill="var(--accent)" />
          <circle cx={X(V[0])} cy={Y(V[1])} r={4} fill="var(--text)" />
          <text x={X(V[0]) + 6} y={Y(V[1])} className="viz-label">v</text>
          <text x={X(P[0]) + 6} y={Y(P[1]) + 14} className="viz-label">Pv</text>
          <text x={X(2.4)} y={Y(1.2) - 6} className="viz-label" style={{ fill: "var(--accent)" }}>U</text>
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        Pv = ({P[0].toFixed(3)}, {P[1].toFixed(3)}), ⟨v − Pv, u⟩ = {Math.abs(ip([V[0] - P[0], V[1] - P[1]], U)).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        U is the solid line, U⊥ the dashed one, and the oval is the unit ball of ⟨x, y⟩ = x₁y₁ + a·x₂y₂. Only for a = 1 does
        U⊥ look perpendicular to the eye. For every a, v splits uniquely as a piece in U plus a piece in U⊥, and the piece
        v − Pv (red) is parallel to the dashed line: the complement and the projection both depend on the inner product, not
        only on U.
      </figcaption>
    </figure>
  );
}
