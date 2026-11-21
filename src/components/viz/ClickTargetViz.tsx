"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Probability that a click with Gaussian error sigma lands in a w x h target centred on the aim point. */
export function hitProb(w: number, h: number, sigma: number) {
  const erf = (x: number) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x);
    return x >= 0 ? y : -y;
  };
  const z = 2 * Math.SQRT2 * sigma;
  return erf(w / z) * erf(h / z);
}

export function ClickTargetViz() {
  const [w, setW] = useState(40);
  const [sigma, setSigma] = useState(10);
  const h = 24;
  const clicks = useMemo(() => {
    const r = rand(7);
    return Array.from({ length: 200 }, () => {
      const u = 1 - r(),
        v = r();
      const m = Math.sqrt(-2 * Math.log(u));
      return [m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)];
    });
  }, []);
  const W = 330,
    H = 170,
    cx = W / 2,
    cy = H / 2;
  const hits = clicks.filter(
    ([a, b]) => Math.abs(a * sigma) <= w / 2 && Math.abs(b * sigma) <= h / 2,
  ).length;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          button width = {w}px{" "}
          <input
            type="range"
            min={10}
            max={120}
            value={w}
            onChange={(e) => setW(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          pointing error σ = {sigma}px{" "}
          <input
            type="range"
            min={2}
            max={30}
            value={sigma}
            onChange={(e) => setSigma(+e.target.value)}
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
        aria-label="Simulated clicks around a button"
      >
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="var(--surface)"
          stroke="var(--border)"
        />
        <rect
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          rx={4}
          fill="var(--accent)"
          fillOpacity={0.25}
          stroke="var(--accent)"
        />
        {clicks.map(([a, b], i) => {
          const x = cx + a * sigma,
            y = cy + b * sigma;
          const hit =
            Math.abs(a * sigma) <= w / 2 && Math.abs(b * sigma) <= h / 2;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.8}
              fill={hit ? "var(--success)" : "var(--danger)"}
            />
          );
        })}
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        hit rate: <strong>{(hitProb(w, h, sigma) * 100).toFixed(1)}%</strong>{" "}
        exact, {hits} of 200 simulated clicks
      </div>
      <figcaption className="viz-caption">
        A 24-pixel-high button and 200 clicks aimed at its centre. An agent that
        predicts click coordinates from a screenshot misses its aim by a random
        amount. With Gaussian error the hit rate is a product of two error
        functions, so small targets need precise grounding, which is why agents
        zoom in on a region before clicking something small.
      </figcaption>
    </figure>
  );
}
