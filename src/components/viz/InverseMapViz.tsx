"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { det2, inv2, type Mat } from "./la";
import { MatrixView } from "./MatrixView";
import { Axes, scales, type View } from "./Plot";

const V: View = { xmin: -4, xmax: 4, ymin: -4, ymax: 4, w: 360, h: 360 };
const SHAPE = [[0, 0], [1, 0], [1, 0.4], [0.4, 0.4], [0.4, 1], [1, 1], [1, 1.4], [0, 1.4]];

/** A 2 × 2 matrix acting on a shape, and its inverse undoing it, until the determinant reaches 0. */
export function InverseMapViz() {
  const [b, setB] = useState(1);
  const [d, setD] = useState(1.5);
  const A: Mat = [[2, b], [1, d]];
  const Ai = inv2(A);
  const { X, Y } = scales(V);
  const poly = (M: Mat) => SHAPE.map(([x, y]) => `${X(M[0][0] * x + M[0][1] * y).toFixed(1)},${Y(M[1][0] * x + M[1][1] * y).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <Axes v={V} label="A shape, its image under A, and the image brought back by the inverse">
        <polygon points={poly([[1, 0], [0, 1]])} style={{ fill: "var(--accent-soft)", stroke: "var(--accent)", strokeWidth: 1.5 }} />
        <polygon points={poly(A)} style={{ fill: "color-mix(in srgb, var(--danger) 15%, transparent)", stroke: "var(--danger)", strokeWidth: 1.5 }} />
      </Axes>
      <div className="viz-sliders">
        <label>entry a₁₂ = <span className="mono">{fmtNum(b)}</span><input type="range" min={-2} max={3} step={0.25} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
        <label>entry a₂₂ = <span className="mono">{fmtNum(d)}</span><input type="range" min={-2} max={3} step={0.25} value={d} onChange={(e) => setD(Number(e.target.value))} /></label>
      </div>
      <div className="mat-row">
        <MatrixView M={A} label="A" />
        {Ai ? <MatrixView M={Ai} label="A⁻¹" /> : <span className="mat-label">A⁻¹ does not exist</span>}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The blue shape is mapped by A to the red one. det A = 2·{fmtNum(d)} − {fmtNum(b)}·1 = {fmtNum(det2(A))}.{" "}
        {Ai ? "Because the red shape is not flat, every point of it came from exactly one point, and A⁻¹ sends it back." : "The red shape has collapsed onto a line: different points have landed in the same place, so no matrix can undo A. Its determinant is 0 and it has no inverse."}
      </figcaption>
    </figure>
  );
}
