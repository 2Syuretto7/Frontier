"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -2, xmax: 4, ymin: -1, ymax: 4, w: 400, h: 333 };
const a = [3, 1], b = [1, 2];

/** Gram-Schmidt on two vectors: normalise a, subtract from b its projection on q₁, normalise what is left. */
export function GramSchmidtViz() {
  const [k, setK] = useState(0);
  const na = Math.hypot(a[0], a[1]);
  const q1 = [a[0] / na, a[1] / na];
  const r12 = q1[0] * b[0] + q1[1] * b[1];
  const B = [b[0] - r12 * q1[0], b[1] - r12 * q1[1]];
  const r22 = Math.hypot(B[0], B[1]);
  const q2 = [B[0] / r22, B[1] / r22];
  const { X, Y } = scales(V);
  const notes = [
    "Start with two independent vectors a and b. They are not perpendicular.",
    `q₁ = a / ‖a‖: same direction as a, length 1. ‖a‖ = √10 ≈ ${na.toFixed(3)}.`,
    `Remove from b its component along q₁, which is (q₁ · b) q₁ with q₁ · b ≈ ${r12.toFixed(3)} (red). What is left, B = b − (q₁ · b) q₁, is perpendicular to q₁.`,
    `q₂ = B / ‖B‖ with ‖B‖ ≈ ${r22.toFixed(3)}. Now q₁ and q₂ are orthonormal and span the same plane as a and b. The numbers ‖a‖, q₁ · b and ‖B‖ form R in A = QR.`,
  ];
  return (
    <figure className="viz">
      <Axes v={V} label="Gram-Schmidt on two vectors">
        <Arrow x1={X(0)} y1={Y(0)} x2={X(a[0])} y2={Y(a[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(b[0])} y2={Y(b[1])} className="plot-arrow is-muted" />
        <text x={X(a[0]) + 6} y={Y(a[1]) + 4} className="viz-label">a</text>
        <text x={X(b[0]) + 6} y={Y(b[1]) - 4} className="viz-label">b</text>
        {k >= 1 && <Arrow x1={X(0)} y1={Y(0)} x2={X(q1[0])} y2={Y(q1[1])} />}
        {k >= 2 && <Arrow x1={X(0)} y1={Y(0)} x2={X(r12 * q1[0])} y2={Y(r12 * q1[1])} className="plot-arrow is-hot" />}
        {k >= 2 && <Arrow x1={X(r12 * q1[0])} y1={Y(r12 * q1[1])} x2={X(b[0])} y2={Y(b[1])} className="plot-arrow is-muted" />}
        {k >= 2 && <Arrow x1={X(0)} y1={Y(0)} x2={X(B[0])} y2={Y(B[1])} className="plot-arrow is-hot" />}
        {k >= 3 && <Arrow x1={X(0)} y1={Y(0)} x2={X(q2[0])} y2={Y(q2[1])} />}
        {k >= 1 && <text x={X(q1[0]) + 4} y={Y(q1[1]) + 16} className="viz-label is-on">q₁</text>}
        {k >= 3 && <text x={X(q2[0]) - 6} y={Y(q2[1]) - 6} textAnchor="end" className="viz-label is-on">q₂</text>}
      </Axes>
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(3, k + 1))} disabled={k === 3}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {k + 1} of 4. {notes[k]} {k === 3 ? `Check: q₁ · q₂ = ${fmtNum(Number((q1[0] * q2[0] + q1[1] * q2[1]).toFixed(10)))}.` : ""}</figcaption>
    </figure>
  );
}
