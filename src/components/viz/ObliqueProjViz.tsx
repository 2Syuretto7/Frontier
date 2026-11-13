"use client";

import { useState } from "react";

/** Projection onto U along W in the plane: ‖P‖ = 1/|sin θ|, θ the angle between U and W; orthogonal exactly when θ = 90°. */
export function ObliqueProjViz() {
  const [wDeg, setWDeg] = useState(60);
  const u = [1, 0];
  const t = (wDeg * Math.PI) / 180;
  const w = [Math.cos(t), Math.sin(t)];
  const v = [0.6, 1.1];
  // v = a u + b w  =>  b = v_y / w_y, a = v_x - b w_x
  const b = v[1] / w[1], a = v[0] - b * w[0];
  const Pv = [a * u[0], a * u[1]];
  const normP = 1 / Math.abs(Math.sin(t));
  const C = [130, 130], S = 70;
  const X = (x: number) => C[0] + x * S, Y = (y: number) => C[1] - y * S;
  const ln = (d: number[], color: string, dash?: string) => (
    <line x1={X(-4 * d[0])} y1={Y(-4 * d[1])} x2={X(4 * d[0])} y2={Y(4 * d[1])} stroke={color} strokeDasharray={dash} />
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          angle between U and W: {wDeg}°
          <input type="range" min={15} max={165} value={wDeg} onChange={(e) => setWDeg(Number(e.target.value))} aria-label="angle of W" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 260 200" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Oblique projection of a vector">
        <defs><clipPath id="opv-clip"><rect x={0} y={0} width={260} height={200} /></clipPath></defs>
        <g clipPath="url(#opv-clip)">
          {ln(u, "var(--accent)")}
          {ln(w, "var(--text-muted)", "5 4")}
          <line x1={X(v[0])} y1={Y(v[1])} x2={X(Pv[0])} y2={Y(Pv[1])} stroke="var(--danger)" strokeWidth={1.6} />
          <line x1={X(0)} y1={Y(0)} x2={X(v[0])} y2={Y(v[1])} stroke="var(--text)" strokeWidth={2} />
          <circle cx={X(Pv[0])} cy={Y(Pv[1])} r={4} fill="var(--accent)" />
          <text x={X(v[0]) + 5} y={Y(v[1])} className="viz-label">v</text>
          <text x={X(Pv[0])} y={Y(Pv[1]) + 14} textAnchor="middle" className="viz-label">Pv</text>
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        ‖P‖₂ = {normP.toFixed(3)}{wDeg === 90 ? " (orthogonal projection)" : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        U is the blue line and W the dashed one. P maps v to the point of U reached by moving parallel to W (red), so range
        P = U and null P = W, and P² = P. When W is perpendicular to U this is the orthogonal projection, of norm 1. As W
        tilts towards U the projection of a short vector can be very long: ‖P‖ = 1/|sin θ| grows without bound.
      </figcaption>
    </figure>
  );
}
