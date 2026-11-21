"use client";

import { useState } from "react";

/** Total input tokens over T steps: prompt P, o new tokens per step. */
export function inputTokens(T: number, P: number, o: number) {
  return T * P + (o * T * (T - 1)) / 2;
}

/** The same with earlier context read from a cache at a fraction c of the price. */
export function cachedCost(T: number, P: number, o: number, c: number) {
  if (T < 1) return 0;
  let cost = P;
  for (let t = 2; t <= T; t++) cost += c * (P + (t - 2) * o) + o;
  return cost;
}

export function AgentCostViz() {
  const [o, setO] = useState(500);
  const P = 2000,
    TM = 100,
    c = 0.1;
  const W = 330,
    H = 200,
    x0 = 44,
    y0 = 10,
    pw = 270,
    ph = 150;
  const ymax = inputTokens(TM, P, 2000);
  const sx = (t: number) => x0 + (t / TM) * pw;
  const sy = (v: number) => y0 + (1 - v / ymax) * ph;
  const ts = Array.from({ length: TM + 1 }, (_, t) => t);
  const path = (f: (t: number) => number) =>
    ts
      .map(
        (t, i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(f(t)).toFixed(1)}`,
      )
      .join(" ");
  const fmt = (v: number) => (v === 0 ? "0" : `${(v / 1e6).toFixed(1)}M`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          new tokens per step = {o}{" "}
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={o}
            onChange={(e) => setO(+e.target.value)}
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
        aria-label="Cumulative input tokens over the steps of an agent"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, ymax / 2, ymax].map((v) => (
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
              {fmt(v)}
            </text>
          </g>
        ))}
        <path
          d={path((t) => inputTokens(t, P, o))}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <path
          d={path((t) => cachedCost(t, P, o, c))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[0, 25, 50, 75, 100].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          steps
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
          input tokens read: {fmt(inputTokens(TM, P, o))}
        </span>
        <span style={{ color: "var(--accent)" }}>
          cost with caching at 10%: {fmt(cachedCost(TM, P, o, c))}
        </span>
      </div>
      <figcaption className="viz-caption">
        An agent with a 2000-token prompt rereads its whole history at every
        step, so the tokens it reads grow with the square of the number of
        steps. Caching the unchanged prefix and charging a tenth for it divides
        the bill by nearly ten, but the growth is still quadratic.
      </figcaption>
    </figure>
  );
}
