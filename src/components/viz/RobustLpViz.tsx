"use client";

import { useState } from "react";

const CONS = [
  { a: [1, 2], b: 4 },
  { a: [3, 1], b: 6 },
];

/** A robust linear program: when each constraint vector may move anywhere in a disc of radius r, the feasible set shrinks to the second-order-cone region āᵀx + r‖x‖ ≤ b. */
export function RobustLpViz() {
  const [r, setR] = useState(0.4);
  const G = 70, lim = 2.2;
  const W = 260, H = 240;
  const X = (x: number) => 30 + (x / lim) * (W - 50);
  const Y = (y: number) => H - 25 - (y / lim) * (H - 45);
  const cell = (lim / G) * (W - 50);
  const feas = (x: number, y: number, rad: number) => CONS.every((c) => c.a[0] * x + c.a[1] * y + rad * Math.hypot(x, y) <= c.b);
  const pts: [number, number, boolean][] = [];
  let best = { v: -1, x: 0, y: 0 }, nom = { v: -1, x: 0, y: 0 };
  for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
    const x = (lim * i) / G, y = (lim * j) / G;
    const f0 = feas(x, y, 0), fr = feas(x, y, r);
    if (f0) pts.push([x, y, fr]);
    if (f0 && x + y > nom.v) nom = { v: x + y, x, y };
    if (fr && x + y > best.v) best = { v: x + y, x, y };
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          uncertainty radius r = {r.toFixed(2)}
          <input type="range" min={0} max={1.5} step={0.05} value={r} onChange={(e) => setR(Number(e.target.value))} aria-label="uncertainty radius" style={{ width: 130 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Nominal and robust feasible regions of a linear program">
        {pts.map(([x, y, ok], i) => (
          <rect key={i} x={X(x) - cell / 2} y={Y(y) - cell / 2} width={cell + 0.3} height={cell + 0.3} fill={ok ? "var(--accent)" : "var(--border)"} opacity={ok ? 0.4 : 0.35} />
        ))}
        <line x1={X(0)} x2={X(lim)} y1={Y(0)} y2={Y(0)} stroke="var(--text-muted)" />
        <line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(lim)} stroke="var(--text-muted)" />
        <circle cx={X(nom.x)} cy={Y(nom.y)} r={4} fill="none" stroke="var(--text)" strokeWidth={1.5} />
        <circle cx={X(best.x)} cy={Y(best.y)} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        maximise x + y: nominal {nom.v.toFixed(2)} at ({nom.x.toFixed(2)}, {nom.y.toFixed(2)}); robust {best.v.toFixed(2)} at ({best.x.toFixed(2)}, {best.y.toFixed(2)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The grey polygon is the nominal feasible set x + 2y ≤ 4, 3x + y ≤ 6, x, y ≥ 0. If each constraint vector aᵢ is only
        known to lie within distance r of its nominal value, a point is safe only if aᵀx ≤ b for every such a, which is
        āᵀx + r‖x‖₂ ≤ b, a second-order cone constraint. The safe region (shaded) is still convex but has curved edges, and
        the robust optimum (red dot, found on a grid) gives up some value to stay feasible whatever the perturbation; the
        open circle is the nominal optimum.
      </figcaption>
    </figure>
  );
}
