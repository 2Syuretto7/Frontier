"use client";

import { useState } from "react";

/** Per-episode defection rate that gives probability target of at least one defection in m deployment episodes. */
export function defectionRate(m: number, target: number) {
  return 1 - (1 - target) ** (1 / m);
}

/** Chance of catching at least one defection in n tests, when the agent recognises a test with probability recognise. */
export function caught(delta: number, n: number, recognise: number) {
  return 1 - (1 - delta * (1 - recognise)) ** n;
}

const M = 1000,
  NMAX = 5000;

export function RareDefectionViz() {
  const [ri, setRi] = useState(50);
  const rec = ri / 100;
  const delta = defectionRate(M, 0.5);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (n: number) => x0 + (n / NMAX) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const ns = Array.from({ length: 101 }, (_, i) => i * 50);
  const path = (r: number) =>
    ns
      .map(
        (n, i) =>
          `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(caught(delta, n, r)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          agent recognises a test: {rec.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={99}
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
        aria-label="Chance that testing catches a rarely defecting agent"
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
        {[0, 1000, 2500, 5000].map((n) => (
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
        <line
          x1={sx(M)}
          x2={sx(M)}
          y1={y0}
          y2={y0 + ph}
          stroke="var(--grid-line)"
          strokeDasharray="4 3"
        />
        <path
          d={path(0)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <path
          d={path(rec)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          test episodes
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
          tests indistinguishable from deployment
        </span>
        <span style={{ color: "var(--danger)" }}>
          with the chosen recognition rate
        </span>
      </div>
      <figcaption className="viz-caption">
        An agent wants at least an even chance of defecting once in 1,000
        deployment episodes (dashed line), so it defects at random with a small
        probability each episode. If tests look exactly like deployment, as many
        tests as deployments catch it half the time, and more tests catch it
        almost surely. If it can tell tests apart, it simply behaves during
        them, and testing loses its power in proportion.
      </figcaption>
    </figure>
  );
}
