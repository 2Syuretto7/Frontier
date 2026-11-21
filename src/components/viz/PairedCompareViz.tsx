"use client";

import { useState } from "react";

const PA = 0.5,
  PB = 0.53;

/** Standard error of the difference in resolve rates over n tasks, with per-task outcome correlation rho (0 = unpaired). */
export function diffSe(n: number, rho: number) {
  const va = PA * (1 - PA),
    vb = PB * (1 - PB);
  return Math.sqrt((va + vb - 2 * rho * Math.sqrt(va * vb)) / n);
}

export function PairedCompareViz() {
  const [n, setN] = useState(500);
  const [ri, setRi] = useState(60);
  const rho = ri / 100;
  const d = PB - PA;
  const rows = [
    { label: "unpaired", se: diffSe(n, 0), color: "var(--danger)" },
    { label: "paired", se: diffSe(n, rho), color: "var(--accent)" },
  ];
  const W = 330,
    H = 130,
    x0 = 70,
    pw = 240,
    lo = -0.1,
    hi = 0.16;
  const sx = (v: number) =>
    x0 + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * pw;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          tasks: {n}{" "}
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          per-task agreement: {rho.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={90}
            value={ri}
            onChange={(e) => setRi(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Confidence intervals for the difference between two agents"
      >
        <line
          x1={sx(0)}
          x2={sx(0)}
          y1={10}
          y2={100}
          stroke="var(--border)"
          strokeWidth={2}
        />
        <line
          x1={sx(d)}
          x2={sx(d)}
          y1={10}
          y2={100}
          stroke="var(--grid-line)"
          strokeDasharray="4 3"
        />
        {[-0.1, -0.05, 0, 0.05, 0.1, 0.15].map((v) => (
          <text
            key={v}
            x={sx(v)}
            y={114}
            textAnchor="middle"
            className="viz-label"
          >
            {Math.round(v * 100)}
          </text>
        ))}
        {rows.map((r, i) => {
          const y = 35 + i * 40;
          const z = d / r.se;
          return (
            <g key={r.label}>
              <text x={x0 - 6} y={y + 4} textAnchor="end" className="viz-label">
                {r.label}
              </text>
              <line
                x1={sx(d - 1.96 * r.se)}
                x2={sx(d + 1.96 * r.se)}
                y1={y}
                y2={y}
                stroke={r.color}
                strokeWidth={3}
              />
              <circle cx={sx(d)} cy={y} r={4} fill={r.color} />
              <text
                x={sx(d)}
                y={y - 9}
                textAnchor="middle"
                className="viz-label"
              >
                z = {z.toFixed(2)}
              </text>
            </g>
          );
        })}
        <text
          x={x0 + pw / 2}
          y={H - 2}
          textAnchor="middle"
          className="viz-label"
        >
          difference in resolve rate, percentage points
        </text>
      </svg>
      <figcaption className="viz-caption">
        Agent B resolves 53% of tasks and agent A 50%. Treated as independent
        samples, the 95% interval for the difference is wide; but both agents
        ran on the same tasks, and tasks that are easy for one tend to be easy
        for the other. Pairing by task removes that shared variation, and the
        higher the agreement, the narrower the interval. Adding tasks narrows
        both, but only as one over the square root of their number.
      </figcaption>
    </figure>
  );
}
