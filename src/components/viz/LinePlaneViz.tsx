"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 380, h: 380 };

/** A line in the plane two ways: points p + t·d, and the points x with n · x = c. */
export function LinePlaneViz() {
  const [deg, setDeg] = useState(30);
  const [c, setC] = useState(2);
  const [t, setT] = useState(1);
  const th = (deg * Math.PI) / 180;
  const n = [Math.cos(th), Math.sin(th)];
  const d = [-n[1], n[0]];
  const p = [c * n[0], c * n[1]];
  const x = [p[0] + t * d[0], p[1] + t * d[1]];
  const { X, Y } = scales(V);
  return (
    <figure className="viz">
      <Axes v={V} label="A line described by a point and direction, and by a normal vector">
        <line x1={X(p[0] - 10 * d[0])} y1={Y(p[1] - 10 * d[1])} x2={X(p[0] + 10 * d[0])} y2={Y(p[1] + 10 * d[1])} className="plot-curve" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(n[0] * 1.5)} y2={Y(n[1] * 1.5)} className="plot-arrow is-hot" />
        <Arrow x1={X(p[0])} y1={Y(p[1])} x2={X(p[0] + 1.5 * d[0])} y2={Y(p[1] + 1.5 * d[1])} className="plot-arrow is-muted" />
        <line x1={X(0)} y1={Y(0)} x2={X(p[0])} y2={Y(p[1])} className="plot-mirror" />
        <circle cx={X(p[0])} cy={Y(p[1])} r={4} className="plot-point" />
        <circle cx={X(x[0])} cy={Y(x[1])} r={5} className="plot-hot" />
        <text x={X(n[0] * 1.5) + 6} y={Y(n[1] * 1.5)} className="viz-label">n</text>
      </Axes>
      <div className="viz-sliders">
        <label>direction of n = <span className="mono">{deg}°</span><input type="range" min={0} max={180} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} /></label>
        <label>c = <span className="mono">{fmtNum(c)}</span><input type="range" min={-3} max={3} step={0.5} value={c} onChange={(e) => setC(Number(e.target.value))} /></label>
        <label>t = <span className="mono">{fmtNum(t)}</span><input type="range" min={-4} max={4} step={0.25} value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The red point is <span className="mono">p + t·d = ({fmtNum(Number(x[0].toFixed(2)))}, {fmtNum(Number(x[1].toFixed(2)))})</span>, and for every t its dot product with the unit normal n is{" "}
        <span className="mono">{fmtNum(Number((x[0] * n[0] + x[1] * n[1]).toFixed(2)))}</span> = c. The line is all points with n · x = c; since n has length 1, |c| is the line&rsquo;s distance from the origin (dotted).
      </figcaption>
    </figure>
  );
}
