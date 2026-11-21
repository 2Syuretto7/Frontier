"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 2,
  N = 400,
  DT = T / N,
  X0 = 1,
  THETA = 1.5,
  SIG = 0.6;
const r0 = rand(1931);
const DB = Array.from({ length: N }, () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return (
    Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * Math.sqrt(DT)
  );
});

/** Picard iterates for dX = -1.5X dt + 0.6 dB on one Brownian path: X^(n+1) = x0 + integral of the drift and noise along X^(n). */
export function iterates(n: number) {
  let X = Array(N + 1).fill(X0);
  const all = [X];
  for (let i = 0; i < n; i++) {
    const Y = [X0];
    for (let k = 0; k < N; k++) Y.push(Y[k] - THETA * X[k] * DT + SIG * DB[k]);
    X = Y;
    all.push(X);
  }
  return all;
}

const ITERS = [0, 1, 2, 4, 8, 16];
const LIMIT = iterates(60)[60];

export function PicardViz() {
  const [ni, setNi] = useState(2);
  const n = ITERS[ni];
  const all = iterates(n);
  const X = all[n];
  const gap = Math.max(...X.map((x, k) => Math.abs(x - LIMIT[k])));
  const W = 340,
    H = 200,
    XL = 30,
    XR = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    LO = -2,
    HI = 2.3;
  const sx = (k: number) => XL + (k / N) * (XR - XL);
  const sy = (v: number) =>
    Y1 - ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (Y1 - Y0);
  const line = (p: number[]) =>
    p.map((v, k) => `${k ? "L" : "M"}${sx(k)},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, alignItems: "center", gap: 8 }}
      >
        <span className="viz-label">iterations</span>
        <div
          className="segmented"
          role="group"
          aria-label="Number of Picard iterations"
        >
          {ITERS.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={ni === j}
              onClick={() => setNi(j)}
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
        aria-label="Picard iterates converging to the solution of an SDE on one Brownian path"
      >
        <line x1={XL} y1={sy(0)} x2={XR} y2={sy(0)} stroke="var(--border)" />
        <path
          d={line(LIMIT)}
          fill="none"
          stroke="var(--text)"
          strokeWidth={2.4}
          strokeOpacity={0.3}
        />
        {n > 0 ? (
          <path
            d={line(all[n - 1])}
            fill="none"
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
          />
        ) : null}
        <path
          d={line(X)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
        {[-2, 0, 2].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {[0, 1, 2].map((t) => (
          <text
            key={t}
            x={sx((t / T) * N)}
            y={H - 6}
            textAnchor={t === T ? "end" : "middle"}
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
        iterate {n}: largest distance from the solution {gap.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        Picard iteration for dX = −1.5X dt + 0.6 dB with X₀ = 1 on [0, 2], all
        on one Brownian path. Each iterate (colour) is built by integrating the
        drift along the previous one (dashed). Early iterates overshoot, but the
        error behaves like (Lt)ⁿ/n!, which eventually shrinks faster than any
        geometric rate, and the iterates settle onto the solution (thick grey).
      </figcaption>
    </figure>
  );
}
