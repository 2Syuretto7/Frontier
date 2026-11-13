"use client";

import { useState } from "react";

const POLY: [number, number][] = [[0, 0], [2, 0], [1.6, 1.2], [0, 2]];

/** A linear program in the plane: as the cost direction turns, the optimum jumps from vertex to vertex of the feasible polygon. */
export function LpVertexViz() {
  const [deg, setDeg] = useState(225);
  const a = (deg * Math.PI) / 180;
  const c: [number, number] = [Math.cos(a), Math.sin(a)];
  const vals = POLY.map(([x, y]) => c[0] * x + c[1] * y);
  const best = Math.min(...vals);
  const opt = POLY.map((_, i) => i).filter((i) => vals[i] < best + 1e-9);
  const W = 260, H = 240;
  const X = (x: number) => 40 + x * 85;
  const Y = (y: number) => 210 - y * 85;
  const level = (v: number) => {
    // points on c·p = v, drawn long
    const p0 = [c[0] * v, c[1] * v], t = [-c[1], c[0]];
    return { x1: X(p0[0] - 4 * t[0]), y1: Y(p0[1] - 4 * t[1]), x2: X(p0[0] + 4 * t[0]), y2: Y(p0[1] + 4 * t[1]) };
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          cost direction {deg}°
          <input type="range" min={0} max={355} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="direction of the cost vector" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Feasible polygon of a linear program with level lines of the cost">
        <defs>
          <clipPath id="lp-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <polygon points={POLY.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")} fill="var(--accent)" opacity={0.22} stroke="var(--accent)" />
        <g clipPath="url(#lp-clip)">
          {[0.5, 1, 1.5, 2].map((k) => {
            const l = level(best + k * 0.6);
            return <line key={k} {...l} stroke="var(--text-muted)" strokeDasharray="3 3" opacity={0.6} />;
          })}
          <line {...level(best)} stroke="var(--danger)" strokeWidth={1.8} />
        </g>
        <line x1={X(0.8)} y1={Y(0.6)} x2={X(0.8 - 0.5 * c[0])} y2={Y(0.6 - 0.5 * c[1])} stroke="var(--text)" strokeWidth={1.6} />
        <circle cx={X(0.8 - 0.5 * c[0])} cy={Y(0.6 - 0.5 * c[1])} r={2.5} fill="var(--text)" />
        {POLY.map(([x, y], i) => (
          <circle key={i} cx={X(x)} cy={Y(y)} r={opt.includes(i) ? 5 : 3} fill={opt.includes(i) ? "var(--danger)" : "var(--text-muted)"} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        minimise cᵀx with c = ({c[0].toFixed(2)}, {c[1].toFixed(2)}): optimum {(best + 0).toFixed(3)} at {opt.map((i) => `(${POLY[i][0]}, ${POLY[i][1]})`).join(" and ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The feasible set is x + 2y ≤ 4, 3x + y ≤ 6, x ≥ 0, y ≥ 0. The black arrow points along −c, the direction of
        decreasing cost, and dashed lines are level sets of cᵀx. The red line is the lowest level that still touches the
        polygon, and it always touches at a vertex (red dot). When c is perpendicular to an edge, the whole edge is optimal
        and both its end vertices are reported.
      </figcaption>
    </figure>
  );
}
