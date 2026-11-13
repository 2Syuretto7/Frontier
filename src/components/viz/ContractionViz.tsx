"use client";

import { useState } from "react";

const STARTS: [number, number][] = [[-2.5, 2], [2.6, 2.2], [2.4, -2.1], [-2.2, -2.4], [0.2, 2.8]];
const P: [number, number] = [0.6, -0.3];

/** A planar map that rotates and scales by q about a point: for q below 1 every orbit converges to the same fixed point at the geometric rate qⁿ. */
export function ContractionViz() {
  const [qi, setQi] = useState(7);
  const [steps, setSteps] = useState(12);
  const q = qi / 10;
  const th = 0.6;
  const T = ([x, y]: [number, number]): [number, number] => {
    const dx = x - P[0], dy = y - P[1];
    return [P[0] + q * (Math.cos(th) * dx - Math.sin(th) * dy), P[1] + q * (Math.sin(th) * dx + Math.cos(th) * dy)];
  };
  const orbits = STARTS.map((s) => {
    const pts: [number, number][] = [s];
    for (let i = 0; i < steps; i++) pts.push(T(pts[pts.length - 1]));
    return pts;
  });
  const W = 300, H = 260, R = 3.4;
  const X = (x: number) => W / 2 + (x / R) * (W / 2 - 10);
  const Y = (y: number) => H / 2 - (y / R) * (H / 2 - 10);
  const d0 = Math.hypot(STARTS[0][0] - STARTS[1][0], STARTS[0][1] - STARTS[1][1]);
  const dn = Math.hypot(orbits[0][steps][0] - orbits[1][steps][0], orbits[0][steps][1] - orbits[1][steps][1]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          q = {q.toFixed(1)}
          <input type="range" min={3} max={11} value={qi} onChange={(e) => setQi(Number(e.target.value))} aria-label="contraction factor q" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          steps {steps}
          <input type="range" min={0} max={30} value={steps} onChange={(e) => setSteps(Number(e.target.value))} aria-label="number of iterations" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Orbits of several starting points under the map">
        {orbits.map((pts, i) => (
          <g key={i}>
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.7} points={pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ")} />
            {pts.map(([x, y], j) => <circle key={j} cx={X(x)} cy={Y(y)} r={j === 0 ? 3.5 : 2} fill={j === 0 ? "var(--text)" : "var(--accent)"} />)}
          </g>
        ))}
        <circle cx={X(P[0])} cy={Y(P[1])} r={4} fill="none" stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        distance between two orbits: {d0.toFixed(3)} at the start, {dn < 1e-4 ? dn.toExponential(2) : dn.toFixed(4)} after {steps} steps (qⁿ = {Math.pow(q, steps) < 1e-4 ? Math.pow(q, steps).toExponential(2) : Math.pow(q, steps).toFixed(4)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        T rotates every point by a fixed angle about the circled point and scales its distance from it by q, so
        d(T(u), T(v)) = q·d(u, v). Dark dots are starting points. For q &lt; 1 all orbits spiral into the circled fixed point and
        any two orbits approach each other by the factor qⁿ. At q = 1 the orbits circle forever, and for q &gt; 1 they fly
        away.
      </figcaption>
    </figure>
  );
}
