"use client";

import { useState } from "react";

/** Share of programs passing k random tests that are correct. */
export function filteredPrecision(p: number, a: number, k: number) {
  return p / (p + (1 - p) * a ** k);
}

export function TestFilterViz() {
  const [pi, setPi] = useState(10);
  const [ai, setAi] = useState(80);
  const p = pi / 100,
    a = ai / 100,
    K = 30;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (k: number) => x0 + (k / K) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const ks = Array.from({ length: K + 1 }, (_, k) => k);
  const path = (f: (k: number) => number) =>
    ks
      .map(
        (k, i) => `${i ? "L" : "M"}${sx(k).toFixed(1)},${sy(f(k)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          share of samples correct = {p.toFixed(2)}{" "}
          <input
            type="range"
            min={1}
            max={90}
            value={pi}
            onChange={(e) => setPi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          a wrong program agrees on {ai}% of inputs{" "}
          <input
            type="range"
            min={10}
            max={99}
            value={ai}
            onChange={(e) => setAi(+e.target.value)}
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
        aria-label="Share of correct programs among those that pass the tests"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <path
          d={path((k) => a ** k)}
          fill="none"
          stroke="var(--danger)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <path
          d={path((k) => filteredPrecision(p, a, k))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[0, 10, 20, 30].map((k) => (
          <text
            key={k}
            x={sx(k)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {k}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          random tests k
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--accent)" }}>
          correct among programs that pass
        </span>
        <span style={{ color: "var(--danger)" }}>a wrong program passes</span>
      </div>
      <figcaption className="viz-caption">
        Sampled programs are run on k random tests and only those that pass are
        kept. A wrong program that agrees with the right answer on most inputs
        slips through each test with high probability, so many tests are needed
        before the kept programs are mostly correct, especially when correct
        samples are rare.
      </figcaption>
    </figure>
  );
}
