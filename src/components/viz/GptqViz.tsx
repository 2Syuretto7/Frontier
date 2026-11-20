"use client";

import { useState } from "react";

const W0: [number, number] = [0.4, 0.4];
const RHOS = [0, 0.5, 0.9];

/** Output error (w - q)^T H (w - q) with H = [[1, rho], [rho, 1]]. */
export function err(q: [number, number], rho: number) {
  const a = W0[0] - q[0],
    b = W0[1] - q[1];
  return a * a + b * b + 2 * rho * a * b;
}

/** Quantise coordinate 0 by rounding, push its error onto coordinate 1, then round coordinate 1. */
export function gptq(rho: number): [number, number] {
  const q0 = Math.round(W0[0]);
  const w1 = W0[1] + rho * (W0[0] - q0); // optimal adjustment for H = [[1, rho], [rho, 1]]
  return [q0, Math.round(w1)];
}

export function GptqViz() {
  const [ri, setRi] = useState(1);
  const rho = RHOS[ri];
  const rtnQ: [number, number] = [Math.round(W0[0]), Math.round(W0[1])];
  const gq = gptq(rho);
  const grid: [number, number][] = [];
  for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) grid.push([i, j]);
  const best = grid.reduce((b, q) => (err(q, rho) < err(b, rho) ? q : b));
  const W = 330,
    H = 250,
    cx = 165,
    cy = 120,
    U = 60;
  const px = (v: number) => cx + (v - 0.5) * U,
    py = (v: number) => cy - (v - 0.5) * U;
  // ellipse of constant error through the GPTQ point: eigen-directions of H are (1, 1) and (1, -1)
  const e = err(gq, rho);
  const r1 = Math.sqrt(e / (1 + rho)),
    r2 = Math.sqrt(e / (1 - rho));
  const pts = Array.from({ length: 73 }, (_, k) => {
    const t = (k / 72) * 2 * Math.PI;
    const u = r1 * Math.cos(t),
      v = r2 * Math.sin(t);
    return `${px(W0[0] + (u + v) / Math.SQRT2)},${py(W0[1] + (u - v) / Math.SQRT2)}`;
  }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">input correlation</span>
        <div
          className="segmented"
          role="group"
          aria-label="Correlation of the two inputs"
        >
          {RHOS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ri === j}
              onClick={() => setRi(j)}
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
          maxWidth: 400,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Two weights, the quantisation grid and an error contour"
      >
        <polyline
          points={pts}
          fill="none"
          stroke="var(--accent)"
          strokeDasharray="4 3"
        />
        {grid.map(([i, j]) => (
          <circle
            key={`${i},${j}`}
            cx={px(i)}
            cy={py(j)}
            r={3}
            style={{ fill: "var(--text-muted)" }}
          />
        ))}
        <circle
          cx={px(W0[0])}
          cy={py(W0[1])}
          r={5}
          style={{ fill: "var(--text)" }}
        />
        <circle
          cx={px(rtnQ[0])}
          cy={py(rtnQ[1])}
          r={8}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <circle
          cx={px(gq[0])}
          cy={py(gq[1])}
          r={11}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <text x={px(W0[0]) + 8} y={py(W0[1]) - 6} className="viz-label">
          w
        </text>
        {[0, 1].map((v) => (
          <text
            key={`x${v}`}
            x={px(v)}
            y={H - 4}
            textAnchor="middle"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {[0, 1].map((v) => (
          <text key={`y${v}`} x={10} y={py(v) + 4} className="viz-label">
            {v}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        error: nearest rounding {err(rtnQ, rho).toFixed(3)}, with compensation{" "}
        {err(gq, rho).toFixed(3)}, best grid point {err(best, rho).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Two weights w (dark dot) must move to points of the integer grid. The
        layer&apos;s output error is a quadratic form whose contours are
        ellipses, tilted when the two inputs are correlated. Rounding each
        weight separately (red ring) ignores the tilt; quantising the first
        weight and shifting the second to compensate before rounding it
        (coloured ring, with its error contour dashed) follows the tilt.
      </figcaption>
    </figure>
  );
}
