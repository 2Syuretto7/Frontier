"use client";

import { useState } from "react";

export function GroupSignalViz() {
  const [g, setG] = useState(4);
  const [p, setP] = useState(0.3);
  const f = (q: number) => 1 - q ** g - (1 - q) ** g;
  const W = 340,
    H = 180,
    x0 = 32,
    x1 = W - 10,
    y0 = 10,
    y1 = H - 28;
  const X = (q: number) => x0 + q * (x1 - x0),
    Y = (v: number) => y1 - v * (y1 - y0);
  const d = Array.from({ length: 101 }, (_, i) => i / 100)
    .map((q, i) => `${i ? "L" : "M"}${X(q).toFixed(1)},${Y(f(q)).toFixed(1)}`)
    .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          samples per prompt: {g}{" "}
          <input
            type="range"
            min={2}
            max={32}
            step={1}
            value={g}
            onChange={(e) => setG(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          success rate: {p.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p}
            onChange={(e) => setP(+e.target.value)}
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
        aria-label="Chance that a group of samples contains both a right and a wrong answer"
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
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text
            key={v}
            x={X(v)}
            y={y1 + 16}
            textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {v}
          </text>
        ))}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={X(p)} cy={Y(f(p))} r={5} fill="var(--success)" />
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {(100 * f(p)).toFixed(1)}% of prompts at this success rate give a
        learning signal
      </p>
      <figcaption className="viz-caption">
        Group-relative advantages compare samples for the same prompt, so a
        prompt teaches nothing when all its samples are right or all are wrong.
        The curve shows how often a group is mixed, against the model&apos;s
        success rate on the prompt. Prompts the model always or never solves are
        wasted, which is why training sets are filtered to problems of
        intermediate difficulty and groups are made larger for hard ones.
      </figcaption>
    </figure>
  );
}
