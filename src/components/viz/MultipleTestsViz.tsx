"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const M = 20,
  ALPHA = 0.05;

export function MultipleTestsViz() {
  const [seed, setSeed] = useState(7);
  const [real, setReal] = useState(3);
  const ps = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: M }, (_, i) =>
      i < real ? r() * 0.004 : r(),
    ).sort((a, b) => a - b);
  }, [seed, real]);
  const raw = ps.filter((p) => p < ALPHA).length;
  const bonf = ps.filter((p) => p < ALPHA / M).length;
  let holm = 0;
  while (holm < M && ps[holm] < ALPHA / (M - holm)) holm++;
  const W = 340,
    H = 180,
    x0 = 40,
    x1 = W - 10,
    y0 = 10,
    y1 = H - 26;
  const X = (i: number) => x0 + ((i + 0.5) / M) * (x1 - x0);
  const lo = -4;
  const Y = (p: number) =>
    y1 - ((Math.log10(Math.max(p, 1e-4)) - lo) / -lo) * (y1 - y0);
  const holmPath = ps
    .map(
      (_, i) =>
        `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(ALPHA / (M - i)).toFixed(1)}`,
    )
    .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          real improvements: {real}{" "}
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={real}
            onChange={(e) => setReal(+e.target.value)}
          />
        </label>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
          new draw
        </button>
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
        aria-label="Sorted p-values of twenty comparisons with three significance thresholds"
      >
        {[-4, -3, -2, -1, 0].map((e) => (
          <g key={e}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(10 ** e)}
              y2={Y(10 ** e)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 6}
              y={Y(10 ** e) + 4}
              textAnchor="end"
              className="viz-label"
            >
              1e{e}
            </text>
          </g>
        ))}
        <line
          x1={x0}
          x2={x1}
          y1={Y(ALPHA)}
          y2={Y(ALPHA)}
          stroke="var(--danger)"
          strokeDasharray="5 3"
        />
        <line
          x1={x0}
          x2={x1}
          y1={Y(ALPHA / M)}
          y2={Y(ALPHA / M)}
          stroke="var(--text-muted)"
          strokeDasharray="2 3"
        />
        <path
          d={holmPath}
          fill="none"
          stroke="var(--success)"
          strokeWidth={1.5}
        />
        {ps.map((p, i) => (
          <circle
            key={i}
            cx={X(i)}
            cy={Y(p)}
            r={4}
            fill={i < holm ? "var(--success)" : "var(--accent)"}
          />
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        significant at 0.05 uncorrected: {raw}; Bonferroni: {bonf}; Holm: {holm}
      </p>
      <figcaption className="viz-caption">
        Twenty comparisons between two checkpoints, sorted by p-value, of which
        only the chosen number reflect real improvements. The red dashed line is
        the uncorrected 0.05 threshold, the grey dotted line Bonferroni&apos;s
        0.05/20, and the green line Holm&apos;s rising thresholds; points below
        the green line up to the first one above it are declared significant.
        Uncorrected testing regularly reports improvements that are not there.
      </figcaption>
    </figure>
  );
}
