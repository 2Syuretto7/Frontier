"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -3, xmax: 9, ymin: -6, ymax: 8, w: 360, h: 420 };
const v1 = [1, 1], v2 = [1, -2];
const l1 = 5, l2 = 2;

/** A = XΛX⁻¹ in three moves: write x in eigenvector coordinates, stretch each coordinate by its eigenvalue, add back up. */
export function DiagonaliseViz() {
  const [k, setK] = useState(0);
  const x = [2, 0.5];
  // x = c1 v1 + c2 v2: c1 + c2 = 2, c1 − 2c2 = 0.5
  const c2 = (x[0] - x[1]) / 3, c1 = x[0] - c2;
  const p1 = [c1 * v1[0], c1 * v1[1]], p2 = [c2 * v2[0], c2 * v2[1]];
  const q1 = [l1 * p1[0], l1 * p1[1]], q2 = [l2 * p2[0], l2 * p2[1]];
  const Ax = [q1[0] + q2[0], q1[1] + q2[1]];
  const { X, Y } = scales(V);
  const notes = [
    "x = (2, 0.5). The eigenvectors of A = [[4, 1], [2, 3]] are v₁ = (1, 1) with λ₁ = 5 and v₂ = (1, −2) with λ₂ = 2 (dashed lines).",
    `Step 1, X⁻¹x: split x along the eigenvectors. x = ${fmtNum(c1)} v₁ + ${fmtNum(c2)} v₂. The pieces are the blue arrows.`,
    `Step 2, Λ: stretch each piece by its own eigenvalue, ${fmtNum(c1)} v₁ by 5 and ${fmtNum(c2)} v₂ by 2. No mixing between directions.`,
    `Step 3, X: add the stretched pieces back together. The result (${fmtNum(Ax[0])}, ${fmtNum(Ax[1])}) is exactly Ax = (4·2 + 1·0.5, 2·2 + 3·0.5).`,
  ];
  const line = (v: number[]) => <line x1={X(-10 * v[0])} y1={Y(-10 * v[1])} x2={X(10 * v[0])} y2={Y(10 * v[1])} className="plot-ghost" />;
  return (
    <figure className="viz">
      <Axes v={V} label="Diagonalisation as a change to eigenvector coordinates">
        {line(v1)}{line(v2)}
        <Arrow x1={X(0)} y1={Y(0)} x2={X(x[0])} y2={Y(x[1])} className="plot-arrow is-muted" />
        <text x={X(x[0]) + 6} y={Y(x[1]) + 4} className="viz-label">x</text>
        {k === 1 && <><Arrow x1={X(0)} y1={Y(0)} x2={X(p1[0])} y2={Y(p1[1])} /><Arrow x1={X(0)} y1={Y(0)} x2={X(p2[0])} y2={Y(p2[1])} /></>}
        {k >= 2 && <><Arrow x1={X(0)} y1={Y(0)} x2={X(q1[0])} y2={Y(q1[1])} /><Arrow x1={X(0)} y1={Y(0)} x2={X(q2[0])} y2={Y(q2[1])} /></>}
        {k === 3 && <>
          <line x1={X(q1[0])} y1={Y(q1[1])} x2={X(Ax[0])} y2={Y(Ax[1])} className="plot-line" style={{ strokeDasharray: "4 3" }} />
          <line x1={X(q2[0])} y1={Y(q2[1])} x2={X(Ax[0])} y2={Y(Ax[1])} className="plot-line" style={{ strokeDasharray: "4 3" }} />
          <Arrow x1={X(0)} y1={Y(0)} x2={X(Ax[0])} y2={Y(Ax[1])} className="plot-arrow is-hot" />
          <text x={X(Ax[0]) - 6} y={Y(Ax[1]) - 8} textAnchor="end" className="viz-label is-on">Ax</text>
        </>}
      </Axes>
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(3, k + 1))} disabled={k === 3}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {k + 1} of 4. {notes[k]}</figcaption>
    </figure>
  );
}
