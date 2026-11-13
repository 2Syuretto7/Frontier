"use client";

import { useState } from "react";

function run(kappa: number, alpha: number, beta: number) {
  const pts: [number, number][] = [[1, 0.5]];
  let prev: [number, number] = [1, 0.5];
  let steps = -1;
  for (let k = 0; k < 2000; k++) {
    const [x, y] = pts[pts.length - 1];
    if (steps < 0 && Math.hypot(x, y) < 1e-6) steps = k;
    const nx = x - alpha * x + beta * (x - prev[0]);
    const ny = y - alpha * kappa * y + beta * (y - prev[1]);
    prev = [x, y];
    pts.push([nx, ny]);
    if (steps >= 0 || !Number.isFinite(nx) || Math.abs(nx) > 1e6) break;
  }
  return { pts, steps };
}

/** Gradient descent and the heavy-ball method on (x² + κy²)/2: momentum keeps part of the previous step, damping the zigzag and cutting the iteration count from about κ to about √κ per digit. */
export function HeavyBallViz() {
  const [kappa, setKappa] = useState(50);
  const [bk, setBk] = useState(100);
  const sk = Math.sqrt(kappa);
  const bOpt = ((sk - 1) / (sk + 1)) ** 2;
  const beta = (bk / 100) * bOpt;
  const alpha = (1 + Math.sqrt(beta)) ** 2 / kappa;
  const gd = run(kappa, 2 / (kappa + 1), 0);
  const hb = run(kappa, alpha, beta);
  const W = 330, H = 200, xr = 1.2, yr = (xr * H) / W;
  const X = (x: number) => W / 2 + (x / xr) * (W / 2 - 6);
  const Y = (y: number) => H / 2 - (y / yr) * (H / 2 - 6);
  const line = (p: [number, number][]) => p.slice(0, 120).map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ");
  const f0 = 0.5 * (1 + kappa * 0.25);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          κ = {kappa}
          <input type="range" min={4} max={200} value={kappa} onChange={(e) => setKappa(Number(e.target.value))} aria-label="condition number" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          β = {beta.toFixed(3)}
          <input type="range" min={0} max={100} value={bk} onChange={(e) => setBk(Number(e.target.value))} aria-label="momentum as a fraction of the optimal value" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Paths of gradient descent and heavy-ball momentum on an elongated quadratic">
        <defs>
          <clipPath id="hb-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#hb-clip)">
          {[0.05, 0.2, 0.5, 1].map((s) => (
            <ellipse key={s} cx={X(0)} cy={Y(0)} rx={X(Math.sqrt(2 * s * f0)) - X(0)} ry={Y(0) - Y(Math.sqrt((2 * s * f0) / kappa))} fill="none" stroke="var(--border)" />
          ))}
          <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.3} points={line(gd.pts)} />
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(hb.pts)} />
        </g>
        <circle cx={X(1)} cy={Y(0.5)} r={3} fill="var(--text)" />
        <circle cx={X(0)} cy={Y(0)} r={2.5} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        steps to ‖x‖ &lt; 10⁻⁶: gradient descent {gd.steps < 0 ? "> 2000" : gd.steps}; heavy ball {hb.steps < 0 ? "> 2000" : hb.steps}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The grey path is gradient descent with its best fixed step 2/(1 + κ); the other is the heavy-ball method
        xₖ₊₁ = xₖ − α∇f(xₖ) + β(xₖ − xₖ₋₁), with α = (1 + √β)²/κ. At the full setting β = ((√κ − 1)/(√κ + 1))², the
        momentum that carries the iterate along the valley outweighs the overshoot across it, and the step count grows
        like √κ instead of κ. Lower β towards 0 and the method slides back to plain gradient descent.
      </figcaption>
    </figure>
  );
}
