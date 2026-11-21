"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const P = 2000,
  N = 100,
  DT = 1 / N;
const r0 = rand(1922);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const DB = Array.from({ length: P }, () =>
  Array.from({ length: N }, () => gauss() * Math.sqrt(DT)),
);

const INTEGRANDS: [string, (s: number, b: number) => number][] = [
  ["H = 1", () => 1],
  ["H = 2s", (s) => 2 * s],
  ["H = B", (_, b) => b],
  ["H = sign B", (_, b) => (b > 0 ? 1 : b < 0 ? -1 : 0)],
];

/** Itô sums of H dB on [0, 1] over 2,000 simulated paths, with the sample mean square and the sample mean of the integral of H². */
export function isometry(j: number) {
  const h = INTEGRANDS[j][1];
  const vals: number[] = [];
  let rhs = 0;
  for (const path of DB) {
    let b = 0,
      I = 0,
      q = 0;
    for (let k = 0; k < N; k++) {
      const hk = h(k * DT, b);
      I += hk * path[k];
      q += hk * hk * DT;
      b += path[k];
    }
    vals.push(I);
    rhs += q;
  }
  const ms = vals.reduce((a, v) => a + v * v, 0) / P;
  return { vals, ms, rhs: rhs / P };
}

export function ItoIsometryViz() {
  const [j, setJ] = useState(2);
  const { vals, ms, rhs } = isometry(j);
  const W = 340,
    H = 170,
    X0 = 10,
    X1 = W - 10,
    Y1 = H - 20,
    LO = -4,
    HI = 4,
    BINS = 40;
  const counts = Array(BINS).fill(0);
  vals.forEach((v) => {
    const b = Math.floor(((v - LO) / (HI - LO)) * BINS);
    if (b >= 0 && b < BINS) counts[b]++;
  });
  const cmax = Math.max(...counts);
  const bw = (X1 - X0) / BINS;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Integrand">
          {INTEGRANDS.map(([name], i) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={j === i}
              onClick={() => setJ(i)}
            >
              {name}
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
        aria-label="Histogram of a stochastic integral over many simulated paths"
      >
        {counts.map((c, i) => (
          <rect
            key={i}
            x={X0 + i * bw + 0.5}
            y={Y1 - (c / cmax) * (Y1 - 10)}
            width={bw - 1}
            height={(c / cmax) * (Y1 - 10)}
            style={{ fill: "var(--accent)" }}
          />
        ))}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--border-strong)" />
        {[-4, -2, 0, 2, 4].map((v) => (
          <text
            key={v}
            x={X0 + ((v - LO) / (HI - LO)) * (X1 - X0)}
            y={H - 4}
            textAnchor={v === LO ? "start" : v === HI ? "end" : "middle"}
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        mean of (∫H dB)²: {ms.toFixed(3)}; mean of ∫H² ds: {rhs.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The Itô integral of H dB on [0, 1], computed on 2,000 simulated paths of
        100 steps and shown as a histogram. For each integrand the mean square
        of the integral matches the mean of the integral of H² over time, as the
        isometry says. For deterministic integrands the integral is Gaussian;
        for H = B it is close to (B₁² − 1)/2, skewed and bounded below by about
        −½; for H = sign B, whose square is 1, it has the same variance as B₁
        itself.
      </figcaption>
    </figure>
  );
}
