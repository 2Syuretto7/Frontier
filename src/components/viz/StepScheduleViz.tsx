"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// probability flow ODE dx/dsigma = (x - D(x, sigma)) / sigma for data 0.5 N(-1.5, 0.3^2) + 0.5 N(1.5, 0.3^2)
const S2 = 0.09,
  MEANS = [-1.5, 1.5],
  SMAX = 20,
  SMIN = 0.02,
  NSTEP = 12,
  NPT = 100;
const r0 = rand(8123);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const XS = Array.from({ length: NPT }, () => SMAX * gauss());

const slope = (x: number, s: number) => {
  const v = S2 + s * s;
  let num = 0,
    den = 0;
  for (const m of MEANS) {
    const w = Math.exp(-((x - m) ** 2) / (2 * v));
    num += w * (m + (S2 / v) * (x - m));
    den += w;
  }
  return (x - num / den) / s;
};

/** Accurate solution from s0 to s1 by 40 Heun substeps on a geometric grid. */
function exact(x: number, s0: number, s1: number) {
  const K = 40;
  for (let i = 0; i < K; i++) {
    const a = s0 * (s1 / s0) ** (i / K),
      b = s0 * (s1 / s0) ** ((i + 1) / K),
      h = b - a,
      k1 = slope(x, a);
    x += (h / 2) * (k1 + slope(x + h * k1, b));
  }
  return x;
}

const SCHEDULES = ["uniform", "geometric", "ρ = 7"] as const;

export function grid(kind: number) {
  return Array.from({ length: NSTEP + 1 }, (_, i) => {
    const u = i / NSTEP;
    if (kind === 0) return SMAX + u * (SMIN - SMAX);
    if (kind === 1) return SMAX * (SMIN / SMAX) ** u;
    const r = 7;
    return (SMAX ** (1 / r) + u * (SMIN ** (1 / r) - SMAX ** (1 / r))) ** r;
  });
}

/** Mean local error of each Euler step (from the exact path) and the mean final error of the whole Euler solve. */
export function scheduleErrors(kind: number) {
  const g = grid(kind);
  const local = Array(NSTEP).fill(0);
  let final = 0;
  for (const x0 of XS) {
    let xe = x0,
      xt = x0;
    for (let i = 0; i < NSTEP; i++) {
      const h = g[i + 1] - g[i];
      local[i] +=
        Math.abs(xt + h * slope(xt, g[i]) - exact(xt, g[i], g[i + 1])) / NPT;
      xt = exact(xt, g[i], g[i + 1]);
      xe += h * slope(xe, g[i]);
    }
    final += Math.abs(xe - xt) / NPT;
  }
  return { g, local, final };
}

export function StepScheduleViz() {
  const [k, setK] = useState(2);
  const { g, local, final } = scheduleErrors(k);
  const W = 340,
    H = 200,
    XL = 40,
    XR = W - 10,
    Y0 = 10,
    Y1 = H - 40,
    LX0 = Math.log10(SMIN) - 0.1,
    LX1 = Math.log10(SMAX) + 0.1,
    LY0 = -4,
    LY1 = 1;
  const sx = (s: number) =>
    XL + ((Math.log10(s) - LX0) / (LX1 - LX0)) * (XR - XL);
  const sy = (e: number) =>
    Y1 -
    ((Math.max(LY0, Math.min(LY1, Math.log10(Math.max(e, 1e-12)))) - LY0) /
      (LY1 - LY0)) *
      (Y1 - Y0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Step schedule">
          {SCHEDULES.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {s}
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
        aria-label="Noise levels of a twelve-step schedule and the local error of each Euler step"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        <line x1={XL} y1={Y0} x2={XL} y2={Y1} stroke="var(--border)" />
        {local.map((e, i) => (
          <rect
            key={i}
            x={Math.min(sx(g[i]), sx(g[i + 1])) + 0.5}
            y={sy(e)}
            width={Math.max(1, Math.abs(sx(g[i]) - sx(g[i + 1])) - 1)}
            height={Y1 - sy(e)}
            fill="var(--accent)"
            fillOpacity={0.5}
          />
        ))}
        {g.map((s, i) => (
          <circle key={i} cx={sx(s)} cy={Y1 + 8} r={2.5} fill="var(--text)" />
        ))}
        {[-4, -3, -2, -1, 0, 1].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(10 ** v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {`1e${v}`}
          </text>
        ))}
        {[0.1, 1, 10].map((s) => (
          <text
            key={s}
            x={sx(s)}
            y={H - 8}
            textAnchor="middle"
            className="viz-label"
          >
            σ = {s}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        error after 12 Euler steps: {final.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Twelve Euler steps of the probability flow ODE from σ = 20 down to 0.02,
        with the noise level on a log scale. Dots: the grid. Bars: the mean
        error made by each step, on a log scale. Uniform steps waste most of the
        budget at high noise, where the path is nearly straight, and leave one
        huge step for the region below σ = 2 where the clusters form. Geometric
        and ρ = 7 grids crowd the steps towards low noise and spread the error
        more evenly.
      </figcaption>
    </figure>
  );
}
