"use client";

import { useMemo, useState } from "react";

const DIMS = [2, 3, 10, 50, 200];

/** Exact densities for a uniform point in the unit d-ball: the radius, and one coordinate. */
export function profile(d: number) {
  const N = 200;
  const radius = Array.from({ length: N + 1 }, (_, i) => { const r = i / N; return d * r ** (d - 1); });
  const coord = Array.from({ length: N + 1 }, (_, i) => { const x = -1 + (2 * i) / N; return (1 - x * x) ** ((d - 1) / 2); });
  // fraction of the coordinate's mass in |x| < 0.1, by the midpoint rule on a fine grid
  const M = 20000;
  let all = 0, mid = 0;
  for (let i = 0; i < M; i++) {
    const x = -1 + (2 * (i + 0.5)) / M, w = (1 - x * x) ** ((d - 1) / 2);
    all += w;
    if (Math.abs(x) < 0.1) mid += w;
  }
  const lg = (z: number) => {
    // log Gamma by Stirling with shift, accurate to about 1e-10 for z > 0
    let s = 0;
    while (z < 8) { s -= Math.log(z); z += 1; }
    return s + (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * z) - 1 / (360 * z ** 3);
  };
  const volume = Math.exp((d / 2) * Math.log(Math.PI) - lg(d / 2 + 1));
  return { radius, coord, shell: 1 - 0.9 ** d, equator: mid / all, volume };
}

export function BallMassViz() {
  const [d, setD] = useState(10);
  const { radius, coord, shell, equator, volume } = useMemo(() => profile(d), [d]);
  const W = 330, PH = 70, X0 = 10, PW = W - 20;
  const path = (ys: number[], y0: number) => {
    const top = Math.max(...ys);
    return ys.map((y, i) => `${i ? "L" : "M"}${(X0 + (i / (ys.length - 1)) * PW).toFixed(1)},${(y0 + PH - (y / top) * PH).toFixed(1)}`).join(" ");
  };
  const Y1 = 16, Y2 = Y1 + PH + 46, H = Y2 + PH + 22;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">dimension d</span>
        <div className="segmented" role="group" aria-label="Dimension">
          {DIMS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={d === v} onClick={() => setD(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Density of the radius and of one coordinate of a uniform point in a ball">
        <text x={X0} y={Y1 - 5} className="viz-label">radius ‖x‖</text>
        <rect x={X0 + 0.9 * PW} y={Y1} width={0.1 * PW} height={PH} fill="var(--accent-soft)" opacity={0.5} />
        <path d={path(radius, Y1)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={X0} x2={X0 + PW} y1={Y1 + PH} y2={Y1 + PH} stroke="var(--border)" />
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 + v * PW} y={Y1 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>)}
        <text x={X0} y={Y2 - 5} className="viz-label">first coordinate x₁</text>
        <rect x={X0 + 0.45 * PW} y={Y2} width={0.1 * PW} height={PH} fill="var(--accent-soft)" opacity={0.5} />
        <path d={path(coord, Y2)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={X0} x2={X0 + PW} y1={Y2 + PH} y2={Y2 + PH} stroke="var(--border)" />
        {[-1, 0, 1].map((v) => <text key={v} x={X0 + ((v + 1) / 2) * PW} y={Y2 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`volume ${volume < 0.001 ? volume.toExponential(2) : volume.toFixed(3)}; ${(shell * 100).toFixed(1)}% within 0.1 of the boundary; ${(equator * 100).toFixed(1)}% with |x₁| < 0.1`}
      </div>
      <figcaption className="viz-caption">
        Exact densities for a point chosen uniformly in the unit ball of dimension d, each scaled to the same height. The
        radius has density d·r^(d−1), which crowds against 1 as d grows: in dimension 50, over 99% of the volume lies in the
        outer shell of thickness 0.1. One coordinate has density proportional to (1 − x²)^((d−1)/2), which crowds against 0:
        in dimension 200, about 84% of the volume lies in the slab |x₁| &lt; 0.1. The volume of the ball itself, largest near
        d = 5, falls towards zero.
      </figcaption>
    </figure>
  );
}
