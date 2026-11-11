"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { mul, svd, T, type Mat } from "./la";
import { Arrow, Axes, paramPath, scales, type View } from "./Plot";

const V: View = { xmin: -7, xmax: 7, ymin: -7, ymax: 7, w: 360, h: 360 };
const A: Mat = [[3, 0], [4, 5]];
const { U, s, V: Vm } = svd(A);
const S: Mat = [[s[0], 0], [0, s[1]]];
const MAPS: Mat[] = [[[1, 0], [0, 1]], T(Vm), mul(S, T(Vm)), mul(U, mul(S, T(Vm)))];

/** A = UΣVᵀ as rotate, stretch, rotate, acting on the unit circle. */
export function SvdStepsViz() {
  const [k, setK] = useState(0);
  const M = MAPS[k];
  const ap = (p: number[]) => [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]];
  const { X, Y } = scales(V);
  const circ = paramPath(V, (t) => ap([Math.cos(t), Math.sin(t)]) as [number, number], 0, 2 * Math.PI, 200);
  const v1 = ap([Vm[0][0], Vm[1][0]]), v2 = ap([Vm[0][1], Vm[1][1]]);
  const notes = [
    `The unit circle, with the right singular vectors v₁ = (${fmtNum(Number(Vm[0][0].toFixed(3)))}, ${fmtNum(Number(Vm[1][0].toFixed(3)))}) in blue and v₂ in red. They are perpendicular.`,
    "Vᵀ is a rotation (or reflection). It turns v₁ and v₂ onto the axes. The circle is still a circle.",
    `Σ stretches along the axes by σ₁ = ${fmtNum(Number(s[0].toFixed(3)))} and σ₂ = ${fmtNum(Number(s[1].toFixed(3)))}. The circle becomes an ellipse lined up with the axes.`,
    `U rotates the ellipse into place. The result is exactly A applied to the circle: Av₁ = σ₁u₁ and Av₂ = σ₂u₂ are its axes. σ₁σ₂ = ${fmtNum(Number((s[0] * s[1]).toFixed(3)))} = |det A|.`,
  ];
  return (
    <figure className="viz">
      <Axes v={V} label="The unit circle under Vᵀ, then Σ, then U">
        <path d={circ} className="plot-curve" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(v1[0])} y2={Y(v1[1])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(v2[0])} y2={Y(v2[1])} className="plot-arrow is-hot" />
      </Axes>
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(3, k + 1))} disabled={k === 3}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">A = [[3, 0], [4, 5]]. Step {k + 1} of 4. {notes[k]}</figcaption>
    </figure>
  );
}
