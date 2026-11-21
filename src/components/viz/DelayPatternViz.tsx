"use client";

import { useState } from "react";

type Pat = "flat" | "parallel" | "delay";

/** Step at which codebook q of frame t is generated. */
export function stepOf(t: number, q: number, nq: number, p: Pat) {
  return p === "flat" ? t * nq + q : p === "parallel" ? t : t + q;
}

export function nSteps(T: number, nq: number, p: Pat) {
  return p === "flat" ? T * nq : p === "parallel" ? T : T + nq - 1;
}

export function DelayPatternViz() {
  const [p, setP] = useState<Pat>("delay");
  const T = 6,
    NQ = 4,
    c = 34,
    x0 = 44,
    y0 = 22,
    W = x0 + T * c + 10,
    H = y0 + NQ * c + 8;
  const n = nSteps(T, NQ, p);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Pattern">
          {(["flat", "parallel", "delay"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={p === v}
              onClick={() => setP(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 380,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Generation step of each audio token"
      >
        <text x={x0 - 6} y={y0 - 8} textAnchor="end" className="viz-label">
          frame
        </text>
        {Array.from({ length: T }, (_, t) => (
          <text
            key={t}
            x={x0 + t * c + c / 2}
            y={y0 - 8}
            textAnchor="middle"
            className="viz-label"
          >
            {t + 1}
          </text>
        ))}
        {Array.from({ length: NQ }, (_, q) => (
          <g key={q}>
            <text
              x={x0 - 6}
              y={y0 + q * c + c / 2 + 4}
              textAnchor="end"
              className="viz-label"
            >
              q{q + 1}
            </text>
            {Array.from({ length: T }, (_, t) => {
              const s = stepOf(t, q, NQ, p);
              return (
                <g key={t}>
                  <rect
                    x={x0 + t * c + 2}
                    y={y0 + q * c + 2}
                    width={c - 4}
                    height={c - 4}
                    fill="var(--accent)"
                    fillOpacity={0.12 + (0.6 * s) / (n - 1)}
                    stroke="var(--accent)"
                  />
                  <text
                    x={x0 + t * c + c / 2}
                    y={y0 + q * c + c / 2 + 4}
                    textAnchor="middle"
                    style={{ fontSize: 11, fill: "var(--text)" }}
                  >
                    {s + 1}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        generation steps: <strong>{n}</strong>
      </div>
      <figcaption className="viz-caption">
        A codec turns each audio frame into one token per codebook, coarse (q1)
        to fine (q4). Each cell shows the step at which a model generates that
        token. Flattening is exact but takes one step per token. Predicting a
        whole frame at once is fastest but ignores how the codebooks of a frame
        depend on each other. The delay pattern shifts codebook q by q − 1
        frames, so each token still follows the coarser tokens of its own frame,
        at the cost of only three extra steps.
      </figcaption>
    </figure>
  );
}
