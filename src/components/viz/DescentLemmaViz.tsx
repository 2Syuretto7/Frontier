"use client";

import { useState } from "react";

const L = 1.5;
const f = (x: number) => Math.log(Math.cosh(x)) + 0.25 * x * x;
const d = (x: number) => Math.tanh(x) + 0.5 * x;

/** One gradient step on an L-smooth function: the quadratic upper bound with curvature L sits above the graph, so the step's decrease is at least t(1 − Lt/2)f′(x)². */
export function DescentLemmaViz() {
  const [x0, setX0] = useState(2.2);
  const [m, setM] = useState(1.0);
  const t = m / L;
  const g = d(x0);
  const x1 = x0 - t * g;
  const q = (y: number) => f(x0) + g * (y - x0) + (L / 2) * (y - x0) ** 2;
  const lo = -3, hi = 3, ymin = -0.3, ymax = 5;
  const xs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const W = 300, H = 200;
  const X = (x: number) => 14 + ((x - lo) / (hi - lo)) * (W - 28);
  const Y = (y: number) => H - 14 - ((y - ymin) / (ymax - ymin)) * (H - 24);
  const actual = f(x0) - f(x1);
  const promised = t * (1 - (L * t) / 2) * g * g;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x = {x0.toFixed(1)}
          <input type="range" min={-2.8} max={2.8} step={0.1} value={x0} onChange={(e) => setX0(Number(e.target.value))} aria-label="current point" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          t = {m.toFixed(2)}/L
          <input type="range" min={0.1} max={2.4} step={0.05} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="step size times L" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A smooth convex function, its quadratic upper bound at the current point, and one gradient step">
        <defs>
          <clipPath id="dl-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#dl-clip)">
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ")} />
          <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.3} strokeDasharray="5 3" points={xs.map((x) => `${X(x).toFixed(1)},${Y(q(x)).toFixed(1)}`).join(" ")} />
          <line x1={X(x1)} x2={X(x1)} y1={Y(f(x1))} y2={Y(q(x1))} stroke="var(--danger)" strokeWidth={1.5} />
        </g>
        <line x1={X(lo)} x2={X(hi)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <circle cx={X(x0)} cy={Y(f(x0))} r={3.5} fill="var(--text)" />
        <circle cx={X(x1)} cy={Y(f(x1))} r={3.5} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        actual decrease {(actual + 0).toFixed(3)}; guaranteed t(1 − Lt/2)f′² = {(promised + 0).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is f(x) = log cosh x + x²/4, whose second derivative never exceeds L = 1.5. The dashed parabola is
        f(x) + f′(x)(y − x) + (L/2)(y − x)², which lies above f everywhere. A gradient step lands at the red point, and the
        red segment shows how far the bound overshoots there. The guaranteed decrease is largest at t = 1/L, where the step
        goes to the bottom of the parabola. Past t = 2/L the guarantee turns negative, and the step can overshoot.
      </figcaption>
    </figure>
  );
}
