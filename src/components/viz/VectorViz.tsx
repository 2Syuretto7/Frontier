"use client";

import { useState } from "react";
import { Arrow, Axes, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -5, xmax: 7, ymin: -5, ymax: 6, w: 420, h: 385 };
const u = { x: 3, y: 1 };

/** Adding vectors by the parallelogram rule, and the dot product, which measures the angle between them. */
export function VectorViz() {
  const [vx, setVx] = useState(1);
  const [vy, setVy] = useState(2);
  const { X, Y } = scales(V);
  const s = { x: u.x + vx, y: u.y + vy };
  const dot = u.x * vx + u.y * vy;
  const lu = Math.hypot(u.x, u.y), lv = Math.hypot(vx, vy);
  const ang = lv === 0 ? null : (Math.acos(Math.max(-1, Math.min(1, dot / (lu * lv)))) * 180) / Math.PI;
  const o = { x: X(0), y: Y(0) };

  return (
    <figure className="viz">
      <Axes v={V} label={`u = (3, 1), v = (${vx}, ${vy}), u + v = (${s.x}, ${s.y}), dot product ${dot}`}>
        <line x1={X(u.x)} y1={Y(u.y)} x2={X(s.x)} y2={Y(s.y)} className="plot-ghost" />
        <line x1={X(vx)} y1={Y(vy)} x2={X(s.x)} y2={Y(s.y)} className="plot-ghost" />
        <Arrow x1={o.x} y1={o.y} x2={X(s.x)} y2={Y(s.y)} className="plot-arrow is-hot" />
        <Arrow x1={o.x} y1={o.y} x2={X(u.x)} y2={Y(u.y)} />
        <Arrow x1={o.x} y1={o.y} x2={X(vx)} y2={Y(vy)} className="plot-arrow is-muted" />
        <text x={X(u.x) + 8} y={Y(u.y) + 14} className="viz-label is-on">u</text>
        {lv > 0 && <text x={X(vx) + (vx >= 0 ? 8 : -8)} y={Y(vy) - 6} textAnchor={vx >= 0 ? "start" : "end"} className="viz-label">v</text>}
        {(s.x !== 0 || s.y !== 0) && <text x={X(s.x) + 8} y={Y(s.y) - 6} className="viz-label" style={{ fill: "var(--danger)" }}>u + v</text>}
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>v across <span className="mono">{fmtNum(vx)}</span></span>
          <input type="range" min={-4} max={4} step={1} value={vx} onChange={(e) => setVx(Number(e.target.value))} />
        </label>
        <label>
          <span>v up <span className="mono">{fmtNum(vy)}</span></span>
          <input type="range" min={-4} max={4} step={1} value={vy} onChange={(e) => setVy(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">u + v = ({fmtNum(s.x)}, {fmtNum(s.y)})</span>, the diagonal of the parallelogram. The dot product is{" "}
        <span className="mono">u · v = 3 × {fmtNum(vx)} + 1 × {fmtNum(vy)} = {fmtNum(dot)}</span>
        {ang === null
          ? <>; v is the zero vector, which has no direction.</>
          : dot === 0
            ? <>, so u and v are perpendicular.</>
            : <>, so the angle between them is about <span className="mono">{ang.toFixed(1)}°</span>{dot < 0 ? ", more than a right angle" : ""}.</>}
      </figcaption>
    </figure>
  );
}
