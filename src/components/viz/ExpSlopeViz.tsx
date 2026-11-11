"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const V: View = { xmin: -2, xmax: 2, ymin: -1, ymax: 6, w: 520, h: 280 };

/** Exponentials b^x and their tangents: the slope is always ln b times the height, and equals the height exactly when b = e. */
export function ExpSlopeViz() {
  const [b, setB] = useState(2);
  const [a, setA] = useState(1);
  const { X, Y } = scales(V);
  const f = (x: number) => b ** x;
  const h = 1e-6;
  const slope = (f(a + h) - f(a - h)) / (2 * h);
  const ratio = slope / f(a);
  return (
    <figure className="viz">
      <Axes v={V} label={`The graph of ${fmtNum(b)} to the power x, with its tangent at x = ${fmtNum(a)}`}>
        <path d={curvePath(V, Math.exp, 300)} className="plot-ghost" />
        <path d={curvePath(V, f, 400)} className="plot-curve" />
        <path d={curvePath(V, (x) => f(a) + slope * (x - a), 2)} style={{ fill: "none", stroke: "var(--danger)", strokeWidth: 2 }} />
        <circle cx={X(a)} cy={Y(f(a))} r={5} className="plot-hot" />
      </Axes>
      <div className="viz-sliders">
        <label>Base b = <span className="mono">{fmtNum(b)}</span><input type="range" min={1.2} max={4} step={0.01} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
        <label>Point x = <span className="mono">{fmtNum(a)}</span><input type="range" min={-1.5} max={1.6} step={0.05} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>height b<sup>x</sup></td><td className="mono">{fmtNum(Number(f(a).toFixed(4)))}</td></tr>
          <tr><td>slope of the tangent</td><td className="mono">{fmtNum(Number(slope.toFixed(4)))}</td></tr>
          <tr><td>slope ÷ height</td><td className="mono">{fmtNum(Number(ratio.toFixed(4)))}</td></tr>
          <tr><td>ln b</td><td className="mono">{fmtNum(Number(Math.log(b).toFixed(4)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Move the point: slope ÷ height does not change, so the slope of b<sup>x</sup> is a fixed multiple of its height. Move the
        base: the multiple is ln b, and it is exactly 1 when b = e ≈ 2.718, where the curve lies on the dashed graph of e<sup>x</sup>.
        {Math.abs(b - Math.E) < 0.02 ? " You have found e: here the slope equals the height." : ""}
      </figcaption>
    </figure>
  );
}
