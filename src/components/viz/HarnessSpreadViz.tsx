"use client";

import { useState } from "react";

const NS = [100, 200, 400, 800, 1600, 3200, 6400];
const TEMPLATES: [string, number][] = [
  ["0-shot", 0.58],
  ["0-shot, instruction", 0.61],
  ["5-shot", 0.64],
  ["5-shot, shuffled", 0.6],
  ["5-shot, per token", 0.67],
  ["generated answer", 0.55],
];

export function HarnessSpreadViz() {
  const [ni, setNi] = useState(1);
  const n = NS[ni];
  const W = 330,
    x0 = 120,
    pw = 198,
    rh = 22,
    y0 = 8,
    lo = 0.4,
    hi = 0.8;
  const H = y0 + TEMPLATES.length * rh + 24;
  const sx = (p: number) =>
    x0 + ((Math.min(hi, Math.max(lo, p)) - lo) / (hi - lo)) * pw;
  const hw = (p: number) => 1.96 * Math.sqrt((p * (1 - p)) / n);
  const ps = TEMPLATES.map(([, p]) => p);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          items per evaluation: {n}{" "}
          <input
            type="range"
            min={0}
            max={NS.length - 1}
            step={1}
            value={ni}
            onChange={(e) => setNi(+e.target.value)}
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
        aria-label="Accuracy of one checkpoint under six harness settings with intervals"
      >
        {[0.4, 0.6, 0.8].map((v) => (
          <g key={v}>
            <line
              x1={sx(v)}
              x2={sx(v)}
              y1={y0}
              y2={y0 + TEMPLATES.length * rh}
              stroke="var(--grid-line)"
            />
            <text
              x={sx(v)}
              y={y0 + TEMPLATES.length * rh + 16}
              textAnchor="middle"
              className="viz-label"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {TEMPLATES.map(([name, p], i) => {
          const y = y0 + i * rh + rh / 2;
          return (
            <g key={name}>
              <text x={x0 - 6} y={y + 4} textAnchor="end" className="viz-label">
                {name}
              </text>
              <line
                x1={sx(p - hw(p))}
                x2={sx(p + hw(p))}
                y1={y}
                y2={y}
                stroke="var(--accent)"
                strokeWidth={2}
              />
              <circle cx={sx(p)} cy={y} r={3.5} fill="var(--accent)" />
            </g>
          );
        })}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        spread between settings {(Math.max(...ps) - Math.min(...ps)).toFixed(2)}
        ; widest 95% interval ±{Math.max(...ps.map(hw)).toFixed(3)}
      </p>
      <figcaption className="viz-caption">
        One checkpoint scored on the same multiple-choice task under six harness
        settings, with 95% intervals from the number of items. More items shrink
        the intervals, but not the differences between settings, which are
        systematic: two checkpoints can only be compared under exactly the same
        harness.
      </figcaption>
    </figure>
  );
}
