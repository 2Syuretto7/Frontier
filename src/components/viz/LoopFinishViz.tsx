"use client";

import { useState } from "react";

/** Discounted return of finishing the race: reward f at step t. */
export function finishReturn(f: number, t: number, gamma: number) {
  return f * gamma ** t;
}

/** Discounted return of circling forever: reward r at step first, then every period steps. */
export function loopReturn(
  r: number,
  first: number,
  period: number,
  gamma: number,
) {
  return (r * gamma ** first) / (1 - gamma ** period);
}

const G0 = 0.8,
  G1 = 0.999;

export function LoopFinishViz() {
  const [f, setF] = useState(20);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    ymax = 30;
  const gs = Array.from({ length: 121 }, (_, i) => G0 + ((G1 - G0) * i) / 120);
  const sx = (g: number) => x0 + ((g - G0) / (G1 - G0)) * pw;
  const sy = (v: number) => y0 + (1 - Math.min(v, ymax) / ymax) * ph;
  const path = (fn: (g: number) => number) =>
    gs
      .map(
        (g, i) => `${i ? "L" : "M"}${sx(g).toFixed(1)},${sy(fn(g)).toFixed(1)}`,
      )
      .join(" ");
  const fin = (g: number) => finishReturn(f, 20, g);
  const loop = (g: number) => loopReturn(1, 3, 5, g);
  const dg = (G1 - G0) / 120;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          reward for finishing: {f}{" "}
          <input
            type="range"
            min={5}
            max={60}
            value={f}
            onChange={(e) => setF(+e.target.value)}
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
        aria-label="Discounted return of finishing against looping for a range of discount factors"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {gs.map((g) =>
          loop(g) > fin(g) ? (
            <rect
              key={g}
              x={sx(g)}
              y={y0}
              width={(dg / (G1 - G0)) * pw + 1}
              height={ph}
              fill="var(--danger)"
              fillOpacity={0.1}
            />
          ) : null,
        )}
        {[0, 10, 20, 30].map((v) => (
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
        {[0.8, 0.9, 0.999].map((g) => (
          <text
            key={g}
            x={sx(g)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {g}
          </text>
        ))}
        <path
          d={path(fin)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <path
          d={path(loop)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          discount factor γ
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
          finish the race at step 20
        </span>
        <span style={{ color: "var(--danger)" }}>
          circle a target worth 1, every 5 steps
        </span>
      </div>
      <figcaption className="viz-caption">
        A racing agent is rewarded for hitting targets and for finishing.
        Circling three targets that respawn earns a small reward forever;
        finishing earns a large one once. Wherever the loop&apos;s discounted
        return is higher (shaded), the optimal policy never finishes. A very
        myopic agent loops for the nearby reward, and a very patient one loops
        because an endless stream outweighs any single prize.
      </figcaption>
    </figure>
  );
}
