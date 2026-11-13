"use client";

import { useState } from "react";

const BASE = [1, 2, 3, 4];

function huberFit(y: number[], d: number) {
  let c = 0;
  for (let i = 0; i < 4000; i++) c -= 0.05 * (y.reduce((s, v) => s + Math.max(-d, Math.min(d, c - v)), 0) / y.length);
  return c;
}

/** The constant that minimises squared, absolute and Huber loss, as one data point is dragged away. */
export function OutlierFitViz() {
  const [out, setOut] = useState(5);
  const y = [...BASE, out];
  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  const median = [...y].sort((a, b) => a - b)[2];
  const hub = huberFit(y, 1);
  const W = 320, lo = -1, hi = 31;
  const X = (v: number) => 10 + ((v - lo) / (hi - lo)) * (W - 20);
  const mark = (v: number, label: string, color: string, row: number) => (
    <g>
      <line x1={X(v)} x2={X(v)} y1={20} y2={64} stroke={color} strokeWidth={2} />
      <text x={X(v)} y={78 + row * 12} textAnchor="middle" className="viz-label" style={{ fill: color }}>{label} {v.toFixed(2)}</text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          fifth point = {out}
          <input type="range" min={0} max={30} value={out} onChange={(e) => setOut(Number(e.target.value))} aria-label="position of the fifth point" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} 110`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Data points and three fitted constants">
        <line x1={10} x2={W - 10} y1={42} y2={42} stroke="var(--border)" />
        {y.map((v, i) => <circle key={i} cx={X(v)} cy={42} r={5} fill={i === 4 ? "var(--danger)" : "var(--text-muted)"} />)}
        {mark(mean, "MSE", "var(--accent)", 0)}
        {mark(median, "MAE", "var(--text)", 1)}
        {mark(hub, "Huber", "var(--danger)", 2)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The best constant under squared error is the mean, under absolute error the median, and under Huber loss (δ = 1)
        something in between. Drag the red point far away: the mean follows it, one fifth of the way, because squared error
        pays more and more for a large residual; the median does not move at all; Huber moves a little and then stops, because
        beyond δ it charges only linearly.
      </figcaption>
    </figure>
  );
}
