"use client";

import { useState } from "react";

const f = (x: number) => Math.log(Math.cosh(x)) + 0.25 * x * x;
const d = (x: number) => Math.tanh(x) + 0.5 * x;

/** A function trapped between two parabolas at a point: curvature μ from below (strong convexity) and L from above (smoothness). Set μ or L wrong and the graph escapes. */
export function SandwichViz() {
  const [x0, setX0] = useState(1.0);
  const [mu, setMu] = useState(0.5);
  const [L, setL] = useState(1.5);
  const lo = -3, hi = 3, ymin = -0.4, ymax = 5;
  const xs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const W = 300, H = 200;
  const X = (x: number) => 14 + ((x - lo) / (hi - lo)) * (W - 28);
  const Y = (y: number) => H - 14 - ((y - ymin) / (ymax - ymin)) * (H - 24);
  const lin = (y: number) => f(x0) + d(x0) * (y - x0);
  const low = (y: number) => lin(y) + (mu / 2) * (y - x0) ** 2;
  const up = (y: number) => lin(y) + (L / 2) * (y - x0) ** 2;
  const badLow = xs.filter((y) => f(y) < low(y) - 1e-9);
  const badUp = xs.filter((y) => f(y) > up(y) + 1e-9);
  const line = (g: (y: number) => number) => xs.map((y) => `${X(y).toFixed(1)},${Y(g(y)).toFixed(1)}`).join(" ");
  const slider = (label: string, v: number, set: (v: number) => void, min: number, max: number) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} = {v.toFixed(2)}
      <input type="range" min={min} max={max} step={0.05} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 90 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider("x", x0, setX0, -2.5, 2.5)}
        {slider("μ", mu, setMu, 0, 1.5)}
        {slider("L", L, setL, 0.5, 2.5)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A convex function between a lower parabola of curvature mu and an upper parabola of curvature L">
        <defs>
          <clipPath id="sw-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#sw-clip)">
          {badLow.concat(badUp).map((y, i) => (
            <line key={i} x1={X(y)} x2={X(y)} y1={Y(ymin)} y2={Y(ymax)} stroke="var(--danger)" opacity={0.15} />
          ))}
          <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.3} strokeDasharray="5 3" points={line(up)} />
          <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.3} strokeDasharray="2 2" points={line(low)} />
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(f)} />
        </g>
        <circle cx={X(x0)} cy={Y(f(x0))} r={3.5} fill="var(--text)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        lower bound {badLow.length ? "violated (red)" : "holds"}; upper bound {badUp.length ? "violated (red)" : "holds"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is f(x) = log cosh x + x²/4, with f″(x) = sech²x + 1/2, so its curvature lies between μ = 0.5 and L = 1.5.
        At the black point, the dotted parabola with curvature μ lies below the graph and the dashed one with curvature L
        lies above it, whatever point you pick. Raise μ or lower L far enough, especially with the point near 0, and
        the graph escapes the sandwich; the red bands mark where. The ratio L/μ, here 3, will govern how fast gradient descent runs.
      </figcaption>
    </figure>
  );
}
