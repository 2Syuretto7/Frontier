"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** True probability that the chain finishes correctly from each prefix; step 5 is the mistake. */
const V = [0.7, 0.72, 0.75, 0.8, 0.1, 0.05, 0.02, 0];

/** Monte Carlo estimates: fraction of n rollouts from each prefix that reach the right answer. */
export function mcEstimates(n: number, seed: number) {
  const r = rand(seed);
  return V.map((v) => {
    let s = 0;
    for (let i = 0; i < n; i++) if (r() < v) s++;
    return s / n;
  });
}

export function StepLabelViz() {
  const [n, setN] = useState(8);
  const [seed, setSeed] = useState(1);
  const est = useMemo(() => mcEstimates(n, seed), [n, seed]);
  const firstHard = est.findIndex((e) => e === 0);
  const W = 330,
    H = 190,
    x0 = 34,
    y0 = 12,
    pw = 280,
    ph = 140,
    c = pw / V.length;
  const sx = (i: number) => x0 + (i + 0.5) * c;
  const sy = (v: number) => y0 + (1 - v) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">rollouts per step</span>
        <div className="segmented" role="group" aria-label="Rollouts per step">
          {[4, 8, 32].map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={n === v}
              onClick={() => setN(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
          resample
        </button>
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
        aria-label="Estimated value of each step of a reasoning chain"
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
        <rect
          x={x0 + 4 * c}
          y={y0}
          width={c}
          height={ph}
          fill="var(--danger)"
          fillOpacity={0.12}
        />
        <path
          d={V.map(
            (v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`,
          ).join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        {est.map((e, i) => (
          <circle
            key={i}
            cx={sx(i)}
            cy={sy(e)}
            r={4.5}
            fill={e === 0 ? "var(--danger)" : "var(--accent)"}
          />
        ))}
        {V.map((_, i) => (
          <text
            key={i}
            x={sx(i)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {i + 1}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 2}
          textAnchor="middle"
          className="viz-label"
        >
          step
        </text>
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        first step labelled wrong (no rollout succeeds):{" "}
        <strong>{firstHard < 0 ? "none" : firstHard + 1}</strong> (true mistake:
        step 5)
      </div>
      <figcaption className="viz-caption">
        Dashed: the true chance of reaching the right answer from each step of a
        chain whose fifth step is a mistake. Dots: estimates from rollouts that
        continue the chain from that step. A hard label calls a step wrong when
        no rollout succeeds; with few rollouts it often blames a later step
        instead of the mistake.
      </figcaption>
    </figure>
  );
}
