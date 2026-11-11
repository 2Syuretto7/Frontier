"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { symEig } from "./la";
import { Arrow, Axes, paramPath, scales, type View } from "./Plot";

const V: View = { xmin: -4, xmax: 4, ymin: -4, ymax: 4, w: 360, h: 360 };

/** A symmetric matrix maps the unit circle to an ellipse whose axes are its perpendicular eigenvectors. */
export function SymEllipseViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1.5);
  const { values, vectors } = symEig([[a, b], [b, c]]);
  const { X, Y } = scales(V);
  const img = paramPath(V, (t) => [a * Math.cos(t) + b * Math.sin(t), b * Math.cos(t) + c * Math.sin(t)], 0, 2 * Math.PI, 200);
  const e = [0, 1].map((k) => [vectors[0][k], vectors[1][k]]);
  const dotp = e[0][0] * e[1][0] + e[0][1] * e[1][1];
  const s = (label: string, v: number, set: (x: number) => void) => (
    <label>{label} = <span className="mono">{fmtNum(v)}</span><input type="range" min={-3} max={3} step={0.25} value={v} onChange={(e) => set(Number(e.target.value))} /></label>
  );
  return (
    <figure className="viz">
      <Axes v={V} label="The unit circle and its image under a symmetric matrix">
        <circle cx={X(0)} cy={Y(0)} r={X(1) - X(0)} className="plot-ghost" style={{ fill: "none" }} />
        <path d={img} className="plot-curve" />
        {[0, 1].map((k) => (
          <Arrow key={k} x1={X(0)} y1={Y(0)} x2={X(values[k] * e[k][0])} y2={Y(values[k] * e[k][1])} className={"plot-arrow" + (k === 1 ? " is-hot" : "")} />
        ))}
      </Axes>
      <div className="viz-sliders">{s("a", a, setA)}{s("b (both off-diagonal entries)", b, setB)}{s("c", c, setC)}</div>
      <figcaption className="viz-caption" aria-live="polite">
        S = [[{fmtNum(a)}, {fmtNum(b)}], [{fmtNum(b)}, {fmtNum(c)}]]. Eigenvalues λ₁ = {fmtNum(Number(values[0].toFixed(3)))} and λ₂ = {fmtNum(Number(values[1].toFixed(3)))}, both real.
        The arrows are λ₁q₁ and λ₂q₂: they lie along the axes of the ellipse, and q₁ · q₂ = {fmtNum(Number(dotp.toFixed(10)))}. However you set the sliders, the eigenvectors stay perpendicular.
        {values[1] < 0 ? " A negative eigenvalue flips that axis, which is why the arrow points the other way." : ""}
      </figcaption>
    </figure>
  );
}
