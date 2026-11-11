"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 360, h: 360 };

/** For a rank-one matrix with rows along r, the row space and the null space are perpendicular lines; every x splits into one piece from each. */
export function ComplementViz() {
  const [deg, setDeg] = useState(30);
  const [px, setPx] = useState(3);
  const [py, setPy] = useState(1);
  const th = (deg * Math.PI) / 180;
  const r = [Math.cos(th), Math.sin(th)], n = [-r[1], r[0]];
  const a = px * r[0] + py * r[1], b = px * n[0] + py * n[1];
  const xr = [a * r[0], a * r[1]], xn = [b * n[0], b * n[1]];
  const { X, Y } = scales(V);
  return (
    <figure className="viz">
      <Axes v={V} label="The row space and the null space as perpendicular lines">
        <line x1={X(-8 * r[0])} y1={Y(-8 * r[1])} x2={X(8 * r[0])} y2={Y(8 * r[1])} className="plot-curve" />
        <line x1={X(-8 * n[0])} y1={Y(-8 * n[1])} x2={X(8 * n[0])} y2={Y(8 * n[1])} className="plot-curve-2" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(xr[0])} y2={Y(xr[1])} />
        <Arrow x1={X(xr[0])} y1={Y(xr[1])} x2={X(px)} y2={Y(py)} className="plot-arrow is-muted" />
        <circle cx={X(px)} cy={Y(py)} r={6} className="plot-hot" />
      </Axes>
      <div className="viz-sliders">
        <label>direction of the rows = <span className="mono">{deg}°</span><input type="range" min={0} max={175} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} /></label>
        <label>x₁ = <span className="mono">{px}</span><input type="range" min={-4} max={4} step={1} value={px} onChange={(e) => setPx(Number(e.target.value))} /></label>
        <label>x₂ = <span className="mono">{py}</span><input type="range" min={-4} max={4} step={1} value={py} onChange={(e) => setPy(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A matrix whose rows are all multiples of r = ({fmtNum(Number(r[0].toFixed(2)))}, {fmtNum(Number(r[1].toFixed(2)))}) has the solid line as row space. Ax = 0 says x is perpendicular to every row, so the null space is the dashed line at right angles. The red point splits uniquely as a row-space piece (solid arrow, length {fmtNum(Number(a.toFixed(2)))}) plus a null-space piece (grey, length {fmtNum(Number(b.toFixed(2)))}).
      </figcaption>
    </figure>
  );
}
