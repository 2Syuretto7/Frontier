"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -2, xmax: 6, ymin: -2, ymax: 5, w: 400, h: 350 };
const a = [3, 1];

/** Projecting b onto the line through a: p = (aᵀb / aᵀa) a, with the error e = b − p perpendicular to a. */
export function ProjectionViz() {
  const [bx, setBx] = useState(2);
  const [by, setBy] = useState(3);
  const { X, Y } = scales(V);
  const xhat = (a[0] * bx + a[1] * by) / (a[0] * a[0] + a[1] * a[1]);
  const p = [xhat * a[0], xhat * a[1]];
  const e = [bx - p[0], by - p[1]];
  return (
    <figure className="viz">
      <Axes v={V} label="Projection of b onto the line through a">
        <line x1={X(-2 * a[0])} y1={Y(-2 * a[1])} x2={X(3 * a[0])} y2={Y(3 * a[1])} className="plot-ghost" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(a[0])} y2={Y(a[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(bx)} y2={Y(by)} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(p[0])} y2={Y(p[1])} className="plot-arrow is-hot" />
        <line x1={X(p[0])} y1={Y(p[1])} x2={X(bx)} y2={Y(by)} className="plot-line" style={{ strokeDasharray: "4 3" }} />
        <text x={X(bx) + 6} y={Y(by) - 6} className="viz-label is-on">b</text>
        <text x={X(a[0]) + 4} y={Y(a[1]) + 16} className="viz-label">a</text>
        <text x={X(p[0]) + 6} y={Y(p[1]) + 16} className="viz-label" style={{ fill: "var(--danger)" }}>p</text>
      </Axes>
      <div className="viz-sliders">
        <label>b₁ = <span className="mono">{bx}</span><input type="range" min={-1} max={5} step={0.5} value={bx} onChange={(e) => setBx(Number(e.target.value))} /></label>
        <label>b₂ = <span className="mono">{by}</span><input type="range" min={-1} max={4} step={0.5} value={by} onChange={(e) => setBy(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>x̂ = aᵀb / aᵀa</td><td className="mono">{fmtNum(Number(xhat.toFixed(3)))}</td></tr>
          <tr><td>p = x̂ a</td><td className="mono">({fmtNum(Number(p[0].toFixed(3)))}, {fmtNum(Number(p[1].toFixed(3)))})</td></tr>
          <tr><td>e = b − p</td><td className="mono">({fmtNum(Number(e[0].toFixed(3)))}, {fmtNum(Number(e[1].toFixed(3)))})</td></tr>
          <tr><td>aᵀe</td><td className="mono">{fmtNum(Number((a[0] * e[0] + a[1] * e[1]).toFixed(6)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        p is the point on the line closest to b. The dashed error e = b − p always meets the line at a right angle, which is the
        equation that gives x̂: aᵀ(b − x̂a) = 0.
      </figcaption>
    </figure>
  );
}
