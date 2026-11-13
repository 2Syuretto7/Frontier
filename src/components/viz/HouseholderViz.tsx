"use client";

import { useState } from "react";

/** A Householder reflection maps x to −sign(x₁)‖x‖e₁ by reflecting in the line perpendicular to v = x + sign(x₁)‖x‖e₁. */
export function HouseholderViz() {
  const [deg, setDeg] = useState(53);
  const t = (deg * Math.PI) / 180;
  const r = 1.4;
  const x = [r * Math.cos(t), r * Math.sin(t)];
  const sgn = x[0] >= 0 ? 1 : -1;
  const v0 = [x[0] + sgn * r, x[1]];
  const nv = Math.hypot(v0[0], v0[1]);
  const v = [v0[0] / nv, v0[1] / nv];
  const hx = [-sgn * r, 0];
  const C = 130, S = 70;
  const X = (a: number) => C + a * S, Y = (b: number) => 110 - b * S;
  const mirror = [-v[1], v[0]];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          direction of x {deg}°
          <input type="range" min={0} max={359} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="direction of x" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 260 220" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="A vector, its Householder mirror and its reflection">
        <defs><clipPath id="hhv-clip"><rect x={0} y={0} width={260} height={220} /></clipPath></defs>
        <g clipPath="url(#hhv-clip)">
          <circle cx={X(0)} cy={Y(0)} r={r * S} fill="none" stroke="var(--border)" />
          <line x1={X(-3 * mirror[0])} y1={Y(-3 * mirror[1])} x2={X(3 * mirror[0])} y2={Y(3 * mirror[1])} stroke="var(--text-muted)" strokeDasharray="5 4" />
          <line x1={X(0)} y1={Y(0)} x2={X(0.8 * v[0])} y2={Y(0.8 * v[1])} stroke="var(--danger)" strokeWidth={1.6} />
          <line x1={X(0)} y1={Y(0)} x2={X(x[0])} y2={Y(x[1])} stroke="var(--text)" strokeWidth={2} />
          <line x1={X(0)} y1={Y(0)} x2={X(hx[0])} y2={Y(hx[1])} stroke="var(--accent)" strokeWidth={2.4} />
          <line x1={X(x[0])} y1={Y(x[1])} x2={X(hx[0])} y2={Y(hx[1])} stroke="var(--border)" strokeDasharray="2 3" />
          <text x={X(x[0]) + 5} y={Y(x[1])} className="viz-label">x</text>
          <text x={X(hx[0])} y={Y(hx[1]) + 14} textAnchor="middle" className="viz-label">Hx</text>
          <text x={X(0.8 * v[0]) + 4} y={Y(0.8 * v[1])} className="viz-label">v</text>
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        x = ({x[0].toFixed(2)}, {x[1].toFixed(2)}), Hx = ({hx[0].toFixed(2)}, 0)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        H = I − 2vvᵀ reflects in the dashed line perpendicular to v (red). Choosing v along x + sign(x₁)‖x‖e₁ sends x onto
        the first axis with its length kept, zeroing every other entry: one Householder step of QR. The sign is chosen to
        avoid subtracting nearly equal numbers, so the target is the side of the axis away from x.
      </figcaption>
    </figure>
  );
}
