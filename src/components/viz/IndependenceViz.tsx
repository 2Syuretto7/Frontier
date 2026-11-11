"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 360, h: 360 };

/** Two vectors are independent unless one is a multiple of the other; any third vector in the plane is a combination of two independent ones. */
export function IndependenceViz() {
  const [deg, setDeg] = useState(70);
  const [third, setThird] = useState(false);
  const u = [3, 1];
  const th = (deg * Math.PI) / 180;
  // At 18° the slider snaps v onto the line of u (whose direction is 18.43°), so the dependent case can be reached.
  const v = deg === 18 ? [(2.5 * 3) / Math.hypot(3, 1), (2.5 * 1) / Math.hypot(3, 1)] : [2.5 * Math.cos(th), 2.5 * Math.sin(th)];
  const w = [-2, 3];
  const det = u[0] * v[1] - u[1] * v[0];
  const indep = Math.abs(det) > 1e-6;
  // w = a u + b v
  const a = indep ? (w[0] * v[1] - w[1] * v[0]) / det : NaN, b = indep ? (u[0] * w[1] - u[1] * w[0]) / det : NaN;
  const { X, Y } = scales(V);
  return (
    <figure className="viz">
      <Axes v={V} label="Two or three vectors in the plane">
        {!indep && <line x1={X(-6)} y1={Y(-2)} x2={X(6)} y2={Y(2)} className="plot-ghost" />}
        <Arrow x1={X(0)} y1={Y(0)} x2={X(u[0])} y2={Y(u[1])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(v[0])} y2={Y(v[1])} className="plot-arrow is-muted" />
        {third && <Arrow x1={X(0)} y1={Y(0)} x2={X(w[0])} y2={Y(w[1])} className="plot-arrow is-hot" />}
        <text x={X(u[0]) + 6} y={Y(u[1]) + 14} className="viz-label is-on">u</text>
        <text x={X(v[0]) + 6} y={Y(v[1]) - 6} className="viz-label">v</text>
        {third && <text x={X(w[0]) - 8} y={Y(w[1]) - 6} textAnchor="end" className="viz-label" style={{ fill: "var(--danger)" }}>w</text>}
      </Axes>
      <div className="viz-sliders">
        <label>direction of v = <span className="mono">{deg}°</span> (try 18°)<input type="range" min={0} max={180} step={1} value={deg} onChange={(e) => setDeg(Number(e.target.value))} /></label>
      </div>
      <div className="viz-controls"><button type="button" className="btn" onClick={() => setThird(!third)}>{third ? "Remove" : "Add"} a third vector w</button></div>
      <figcaption className="viz-caption" aria-live="polite">
        {indep
          ? `u and v point in different directions, so the only way to get a·u + b·v = 0 is a = b = 0: they are independent.${third ? ` But three vectors in the plane are always dependent: w = ${fmtNum(Number(a.toFixed(2)))}·u + ${fmtNum(Number(b.toFixed(2)))}·v.` : ""}`
          : "v is now a multiple of u (they lie on one line), so some combination a·u + b·v with a, b not both 0 equals 0: they are dependent, and together they span only a line."}
      </figcaption>
    </figure>
  );
}
