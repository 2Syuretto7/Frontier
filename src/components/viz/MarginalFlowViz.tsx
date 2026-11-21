"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// noise x0 ~ N(0, 1) at t = 0, data x1 ~ equal mixture of N(-1.5, 0.3^2) and N(1.5, 0.3^2) at t = 1
const MU = 1.5,
  S2 = 0.09,
  N = 200,
  NP = 40;
const r0 = rand(7731);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const X0 = Array.from({ length: NP }, gauss);
const X1 = Array.from(
  { length: NP },
  (_, i) => (i % 2 ? MU : -MU) + Math.sqrt(S2) * gauss(),
);

/** Marginal velocity E[x1 - x0 | x_t = x] for the straight-line path x_t = (1 - t) x0 + t x1. */
export function velocity(x: number, t: number) {
  const a = 1 - t,
    b = t,
    v = a * a + b * b * S2,
    c = (b * S2 - a) / v;
  let num = 0,
    den = 0;
  for (const m of [-MU, MU]) {
    const w = Math.exp(-((x - b * m) ** 2) / (2 * v));
    num += w * (m + c * (x - b * m));
    den += w;
  }
  return num / den;
}

const MODES = ["conditional paths", "marginal flow"] as const;

export function flowPaths(mode: number) {
  return X0.map((x0, i) => {
    const p = Array(N + 1).fill(0);
    p[0] = x0;
    for (let k = 0; k < N; k++)
      p[k + 1] =
        mode === 0
          ? (1 - (k + 1) / N) * x0 + ((k + 1) / N) * X1[i]
          : p[k] + velocity(p[k], k / N) / N;
    return p;
  });
}

export function crossings(ps: number[][]) {
  let c = 0;
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      if ((ps[i][0] - ps[j][0]) * (ps[i][N] - ps[j][N]) < 0) c++;
  return c;
}

export function MarginalFlowViz() {
  const [mode, setMode] = useState(1);
  const ps = flowPaths(mode);
  const cr = crossings(ps);
  const W = 340,
    H = 200,
    XL = 30,
    XR = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    LO = -3,
    HI = 3;
  const sx = (k: number) => XL + (k / N) * (XR - XL);
  const sy = (v: number) =>
    Y1 - ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (Y1 - Y0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Paths shown">
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
        aria-label="Straight conditional paths from noise to data and the curved paths of the marginal velocity field"
      >
        {[-MU, MU].map((m) => (
          <line
            key={m}
            x1={XL}
            y1={sy(m)}
            x2={XR}
            y2={sy(m)}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
        ))}
        {ps.map((p, i) => (
          <path
            key={i}
            d={p.map((v, k) => `${k ? "L" : "M"}${sx(k)},${sy(v)}`).join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={0.7}
            strokeOpacity={0.6}
          />
        ))}
        {[-1.5, 0, 1.5].map((v) => (
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
        <text x={XL} y={H - 6} className="viz-label">
          t = 0 (noise)
        </text>
        <text x={XR} y={H - 6} textAnchor="end" className="viz-label">
          t = 1 (data)
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        pairs of paths that swap order: {cr} of {(NP * (NP - 1)) / 2}
      </div>
      <figcaption className="viz-caption">
        Conditional paths join each noise sample to a randomly paired data point
        by a straight line, and they cross everywhere. Averaging their
        velocities at each point gives the marginal velocity field; its paths,
        started from the same noise, bend smoothly into the two clusters and
        never cross, because an ODE with a smooth velocity cannot send two
        points through the same place at the same time.
      </figcaption>
    </figure>
  );
}
