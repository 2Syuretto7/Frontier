"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { scales, type View } from "./Plot";

const V: View = { xmin: 0, xmax: 3.2, ymin: 0, ymax: 3.2, w: 320, h: 300 };

/** Integration by parts as areas: along a curve (u(t), v(t)), the two regions fill the rectangle uv. */
export function PartsViz() {
  const [t, setT] = useState(1.5);
  const u = (s: number) => 0.5 + s, v = (s: number) => 0.3 + 0.12 * s * s + 0.5 * s;
  const { X, Y } = scales(V);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 120; i++) { const s = (t * i) / 120; pts.push([u(s), v(s)]); }
  const curve = pts.map(([a, b], i) => `${i ? "L" : "M"}${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join(" ");
  const below = `M${X(u(0))} ${Y(0)} ` + pts.map(([a, b]) => `L${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join(" ") + ` L${X(u(t))} ${Y(0)} Z`;
  const left = `M${X(0)} ${Y(v(0))} ` + pts.map(([a, b]) => `L${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join(" ") + ` L${X(0)} ${Y(v(t))} Z`;
  let A = 0, B = 0;
  for (let i = 0; i < 120; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1]; A += ((b0 + b1) / 2) * (a1 - a0); B += ((a0 + a1) / 2) * (b1 - b0); }
  const U = u(t), W = v(t), U0 = u(0), W0 = v(0);
  return (
    <figure className="viz">
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <svg viewBox={`-62 -10 ${V.w + 84} ${V.h + 40}`} className="plot" role="img" aria-label="Two regions under and beside a curve, filling a rectangle">
          <line x1={0} y1={Y(0)} x2={V.w} y2={Y(0)} className="viz-axis" />
          <line x1={X(0)} y1={0} x2={X(0)} y2={V.h} className="viz-axis" />
          <path d={below} className="viz-region" />
          <path d={left} style={{ fill: "color-mix(in srgb, var(--danger) 18%, transparent)", stroke: "var(--danger)", strokeWidth: 1.5 }} />
          <path d={curve} className="plot-curve" />
          <circle cx={X(U)} cy={Y(W)} r={5} className="plot-hot" />
          <text x={X(U)} y={Y(0) + 16} textAnchor="middle" className="plot-tick">u = {fmtNum(Number(U.toFixed(2)))}</text>
          <text x={X(0) - 4} y={Y(W) + 4} textAnchor="end" className="plot-tick">v = {fmtNum(Number(W.toFixed(2)))}</text>
        </svg>
      </div>
      <div className="viz-sliders">
        <label>How far along the curve <input type="range" min={0.2} max={2.6} step={0.02} value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>area under the curve, ∫ v du</td><td className="mono">{A.toFixed(4)}</td></tr>
          <tr><td>red area beside the curve, ∫ u dv</td><td className="mono">{B.toFixed(4)}</td></tr>
          <tr><td>sum</td><td className="mono">{(A + B).toFixed(4)}</td></tr>
          <tr><td>uv at the end − uv at the start</td><td className="mono">{(U * W - U0 * W0).toFixed(4)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        One region lies under the curve and the red one beside it. Together they make the big rectangle u·v minus the small
        one at the start, so ∫ u dv = [uv] − ∫ v du. That is integration by parts: the product rule, read as areas.
      </figcaption>
    </figure>
  );
}
