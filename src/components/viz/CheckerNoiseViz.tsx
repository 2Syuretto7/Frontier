"use client";

import { useState } from "react";

/** Expected reward from a checker with false-positive rate f and false-negative rate g, for true success rate p. */
export function measuredReward(p: number, f: number, g: number) {
  return (1 - g) * p + f * (1 - p);
}

export function CheckerNoiseViz() {
  const [gi, setGi] = useState(20);
  const [hi, setHi] = useState(50);
  const f = 0.05,
    g = gi / 100,
    h = hi / 100;
  const pStar = (h - f) / (1 - f - g);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (p: number) => x0 + p * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          checker misses real successes: {g.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={60}
            value={gi}
            onChange={(e) => setGi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          a hack passes the checker: {h.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={hi}
            onChange={(e) => setHi(+e.target.value)}
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
        aria-label="Reward of honest and hacking policies"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {pStar > 0 && (
          <rect
            x={x0}
            y={y0}
            width={Math.min(1, pStar) * pw}
            height={ph}
            fill="var(--danger)"
            fillOpacity={0.1}
          />
        )}
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
            <text
              x={sx(v)}
              y={y0 + ph + 14}
              textAnchor="middle"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(h)}
          y2={sy(h)}
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <line
          x1={sx(0)}
          y1={sy(measuredReward(0, f, g))}
          x2={sx(1)}
          y2={sy(measuredReward(1, f, g))}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          true success rate of the honest policy
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
        <span style={{ color: "var(--accent)" }}>reward for solving</span>
        <span style={{ color: "var(--danger)" }}>reward for hacking</span>
      </div>
      <figcaption className="viz-caption">
        The checker accepts 5% of failed attempts and misses some real
        successes. An honest policy&apos;s reward rises with its true success
        rate, but only with slope 1 − f − g. A hack that fools the checker earns
        a fixed reward; wherever it is higher (shaded), reinforcement learning
        will prefer the hack to getting better at the task.
      </figcaption>
    </figure>
  );
}
