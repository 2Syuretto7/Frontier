"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 16;
const r0 = rand(1806);
// heavy-tailed response lengths in tokens: most are short, a few run long
export const LENGTHS = Array.from({ length: N }, () => {
  const u1 = Math.max(r0(), 1e-9),
    u2 = r0();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(Math.min(Math.exp(6.2 + 0.7 * z), 4000));
});
const MODES = ["wait for all", "keep first 12", "partial rollouts"] as const;

/** Round length and the share of slot time spent on tokens that are kept, for each way of ending a generation round. */
export function round(mode: number) {
  const sorted = [...LENGTHS].sort((a, b) => a - b);
  const end =
    mode === 0 ? sorted[N - 1] : mode === 1 ? sorted[11] : sorted[N / 2];
  const kept = LENGTHS.reduce(
    (a, n) => a + (mode === 1 ? (n <= end ? n : 0) : Math.min(n, end)),
    0,
  );
  return { end, util: kept / (N * end) };
}

export function RolloutStragglerViz() {
  const [mode, setMode] = useState(0);
  const { end, util } = round(mode);
  const W = 340,
    X0 = 8,
    X1 = W - 8,
    Y0 = 6,
    RH = 11;
  const sx = (n: number) => X0 + (n / end) * (X1 - X0);
  const H = Y0 + N * RH + 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div
          className="segmented"
          role="group"
          aria-label="How a round of generation ends"
        >
          {MODES.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={mode === j}
              onClick={() => setMode(j)}
            >
              {m}
            </button>
          ))}
        </div>
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
        aria-label="Generation slots over one round, showing finished, idle and cut-off responses"
      >
        {LENGTHS.map((n, i) => {
          const y = Y0 + i * RH;
          const done = n <= end;
          const fill = done || mode === 2 ? "var(--accent)" : "var(--danger)";
          return (
            <g key={i}>
              <rect
                x={X0}
                y={y}
                width={X1 - X0}
                height={RH - 3}
                style={{ fill: "var(--bg-subtle)" }}
              />
              <rect
                x={X0}
                y={y}
                width={sx(Math.min(n, end)) - X0}
                height={RH - 3}
                style={{ fill }}
              />
              {!done && mode === 2 ? (
                <rect
                  x={X1 - 3}
                  y={y}
                  width={3}
                  height={RH - 3}
                  style={{ fill: "var(--text)" }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        round ends after {end} tokens; {(100 * util).toFixed(0)}% of slot time
        spent on kept tokens
      </div>
      <figcaption className="viz-caption">
        Sixteen responses generated together, one row each, with lengths drawn
        from a heavy-tailed distribution; the row spans the round, and the pale
        part is a slot left idle. Waiting for every response lets the longest
        set the pace. Starting more prompts than needed and keeping the first
        twelve to finish discards the rest (red). Partial rollouts stop the
        round at a token budget, here the median length, and carry unfinished
        responses (dark mark) into the next round, so no work is lost.
      </figcaption>
    </figure>
  );
}
