"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -4, xmax: 5, ymin: -3, ymax: 4, w: 420, h: 327 };

/** The dot product as length times length times cosine, and the shadow (projection) of one vector on another. */
export function DotAngleViz() {
  const [deg, setDeg] = useState(60);
  const [len, setLen] = useState(2.5);
  const u = [3, 0];
  const th = (deg * Math.PI) / 180;
  const v = [len * Math.cos(th), len * Math.sin(th)];
  const d = u[0] * v[0] + u[1] * v[1];
  const { X, Y } = scales(V);
  const shadow = v[0];
  return (
    <figure className="viz">
      <Axes v={V} label={`Two vectors at ${deg} degrees; their dot product is ${d.toFixed(2)}`}>
        <line x1={X(v[0])} y1={Y(v[1])} x2={X(shadow)} y2={Y(0)} className="plot-mirror" />
        <line x1={X(0)} y1={Y(0)} x2={X(shadow)} y2={Y(0)} style={{ stroke: "var(--danger)", strokeWidth: 5, opacity: 0.6 }} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(u[0])} y2={Y(u[1])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(v[0])} y2={Y(v[1])} className="plot-arrow is-muted" />
        <text x={X(u[0]) + 6} y={Y(0) + 16} className="viz-label is-on">u</text>
        <text x={X(v[0]) + 6} y={Y(v[1]) - 6} className="viz-label">v</text>
      </Axes>
      <div className="viz-sliders">
        <label>angle θ = <span className="mono">{deg}°</span><input type="range" min={0} max={180} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} /></label>
        <label>length of v = <span className="mono">{fmtNum(len)}</span><input type="range" min={0.5} max={4} step={0.25} value={len} onChange={(e) => setLen(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>u · v = u₁v₁ + u₂v₂</td><td className="mono">{d.toFixed(3)}</td></tr>
          <tr><td>‖u‖ ‖v‖ cos θ</td><td className="mono">{(3 * len * Math.cos(th)).toFixed(3)}</td></tr>
          <tr><td>red shadow of v on u (signed)</td><td className="mono">{shadow.toFixed(3)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The two rows agree for every angle and length: the dot product is the length of u times the signed length of v&rsquo;s
        shadow on u. {deg === 90 ? "At 90° the shadow vanishes and the dot product is 0: the vectors are perpendicular." : deg > 90 ? "Past 90° the shadow points backwards, so the dot product is negative." : "Below 90° the dot product is positive."}
      </figcaption>
    </figure>
  );
}
