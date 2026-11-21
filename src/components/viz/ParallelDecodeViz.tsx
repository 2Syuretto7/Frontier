"use client";

import { useState } from "react";

const CITIES: [string, string][] = [
  ["New", "York"],
  ["Los", "Angeles"],
  ["San", "Diego"],
  ["Las", "Vegas"],
];

/** Probability that independent sampling of the two words gives a real name, with k equally likely names. */
export function parallelValid(k: number) {
  return k * (1 / k) * (1 / k);
}

export function ParallelDecodeViz() {
  const [k, setK] = useState(2);
  const [steps, setSteps] = useState(1);
  const c = 46,
    x0 = 62,
    y0 = 40,
    W = x0 + 4 * c + 10,
    H = y0 + 4 * c + 8;
  const prob = (i: number, j: number) =>
    i >= k || j >= k ? 0 : steps === 2 ? (i === j ? 1 / k : 0) : 1 / (k * k);
  const valid = steps === 2 ? 1 : parallelValid(k);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">names</span>
        <div className="segmented" role="group" aria-label="Number of names">
          {[2, 3, 4].map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === v}
              onClick={() => setK(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="viz-label">unmasking</span>
        <div className="segmented" role="group" aria-label="Steps">
          {[1, 2].map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={steps === v}
              onClick={() => setSteps(v)}
            >
              {v === 1 ? "both at once" : "one per step"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Joint distribution of sampled word pairs"
      >
        {CITIES.map(([a, b], i) => (
          <g key={i}>
            <text
              x={x0 - 6}
              y={y0 + i * c + c / 2 + 4}
              textAnchor="end"
              className="viz-label"
              opacity={i < k ? 1 : 0.35}
            >
              {a}
            </text>
            <text
              x={x0 + i * c + c / 2}
              y={y0 - 8}
              textAnchor="middle"
              className="viz-label"
              opacity={i < k ? 1 : 0.35}
            >
              {b}
            </text>
          </g>
        ))}
        {CITIES.map((_, i) =>
          CITIES.map((_, j) => {
            const p = prob(i, j);
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={x0 + j * c + 2}
                  y={y0 + i * c + 2}
                  width={c - 4}
                  height={c - 4}
                  fill={
                    p === 0
                      ? "var(--surface)"
                      : i === j
                        ? "var(--success)"
                        : "var(--danger)"
                  }
                  fillOpacity={p === 0 ? 1 : 0.2 + 0.7 * p * 2}
                  stroke="var(--border)"
                />
                {p > 0 && (
                  <text
                    x={x0 + j * c + c / 2}
                    y={y0 + i * c + c / 2 + 4}
                    textAnchor="middle"
                    style={{ fontSize: 10, fill: "var(--text)" }}
                  >
                    {p.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        probability of a real name: <strong>{valid.toFixed(3)}</strong>
      </div>
      <figcaption className="viz-caption">
        The data are k two-word city names, equally likely, and both words start
        masked. The exact denoiser gives each word its correct marginal, but
        unmasking both at once samples them independently, so only a fraction
        1/k of pairs are names (the rest are red). Unmasking one word, then the
        other conditioned on it, is always right. Parallel decoding trades this
        factorisation error against speed.
      </figcaption>
    </figure>
  );
}
