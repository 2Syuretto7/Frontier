"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 1000;
const r0 = rand(1921);
const B = [0];
for (let i = 0; i < N; i++) {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  B.push(
    B[i] +
      Math.sqrt(-2 * Math.log(u)) *
        Math.cos(2 * Math.PI * v) *
        Math.sqrt(1 / N),
  );
}
const RULES = ["left", "midpoint", "right"] as const;

/** Running Riemann sums of B dB on [0, 1] with the integrand taken at the left end, the average of the ends, or the right end. */
export function sums(rule: number) {
  const out = [0];
  for (let k = 0; k < N; k++) {
    const h = rule === 0 ? B[k] : rule === 1 ? (B[k] + B[k + 1]) / 2 : B[k + 1];
    out.push(out[k] + h * (B[k + 1] - B[k]));
  }
  return out;
}

export const ENDS = {
  b1: B[N],
  ito: (B[N] ** 2 - 1) / 2,
  strat: B[N] ** 2 / 2,
};

export function ItoSumViz() {
  const [ri, setRi] = useState(0);
  const s = sums(ri);
  const W = 340,
    H = 200,
    X0 = 30,
    X1 = W - 8,
    Y0 = 8,
    Y1 = H - 22;
  const all = [...sums(0), ...sums(2), ...B.map((b, k) => (b * b) / 2)];
  const lo = Math.min(...all) - 0.05,
    hi = Math.max(...all) + 0.05;
  const sx = (k: number) => X0 + (k / N) * (X1 - X0);
  const sy = (v: number) => Y1 - ((v - lo) / (hi - lo)) * (Y1 - Y0);
  const line = (f: (k: number) => number) =>
    Array.from(
      { length: N + 1 },
      (_, k) => `${k ? "L" : "M"}${sx(k)},${sy(f(k))}`,
    ).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Where the integrand is evaluated"
        >
          {RULES.map((r, j) => (
            <button
              key={r}
              type="button"
              className="seg"
              aria-pressed={ri === j}
              onClick={() => setRi(j)}
            >
              {r}
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
        aria-label="Running sums of B dB under three evaluation rules against two closed forms"
      >
        <line x1={X0} y1={sy(0)} x2={X1} y2={sy(0)} stroke="var(--border)" />
        <path
          d={line((k) => (B[k] * B[k]) / 2)}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <path
          d={line((k) => (B[k] * B[k] - k / N) / 2)}
          fill="none"
          stroke="var(--danger)"
          strokeDasharray="2 3"
        />
        <path
          d={line((k) => s[k])}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.6}
        />
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">
          0
        </text>
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={sx(t * N)}
            y={H - 6}
            textAnchor={t === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        sum at t = 1: {s[N].toFixed(3)}; B²/2 = {ENDS.strat.toFixed(3)}, (B² −
        t)/2 = {ENDS.ito.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        One Brownian path on a grid of 1,000 steps, and the running sum of B dB
        (colour) with the integrand taken at the left end of each step, at the
        average of the two ends, or at the right end. The grey dashed curve is
        B²/2, what ordinary calculus predicts; the red dotted curve is (B² −
        t)/2. Left sums follow the red curve, midpoint sums the grey one, and
        right sums lie above the grey curve by the same gap: the choice of point
        changes the answer by the quadratic variation.
      </figcaption>
    </figure>
  );
}
