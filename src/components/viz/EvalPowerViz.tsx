"use client";

import { useState } from "react";

function phi(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

export function EvalPowerViz() {
  const [n, setN] = useState(500);
  const [gap, setGap] = useState(3);
  const pA = 0.42,
    pB = pA + gap / 100;
  const se = (p: number) => Math.sqrt((p * (1 - p)) / n);
  const seDiff = Math.sqrt(se(pA) ** 2 + se(pB) ** 2);
  const right = gap === 0 ? 0.5 : phi(gap / 100 / seDiff);
  const W = 340,
    x0 = 20,
    x1 = W - 20;
  const lo = 0.3,
    hi = 0.6;
  const X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  const rows: [string, number][] = [
    ["checkpoint A", pA],
    ["checkpoint B", pB],
  ];
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          items: {n}{" "}
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          true gap: {gap} points{" "}
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={gap}
            onChange={(e) => setGap(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} 110`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "10px auto 0",
        }}
        role="img"
        aria-label="Accuracies of two checkpoints with 95% intervals"
      >
        {rows.map(([label, p], i) => {
          const y = 22 + i * 36;
          const h = 1.96 * se(p);
          return (
            <g key={label}>
              <text x={x0} y={y - 8} className="viz-label">
                {label}
              </text>
              <line
                x1={X(p - h)}
                x2={X(p + h)}
                y1={y}
                y2={y}
                stroke="var(--accent)"
                strokeWidth={6}
                opacity={0.4}
              />
              <circle cx={X(p)} cy={y} r={5} fill="var(--accent)" />
            </g>
          );
        })}
        <line x1={x0} x2={x1} y1={92} y2={92} stroke="var(--border-strong)" />
        {[0.3, 0.4, 0.5, 0.6].map((v) => (
          <text
            key={v}
            x={X(v)}
            y={106}
            textAnchor={v === lo ? "start" : v === hi ? "end" : "middle"}
            className="viz-label"
          >
            {v.toFixed(1)}
          </text>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        chance that the benchmark ranks the better checkpoint first:{" "}
        {(100 * right).toFixed(1)}%
      </p>
      <figcaption className="viz-caption">
        Two checkpoints whose true accuracies differ by the chosen gap, each
        measured on the same number of items, with 95% intervals. Small
        benchmarks cannot separate small improvements: the ranking is close to a
        coin toss until the gap is several standard errors wide, which is why
        the evaluation plan fixes sample sizes before any training starts.
      </figcaption>
    </figure>
  );
}
