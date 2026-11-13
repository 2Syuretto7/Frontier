"use client";

import { useState } from "react";

/** Steepest descent with exact line search on (x² + κy²)/2: successive steps meet at right angles and zigzag across the valley; rescaling y turns the contours into circles and one step suffices. */
export function ZigzagViz() {
  const [kappa, setKappa] = useState(10);
  const [pre, setPre] = useState(false);
  const [sx, setSx] = useState(9);
  const q = pre ? [1, 1] : [1, kappa];
  const x0: [number, number] = [sx, pre ? Math.sqrt(kappa) : 1];
  const path: [number, number][] = [x0];
  let steps = 0;
  const f = (p: [number, number]) => 0.5 * (q[0] * p[0] ** 2 + q[1] * p[1] ** 2);
  const f0 = f(x0);
  for (let i = 0; i < 400 && f(path[path.length - 1]) > 1e-8 * f0; i++) {
    const [a, b] = path[path.length - 1];
    const g = [q[0] * a, q[1] * b];
    const t = (g[0] ** 2 + g[1] ** 2) / (q[0] * g[0] ** 2 + q[1] * g[1] ** 2);
    path.push([a - t * g[0], b - t * g[1]]);
    steps++;
  }
  const R = 10.5;
  const W = 330, H = 200;
  const yR = (R * H) / W;
  const X = (x: number) => W / 2 + (x / R) * (W / 2 - 6);
  const Y = (y: number) => H / 2 - (y / yR) * (H / 2 - 6);
  const levels = [0.02, 0.08, 0.2, 0.45, 0.8].map((s) => s * f0);
  const ratio = ((kappa - 1) / (kappa + 1)) ** 2;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          κ = {kappa}
          <input type="range" min={1} max={40} value={kappa} onChange={(e) => setKappa(Number(e.target.value))} aria-label="condition number" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x₀ = {sx}
          <input type="range" min={1} max={10} value={sx} onChange={(e) => setSx(Number(e.target.value))} aria-label="starting x" style={{ width: 90 }} />
        </label>
        <button type="button" className="seg" aria-pressed={pre} onClick={() => setPre(!pre)}>rescale y by √κ</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Contours of a quadratic and the zigzag path of steepest descent with exact line search">
        <defs>
          <clipPath id="zz-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#zz-clip)">
          {levels.map((c, i) => (
            <ellipse key={i} cx={X(0)} cy={Y(0)} rx={X(Math.sqrt((2 * c) / q[0])) - X(0)} ry={Y(0) - Y(Math.sqrt((2 * c) / q[1]))} fill="none" stroke="var(--border)" />
          ))}
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={path.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ")} />
        </g>
        <circle cx={X(x0[0])} cy={Y(x0[1])} r={3} fill="var(--text)" />
        <circle cx={X(0)} cy={Y(0)} r={2.5} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        steps to shrink f by 10⁸: {steps}; worst-case factor per step ((κ − 1)/(κ + 1))² = {pre ? "0 after rescaling" : ratio.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The ellipses are level sets of (x² + κy²)/2, stretched by √κ along the x-axis. Each step goes along the negative
        gradient to the lowest point on that line, where the line is tangent to a level set, so the next gradient is at a
        right angle to the last: the path zigzags across the valley. Starting at x₀ = κ, y₀ = 1 is the worst case, where the
        gap shrinks by exactly ((κ − 1)/(κ + 1))² per step. Rescaling y by √κ makes the contours circles, the gradient points
        at the minimum, and a single step finishes.
      </figcaption>
    </figure>
  );
}
