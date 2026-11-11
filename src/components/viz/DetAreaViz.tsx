"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { MatrixView } from "./MatrixView";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -3, xmax: 4, ymin: -3, ymax: 4, w: 360, h: 360 };

/** The determinant as the signed area of the parallelogram spanned by the columns. */
export function DetAreaViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0.5);
  const [d, setD] = useState(1.5);
  const { X, Y } = scales(V);
  const D = a * d - b * c;
  const pts = [[0, 0], [a, c], [a + b, c + d], [b, d]].map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
  const col = D > 1e-9 ? "var(--accent)" : D < -1e-9 ? "var(--danger)" : "var(--text-muted)";
  const s = (label: string, v: number, set: (x: number) => void) => (
    <label>{label} = <span className="mono">{fmtNum(v)}</span><input type="range" min={-2} max={3} step={0.25} value={v} onChange={(e) => set(Number(e.target.value))} /></label>
  );
  return (
    <figure className="viz">
      <Axes v={V} label="The unit square and its image, a parallelogram">
        <polygon points={[[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")} className="plot-ghost" style={{ fill: "none" }} />
        <polygon points={pts} style={{ fill: `color-mix(in srgb, ${col} 18%, transparent)`, stroke: col, strokeWidth: 1.5 }} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(a)} y2={Y(c)} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(b)} y2={Y(d)} className="plot-arrow is-hot" />
      </Axes>
      <div className="viz-sliders">{s("a", a, setA)}{s("b", b, setB)}{s("c", c, setC)}{s("d", d, setD)}</div>
      <div className="mat-row"><MatrixView M={[[a, b], [c, d]]} label="A" /><span className="mono">det A = ad − bc = {fmtNum(Number(D.toFixed(4)))}</span></div>
      <figcaption className="viz-caption" aria-live="polite">
        The columns (a, c) in blue and (b, d) in red span a parallelogram, the image of the dashed unit square. Its area is |det A| = {fmtNum(Number(Math.abs(D).toFixed(4)))}.{" "}
        {D > 1e-9 ? "The determinant is positive: going from the first column to the second is anticlockwise, as from e₁ to e₂." : D < -1e-9 ? "The determinant is negative: the order of the columns is clockwise, so A flips orientation, like a mirror." : "The determinant is 0: the parallelogram is flat, so A squashes the plane onto a line and has no inverse."}
      </figcaption>
    </figure>
  );
}
