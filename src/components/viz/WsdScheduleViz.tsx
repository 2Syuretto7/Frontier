"use client";

import { useState } from "react";

const TOTAL = 1000,
  WARM = 50;

export function WsdScheduleViz() {
  const [frac, setFrac] = useState(0.15);
  const [branch, setBranch] = useState(600);
  const wsd = (s: number, end: number) => {
    const start = end - Math.round(frac * end);
    if (s < WARM) return (s + 1) / WARM;
    if (s < start) return 1;
    if (s > end) return 0;
    return (end - s) / (end - start);
  };
  const cos = (s: number) =>
    s < WARM
      ? (s + 1) / WARM
      : 0.5 * (1 + Math.cos((Math.PI * (s - WARM)) / (TOTAL - WARM)));
  const W = 340,
    H = 170,
    x0 = 30,
    x1 = W - 10,
    y0 = 10,
    y1 = H - 28;
  const X = (s: number) => x0 + (s / TOTAL) * (x1 - x0),
    Y = (v: number) => y1 - v * (y1 - y0);
  const path = (f: (s: number) => number, end = TOTAL) =>
    Array.from({ length: end + 1 }, (_, s) => s)
      .filter((s) => s % 5 === 0 || s === end)
      .map((s, i) => `${i ? "L" : "M"}${X(s).toFixed(1)},${Y(f(s)).toFixed(1)}`)
      .join(" ");
  const branchStart = branch - Math.round(frac * branch);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          decay share: {Math.round(frac * 100)}%{" "}
          <input
            type="range"
            min={0.05}
            max={0.4}
            step={0.05}
            value={frac}
            onChange={(e) => setFrac(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          early branch ends at step {branch}{" "}
          <input
            type="range"
            min={200}
            max={900}
            step={50}
            value={branch}
            onChange={(e) => setBranch(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Warmup-stable-decay and cosine learning rate schedules"
      >
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(v)}
              y2={Y(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 6}
              y={Y(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <path
          d={path(cos)}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <path
          d={path((s) => wsd(s, TOTAL))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
        />
        <path
          d={`M${X(branchStart).toFixed(1)},${Y(1).toFixed(1)} L${X(branch).toFixed(1)},${Y(0).toFixed(1)}`}
          fill="none"
          stroke="var(--success)"
          strokeWidth={2}
        />
        {[0, 250, 500, 750, 1000].map((s) => (
          <text
            key={s}
            x={X(s)}
            y={y1 + 16}
            textAnchor={s === 0 ? "start" : s === TOTAL ? "end" : "middle"}
            className="viz-label"
          >
            {s}
          </text>
        ))}
      </svg>
      <figcaption className="viz-caption">
        Learning rate as a fraction of its peak over a 1000-step run. The solid
        line is warmup-stable-decay; the dashed line is cosine decay over the
        whole run. Because the stable phase does not depend on the run&apos;s
        length, a branch (green) can decay from any stable checkpoint to give a
        finished model early, and the main run continues unchanged.
      </figcaption>
    </figure>
  );
}
