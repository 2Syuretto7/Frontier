"use client";

import { useState } from "react";

/** Chance the learner ends with the proxy goal: no disambiguating episode in n, then the bias picks the proxy with probability q. */
export function pMisgeneralise(q: number, eps: number, n: number) {
  return q * (1 - eps) ** n;
}

const Q = 0.9,
  N = 500;

export function GoalMisgenViz() {
  const [ei, setEi] = useState(10);
  const eps = ei / 1000;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (n: number) => x0 + (n / N) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const ns = Array.from({ length: 101 }, (_, i) => i * 5);
  const pm = (n: number) => pMisgeneralise(Q, eps, n);
  const test = (n: number) => 1 - 0.5 * pm(n);
  const path = (fn: (n: number) => number) =>
    ns
      .map(
        (n, i) => `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(fn(n)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          training levels with the coin moved: {(eps * 100).toFixed(1)}%{" "}
          <input
            type="range"
            min={0}
            max={50}
            value={ei}
            onChange={(e) => setEi(+e.target.value)}
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
        aria-label="Chance of learning the proxy goal against the number of training episodes"
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
        {[0, 250, 500].map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <path d={path(pm)} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <path
          d={path(test)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          training episodes
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
        <span style={{ color: "var(--danger)" }}>
          chance of learning &quot;go right&quot;
        </span>
        <span style={{ color: "var(--accent)" }}>
          expected success with the coin anywhere
        </span>
      </div>
      <figcaption className="viz-caption">
        In training the coin is almost always at the right end, so &quot;go
        right&quot; and &quot;get the coin&quot; earn the same reward. Only a
        level with the coin elsewhere tells them apart. The learner is assumed
        to prefer the simpler &quot;go right&quot; 90% of the time when nothing
        distinguishes them. With no moved coins the risk never falls; with a few
        percent it falls quickly. At test the coin can be anywhere, and going
        right finds it only half the time.
      </figcaption>
    </figure>
  );
}
