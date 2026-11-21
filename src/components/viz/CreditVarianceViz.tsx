"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Variance of the REINFORCE estimate when the last of m + 1 fair-coin actions decides the reward and earlier ones are weighted by γ^d. */
export function creditVariance(m: number, gamma: number) {
  let s = 0;
  for (let d = 1; d <= m; d++) s += gamma ** (2 * d);
  return s / 16;
}

/** Monte Carlo mean and variance of the same estimate. */
export function simulate(m: number, gamma: number, n: number, seed: number) {
  const r = rand(seed);
  const xs: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = r() < 0.5 ? 1 : 0;
    let score = a - 0.5;
    for (let d = 1; d <= m; d++)
      score += gamma ** d * ((r() < 0.5 ? 1 : 0) - 0.5);
    xs.push((a - 0.5) * score);
  }
  const mu = xs.reduce((u, x) => u + x, 0) / n;
  return { mu, v: xs.reduce((u, x) => u + (x - mu) ** 2, 0) / n };
}

const MS = [0, 25, 50, 75, 100, 125, 150, 175, 200];

export function CreditVarianceViz() {
  const [gi, setGi] = useState(990);
  const gamma = gi / 1000;
  const dots = useMemo(
    () => MS.map((m) => simulate(m, gamma, 400, 7 + m).v),
    [gamma],
  );
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    vmax = 13;
  const sx = (m: number) => x0 + (m / 200) * pw;
  const sy = (v: number) => y0 + (1 - Math.min(v, vmax) / vmax) * ph;
  const path = (g: number) =>
    Array.from({ length: 41 }, (_, i) => i * 5)
      .map(
        (m, i) =>
          `${i ? "L" : "M"}${sx(m).toFixed(1)},${sy(creditVariance(m, g)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          discount γ: {gamma.toFixed(3)}{" "}
          <input
            type="range"
            min={900}
            max={1000}
            step={5}
            value={gi}
            onChange={(e) => setGi(+e.target.value)}
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
        aria-label="Variance of the policy gradient estimate against the number of irrelevant steps"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 4, 8, 12].map((v) => (
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
        {[0, 100, 200].map((m) => (
          <text
            key={m}
            x={sx(m)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {m}
          </text>
        ))}
        <path
          d={path(1)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <path
          d={path(gamma)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {MS.map((m, i) => (
          <circle
            key={m}
            cx={sx(m)}
            cy={sy(dots[i])}
            r={3}
            fill="var(--accent)"
            fillOpacity={0.6}
          />
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          irrelevant steps before the deciding action
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
        <span style={{ color: "var(--danger)" }}>variance, no discount</span>
        <span style={{ color: "var(--accent)" }}>
          variance with γ (dots: 400 simulated episodes)
        </span>
      </div>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Signal if the deciding action comes last: 0.25. If it comes first, after
        200 steps: {(0.25 * gamma ** 200).toFixed(4)}
      </p>
      <figcaption className="viz-caption">
        The reward depends only on the last action; every earlier action is a
        coin flip that does not matter. The policy-gradient estimate still
        multiplies each of their scores by the reward, so each adds noise and
        nothing to the mean, and the variance grows in a straight line with the
        horizon. Discounting shrinks the weight of distant actions and flattens
        the curve, but if the action that mattered was the distant one, its
        signal shrinks too.
      </figcaption>
    </figure>
  );
}
