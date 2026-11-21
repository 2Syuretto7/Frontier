"use client";

import { useState } from "react";

const SPARSE = ["D", "A", "E", "B", "F", "C"];
const DENSE = ["B", "A", "C", "F", "D", "E"];

/** Reciprocal rank fusion of several rankings. */
export function rrfScores(rankings: string[][], k: number) {
  const s: Record<string, number> = {};
  rankings.forEach((r) =>
    r.forEach((d, i) => {
      s[d] = (s[d] ?? 0) + 1 / (k + i + 1);
    }),
  );
  return Object.entries(s).sort((a, b) => b[1] - a[1]);
}

export function RrfFusionViz() {
  const [k, setK] = useState(0);
  const fused = rrfScores([SPARSE, DENSE], k);
  const W = 330,
    H = 170,
    cw = 100,
    rh = 22,
    y0 = 26;
  const col = (title: string, items: string[], x: number) => (
    <g>
      <text x={x + cw / 2} y={14} textAnchor="middle" className="viz-label">
        {title}
      </text>
      {items.map((d, i) => (
        <g key={d}>
          <rect
            x={x + 10}
            y={y0 + i * rh}
            width={cw - 20}
            height={rh - 4}
            fill={d === "A" ? "var(--success)" : "var(--accent)"}
            fillOpacity={d === "A" ? 0.35 : 0.15}
            stroke="var(--border)"
          />
          <text
            x={x + cw / 2}
            y={y0 + i * rh + 13}
            textAnchor="middle"
            style={{ fontSize: 11, fill: "var(--text)" }}
          >
            {i + 1}. doc {d}
          </text>
        </g>
      ))}
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          k = {k}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={k}
            onChange={(e) => setK(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Two rankings and their reciprocal rank fusion"
      >
        {col("keyword (BM25)", SPARSE, 0)}
        {col("embedding", DENSE, 110)}
        {col(
          "fused",
          fused.map(([d]) => d),
          220,
        )}
      </svg>
      <figcaption className="viz-caption">
        Each document scores the sum of 1/(k + rank) over the rankings. Small k
        rewards being first in either list, so documents B and D, each top of
        one list, lead. Large k flattens the weights and rewards being fairly
        high in both, so document A, second in both, rises to the top.
      </figcaption>
    </figure>
  );
}
