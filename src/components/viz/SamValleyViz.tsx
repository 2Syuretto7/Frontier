"use client";

import { useMemo, useState } from "react";

const Y = 1, LR = 0.05, T = 4000;

/** SAM on ½(uv − 1)² from (2.5, 0.45): ascend ρ along the normalised gradient, then descend with the gradient there. */
export function samPath(rho: number) {
  let u = 2.5, v = 0.45;
  const path: [number, number][] = [[u, v]];
  for (let t = 0; t < T; t++) {
    let r = u * v - Y;
    const gu = r * v, gv = r * u, n = Math.hypot(gu, gv);
    const eu = n > 0 ? (rho * gu) / n : 0, ev = n > 0 ? (rho * gv) / n : 0;
    const pu = u + eu, pv = v + ev;
    r = pu * pv - Y;
    [u, v] = [u - LR * r * pv, v - LR * r * pu];
    path.push([u, v]);
  }
  return path;
}

export function SamValleyViz() {
  const [rho, setRho] = useState(0.1);
  const path = useMemo(() => samPath(rho), [rho]);
  const W = 300, H = 220, X0 = 30, PW = W - 40, PH = H - 30, R = 3;
  const sx = (u: number) => X0 + (u / R) * PW;
  const sy = (v: number) => 8 + (1 - v / R) * PH;
  const hyper = Array.from({ length: 60 }, (_, i) => 1 / R + ((R - 1 / R) * i) / 59).map((u) => `${sx(u)},${sy(Y / u)}`).join(" ");
  const shown = path.filter((_, t) => t % 40 === 0);
  const [u0, v0] = path[0], [u1, v1] = path[T];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">SAM radius ρ</span>
        {[0, 0.05, 0.1, 0.2].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={rho === v} onClick={() => setRho(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="The valley of minima uv = 1 and the path of sharpness-aware minimisation">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(R)} stroke="var(--border)" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(R)} y2={sy(R)} stroke="var(--border)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={hyper} />
        {shown.map(([u, v], i) => (
          <circle key={i} cx={sx(u)} cy={sy(v)} r={2} fill="var(--accent)" />
        ))}
        <circle cx={sx(u1)} cy={sy(v1)} r={4} fill="var(--accent)" />
        {[0, 1, 2, 3].map((t) => (
          <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[1, 2, 3].map((t) => (
          <text key={t} x={X0 - 4} y={sy(t) + 4} textAnchor="end" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`sharpness u² + v²: start ${(u0 * u0 + v0 * v0).toFixed(2)}, after ${T} steps ${(u1 * u1 + v1 * v1).toFixed(2)} (flattest possible 2)`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The minima of ½(uv − 1)² form the hyperbola uv = 1 (red), every point of which computes the same function, yet
        the sharpness u² + v² ranges from 2 at the balanced point (on the dashed diagonal) to infinity. Gradient descent
        (ρ = 0) stops at the first minimum it reaches. Sharpness-aware minimisation evaluates the gradient after a step of
        length ρ uphill, and keeps drifting along the valley towards the flattest minimum, faster for larger ρ; with ρ = 0.2 it settles slightly inside the valley, where uv is a little below 1.
      </figcaption>
    </figure>
  );
}
