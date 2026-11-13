"use client";

import { useState } from "react";

type P = { label: string; A: number[][]; b: [number, number] };
const PRESETS: P[] = [
  { label: "symmetric A", A: [[2, 1], [1, 3]], b: [1, 1] },
  { label: "non-symmetric A", A: [[2, 3], [-1, 3]], b: [1, 1] },
  { label: "indefinite A", A: [[2, 0], [0, -1]], b: [0.5, 0] },
];
const S = 280, C = S / 2, SC = 50, R = 2.4;
const px = (x: number) => C + x * SC;
const py = (y: number) => C - y * SC;

/** The gradient field of f(x) = ½ xᵀAx − bᵀx: only the symmetric part of A matters. */
export function QuadGradViz() {
  const [pi, setPi] = useState(0);
  const { A, b } = PRESETS[pi];
  const Sy = [[A[0][0], (A[0][1] + A[1][0]) / 2], [(A[0][1] + A[1][0]) / 2, A[1][1]]];
  const grad = (x: number, y: number): [number, number] => [Sy[0][0] * x + Sy[0][1] * y - b[0], Sy[1][0] * x + Sy[1][1] * y - b[1]];
  const det = Sy[0][0] * Sy[1][1] - Sy[0][1] * Sy[1][0];
  const star: [number, number] = [(Sy[1][1] * b[0] - Sy[0][1] * b[1]) / det, (-Sy[1][0] * b[0] + Sy[0][0] * b[1]) / det];
  const arrows = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = (i * R) / 4.5, y = (j * R) / 4.5;
    const [gx, gy] = grad(x, y);
    const n = Math.hypot(gx, gy);
    if (n < 1e-9) continue;
    const len = Math.min(0.24, 0.07 + 0.05 * n);
    const dx = (-gx / n) * len, dy = (-gy / n) * len;
    arrows.push(
      <line key={`${i},${j}`} x1={px(x)} y1={py(y)} x2={px(x + dx)} y2={py(y + dy)} stroke="var(--accent)" strokeWidth={1.6} markerEnd="url(#qg-head)" />,
    );
  }
  const pd = Sy[0][0] > 0 && det > 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button key={p.label} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{p.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "8px auto" }} role="img" aria-label="Field of downhill directions of a quadratic">
        <defs>
          <marker id="qg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
        </defs>
        <line x1={0} y1={py(0)} x2={S} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} y1={0} x2={px(0)} y2={S} stroke="var(--border)" />
        {arrows}
        <circle cx={px(star[0])} cy={py(star[1])} r={6} fill={pd ? "var(--danger)" : "none"} stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        A = [[{A[0].join(", ")}], [{A[1].join(", ")}]], symmetric part ½(A + Aᵀ) = [[{Sy[0].join(", ")}], [{Sy[1].join(", ")}]]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Arrows show −∇f = b − ½(A + Aᵀ)x, the downhill direction, for f(x) = ½xᵀAx − bᵀx; the circle is where ∇f = 0.{" "}
        {pi === 0
          ? "A is symmetric and positive definite: every arrow leads to the unique minimiser, the solution of Ax = b."
          : pi === 1
            ? "This A is not symmetric, but its symmetric part is the same as the first preset's, so the field is identical. Antisymmetric parts contribute nothing to xᵀAx."
            : "With an indefinite A the stationary point is a saddle: arrows flow in along one axis and out along the other."}
      </figcaption>
    </figure>
  );
}
