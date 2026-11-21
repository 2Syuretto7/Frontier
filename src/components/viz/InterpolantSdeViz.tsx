"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { velocity } from "./MarginalFlowViz";

// same interpolant as MarginalFlowViz: x_t = (1 - t) x0 + t x1, noise N(0, 1), data an equal mixture of N(+-1.5, 0.3^2)
const MU = 1.5,
  S2 = 0.09,
  N = 200,
  NP = 40;
const r0 = rand(4417);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const X0 = Array.from({ length: NP }, gauss);
const Z = Array.from({ length: NP }, () => Array.from({ length: N }, gauss));

/** Score of the law of x_t: a mixture of N(t m, (1 - t)^2 + t^2 s2). */
export function iscore(x: number, t: number) {
  const v = (1 - t) ** 2 + t * t * S2;
  let num = 0,
    den = 0;
  for (const m of [-MU, MU]) {
    const w = Math.exp(-((x - t * m) ** 2) / (2 * v));
    num += (w * -(x - t * m)) / v;
    den += w;
  }
  return num / den;
}

const EPS = [0, 0.5, 2];

/** Paths of dX = (b + eps s) dt + sqrt(2 eps) dW from the same noise; eps = 0 is the flow matching ODE. */
export function sdePaths(eps: number) {
  const dt = 1 / N;
  return X0.map((x0, i) => {
    const p = Array(N + 1).fill(0);
    p[0] = x0;
    for (let k = 0; k < N; k++) {
      const t = k * dt;
      p[k + 1] =
        p[k] +
        (velocity(p[k], t) + eps * iscore(p[k], t)) * dt +
        Math.sqrt(2 * eps * dt) * Z[i][k];
    }
    return p;
  });
}

export function InterpolantSdeViz() {
  const [mode, setMode] = useState(1);
  const ps = sdePaths(EPS[mode]);
  const near = ps.filter((p) => Math.abs(Math.abs(p[N]) - MU) < 0.6).length;
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
        <div
          className="segmented"
          role="group"
          aria-label="Noise level of the sampler"
        >
          {EPS.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={mode === j}
              onClick={() => setMode(j)}
            >
              ε = {m}
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
        aria-label="Sampler paths from noise to data for several amounts of added noise"
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
        {near} of {NP} paths end within 0.6 of a cluster
      </div>
      <figcaption className="viz-caption">
        The same interpolant, sampled three ways from the same starting noise.
        With ε = 0 the sampler is the flow matching ODE and its paths are
        smooth. Adding ε times the score to the drift and noise of variance 2ε
        per unit time leaves every marginal unchanged, so the paths become rough
        but still end in the two clusters. Larger ε forgets the starting point
        faster and corrects more of its own errors.
      </figcaption>
    </figure>
  );
}
