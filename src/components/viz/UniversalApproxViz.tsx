"use client";

import { useState } from "react";

const f = (x: number) => Math.sin(3 * x) + 0.5 * Math.cos(7 * x) + 0.3 * x;
const A = -1.5, B = 1.5;

/** A one-hidden-layer ReLU network built as the piecewise-linear interpolant of a target, with n hidden units. */
export function UniversalApproxViz() {
  const [n, setN] = useState(4);
  const knots = Array.from({ length: n + 1 }, (_, i) => A + ((B - A) * i) / n);
  const vals = knots.map(f);
  const slopes = vals.slice(1).map((v, i) => (v - vals[i]) / (knots[i + 1] - knots[i]));
  const coef = slopes.map((s, i) => (i === 0 ? s : s - slopes[i - 1]));
  const net = (x: number) => vals[0] + coef.reduce((acc, c, i) => acc + c * Math.max(x - knots[i], 0), 0);
  const W = 320, H = 180;
  const X = (x: number) => ((x - A) / (B - A)) * W, Y = (y: number) => H / 2 - y * 45;
  const xs = Array.from({ length: 301 }, (_, i) => A + ((B - A) * i) / 300);
  const err = Math.max(...xs.map((x) => Math.abs(net(x) - f(x))));
  const line = (g: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          hidden units n = {n}
          <input type="range" min={1} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="hidden units" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Target function and the ReLU network approximation">
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} points={line(f)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(net)} />
        {knots.slice(0, -1).map((k, i) => <circle key={i} cx={X(k)} cy={Y(vals[i])} r={2.5} fill="var(--accent)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13 }}>max error {err.toFixed(4)}</div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey: the target. Blue: a network with one hidden layer of {n} ReLU unit{n > 1 ? "s" : ""}, each placing one bend at
        a dot. The output weights are the changes of slope. Doubling the units roughly quarters the error, for any smooth
        target: with enough units, any continuous function on an interval is matched as closely as wanted.
      </figcaption>
    </figure>
  );
}
