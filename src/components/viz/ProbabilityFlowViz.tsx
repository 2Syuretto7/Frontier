"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { score } from "./ReverseSdeViz";

// data: an equal mixture of N(-1.5, 0.3^2) and N(1.5, 0.3^2); forward VP SDE dX = -X/2 dt + dB on [0, T]
const MU = 1.5,
  T = 5,
  N = 250,
  DT = T / N,
  NP = 40;
const r0 = rand(2207);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const Z = Array.from({ length: NP }, () =>
  Array.from({ length: N + 1 }, gauss),
);

const MODES = ["reverse SDE", "probability flow ODE"] as const;

/** Paths indexed by forward time t = k DT, run backwards from the same noise samples at t = T. */
export function flowPaths(mode: number) {
  return Z.map((z) => {
    const p = Array(N + 1).fill(0);
    p[N] = z[N];
    for (let k = N; k > 0; k--) {
      const x = p[k],
        s = score(x, k * DT);
      if (mode === 0)
        p[k - 1] = x + (x / 2 + s) * DT + Math.sqrt(DT) * z[k - 1];
      else p[k - 1] = x + (x / 2 + s / 2) * DT;
    }
    return p;
  });
}

export function ProbabilityFlowViz() {
  const [mode, setMode] = useState(1);
  const ps = flowPaths(mode);
  const ends = ps.map((p) => p[0]);
  const near = ends.filter((x) => Math.abs(Math.abs(x) - MU) < 0.6).length;
  const W = 340,
    H = 200,
    XL = 30,
    XR = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    LO = -3.5,
    HI = 3.5;
  const sx = (k: number) => XL + (k / N) * (XR - XL);
  const sy = (v: number) =>
    Y1 - ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (Y1 - Y0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Sampler">
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
        aria-label="Sample paths of the reverse SDE and of the probability flow ODE from the same starting noise"
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
          t = 0 (data)
        </text>
        <text x={XR} y={H - 6} textAnchor="end" className="viz-label">
          t = {T} (noise)
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {near} of {NP} paths end within 0.6 of a data mode at t = 0
      </div>
      <figcaption className="viz-caption">
        Both samplers start from the same 40 draws of noise at t = 5 and run
        back to t = 0 with the exact score of the noised data. The reverse SDE
        adds fresh noise at every step and its paths are jagged; the probability
        flow ODE has half the score term and no noise, so its paths are smooth
        curves that never cross. Both land on the two clusters at ±1.5, because
        at every time their samples have the same distribution.
      </figcaption>
    </figure>
  );
}
