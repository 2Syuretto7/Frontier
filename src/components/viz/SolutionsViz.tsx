"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 380, h: 380 };

/** Two equations in two unknowns as two lines: one crossing, none (parallel), or infinitely many (the same line). */
export function SolutionsViz() {
  const [m, setM] = useState(-0.5);
  const [c, setC] = useState(1);
  // Line 1: x + y = 2 (y = 2 − x). Line 2: y = m x + c, i.e. −m x + y = c.
  const det = 1 * 1 - 1 * -m; // rows (1, 1) and (−m, 1)
  const same = Math.abs(m + 1) < 1e-9 && Math.abs(c - 2) < 1e-9;
  const par = Math.abs(m + 1) < 1e-9 && !same;
  const x = det !== 0 ? (2 - c) / (1 + m) : NaN, y = 2 - x;
  const { X, Y } = scales(V);
  return (
    <figure className="viz">
      <Axes v={V} label="Two lines in the plane">
        <path d={curvePath(V, (t) => 2 - t, 2)} className="plot-curve" />
        <path d={curvePath(V, (t) => m * t + c, 2)} className={same ? "plot-ghost" : "plot-curve-2"} style={{ strokeWidth: same ? 4 : undefined }} />
        {Number.isFinite(x) && !same && <circle cx={X(x)} cy={Y(y)} r={5} className="plot-hot" />}
      </Axes>
      <div className="viz-sliders">
        <label>slope of the second line = <span className="mono">{fmtNum(m)}</span><input type="range" min={-3} max={3} step={0.25} value={m} onChange={(e) => setM(Number(e.target.value))} /></label>
        <label>its height at x = 0 = <span className="mono">{fmtNum(c)}</span><input type="range" min={-3} max={3} step={0.5} value={c} onChange={(e) => setC(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The equations are x + y = 2 (solid) and −({fmtNum(m)})x + y = {fmtNum(c)} (dashed).{" "}
        {same ? "They are the same line: every point on it is a solution, so there are infinitely many." : par ? "The lines are parallel and distinct: there is no solution. The rows of the matrix are dependent, but the right-hand sides do not match." : `Exactly one solution, x = ${fmtNum(Number(x.toFixed(3)))}, y = ${fmtNum(Number(y.toFixed(3)))}. Make the slopes equal (−1) to lose it.`}
      </figcaption>
    </figure>
  );
}
