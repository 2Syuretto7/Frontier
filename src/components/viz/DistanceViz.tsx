"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 7, ymin: -5, ymax: 7, w: 420, h: 388 };
const A = { x: -3, y: -2 };

/** The distance formula is Pythagoras: the horizontal and vertical gaps are the legs of a right triangle. */
export function DistanceViz() {
  const [bx, setBx] = useState(3);
  const [by, setBy] = useState(6);
  const { X, Y } = scales(V);
  const dx = bx - A.x, dy = by - A.y;
  const d = Math.hypot(dx, dy);
  const mx = (A.x + bx) / 2, my = (A.y + by) / 2;
  const exact = Number.isInteger(d);

  return (
    <figure className="viz">
      <Axes v={V} label={`Points A (−3, −2) and B (${bx}, ${by}) at distance ${d.toFixed(2)}`}>
        {dx !== 0 && <line x1={X(A.x)} y1={Y(A.y)} x2={X(bx)} y2={Y(A.y)} className="plot-curve-2" />}
        {dy !== 0 && <line x1={X(bx)} y1={Y(A.y)} x2={X(bx)} y2={Y(by)} className="plot-curve-2" />}
        <line x1={X(A.x)} y1={Y(A.y)} x2={X(bx)} y2={Y(by)} className="plot-curve" />
        {dx !== 0 && <text x={X(A.x + 0.7 * dx)} y={Y(A.y) + (dy >= 0 ? 18 : -8)} textAnchor="middle" className="viz-label">{fmtNum(Math.abs(dx))}</text>}
        {dy !== 0 && <text x={X(bx) + (dx >= 0 ? 8 : -8)} y={Y((A.y + by) / 2) + 4} textAnchor={dx >= 0 ? "start" : "end"} className="viz-label">{fmtNum(Math.abs(dy))}</text>}
        <circle cx={X(A.x)} cy={Y(A.y)} r={5.5} className="plot-point" />
        <circle cx={X(bx)} cy={Y(by)} r={6} className="plot-hot" />
        <circle cx={X(mx)} cy={Y(my)} r={4.5} className="plot-point" style={{ fill: "var(--surface)", stroke: "var(--accent)" }} />
        <text x={X(A.x) + (dx >= 0 ? -8 : 8)} y={Y(A.y) + 16} textAnchor={dx >= 0 ? "end" : "start"} className="viz-label">A</text>
        <text x={X(bx) + 8} y={Y(by) - 8} className="viz-label">B</text>
        <text x={X(mx) + (dx >= 0 ? -8 : 8)} y={Y(my) - 8} textAnchor={dx >= 0 ? "end" : "start"} className="viz-label">M</text>
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>B across <span className="mono">x = {fmtNum(bx)}</span></span>
          <input type="range" min={-5} max={6} step={1} value={bx} onChange={(e) => setBx(Number(e.target.value))} />
        </label>
        <label>
          <span>B up <span className="mono">y = {fmtNum(by)}</span></span>
          <input type="range" min={-4} max={6} step={1} value={by} onChange={(e) => setBy(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The gaps are {fmtNum(Math.abs(dx))} across and {fmtNum(Math.abs(dy))} up, so{" "}
        <span className="mono">AB = √({fmtNum(dx * dx)} + {fmtNum(dy * dy)}) {exact ? "=" : "≈"} {exact ? fmtNum(d) : d.toFixed(2)}</span>.
        The midpoint M is <span className="mono">({fmtNum(mx)}, {fmtNum(my)})</span>, the average of the coordinates.
      </figcaption>
    </figure>
  );
}
