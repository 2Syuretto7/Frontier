"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -6, xmax: 6, ymin: -5, ymax: 6, w: 420, h: 385 };
const A = [[2, -1], [1, 2]];

/** A matrix times a vector, two ways: rows dotted with x, or x₁ times column 1 plus x₂ times column 2. */
export function ColumnCombViz() {
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(1);
  const c1 = [A[0][0], A[1][0]], c2 = [A[0][1], A[1][1]];
  const p = [x1 * c1[0], x1 * c1[1]];
  const b = [p[0] + x2 * c2[0], p[1] + x2 * c2[1]];
  const { X, Y } = scales(V);
  return (
    <figure className="viz">
      <Axes v={V} label="A x as a combination of the columns of A">
        <Arrow x1={X(0)} y1={Y(0)} x2={X(c1[0])} y2={Y(c1[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(c2[0])} y2={Y(c2[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(p[0])} y2={Y(p[1])} />
        <Arrow x1={X(p[0])} y1={Y(p[1])} x2={X(b[0])} y2={Y(b[1])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(b[0])} y2={Y(b[1])} className="plot-arrow is-hot" />
        <text x={X(c1[0]) + 6} y={Y(c1[1]) + 14} className="viz-label">column 1</text>
        <text x={X(c2[0]) - 6} y={Y(c2[1]) - 6} textAnchor="end" className="viz-label">column 2</text>
      </Axes>
      <div className="viz-sliders">
        <label>x₁ = <span className="mono">{fmtNum(x1)}</span><input type="range" min={-2} max={2} step={0.5} value={x1} onChange={(e) => setX1(Number(e.target.value))} /></label>
        <label>x₂ = <span className="mono">{fmtNum(x2)}</span><input type="range" min={-2} max={2} step={0.5} value={x2} onChange={(e) => setX2(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>by rows: (2x₁ − x₂, x₁ + 2x₂)</td><td className="mono">({fmtNum(2 * x1 - x2)}, {fmtNum(x1 + 2 * x2)})</td></tr>
          <tr><td>by columns: x₁(2, 1) + x₂(−1, 2)</td><td className="mono">({fmtNum(b[0])}, {fmtNum(b[1])})</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        A = [[2, −1], [1, 2]]. The red arrow is Ax, reached by walking x₁ copies of column 1, then x₂ copies of column 2. The two
        rows of the table always agree: Ax is a combination of the columns of A, with the entries of x as the weights.
      </figcaption>
    </figure>
  );
}
