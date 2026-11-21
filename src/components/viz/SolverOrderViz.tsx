"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// probability flow ODE in the noise level: dx/dsigma = (x - D(x, sigma)) / sigma, data a mixture of N(m, 0.3^2)
const S2 = 0.09,
  SMAX = 20,
  SMIN = 0.02,
  NPT = 100,
  NFES = [4, 8, 16, 32, 64, 128];
const DATA = [
  { name: "one cluster", means: [0] },
  { name: "two clusters", means: [-1.5, 1.5] },
];
const r0 = rand(3389);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const XS = Array.from({ length: NPT }, () => SMAX * gauss());

function slopeFn(means: number[]) {
  return (x: number, s: number) => {
    const v = S2 + s * s;
    let num = 0,
      den = 0;
    for (const m of means) {
      const w = Math.exp(-((x - m) ** 2) / (2 * v));
      num += w * (m + (S2 / v) * (x - m));
      den += w;
    }
    return (x - num / den) / s;
  };
}

function solve(
  f: (x: number, s: number) => number,
  x: number,
  steps: number,
  heun: boolean,
) {
  for (let i = 0; i < steps; i++) {
    const s0 = SMAX * (SMIN / SMAX) ** (i / steps),
      s1 = SMAX * (SMIN / SMAX) ** ((i + 1) / steps),
      h = s1 - s0,
      k1 = f(x, s0);
    if (!heun) x += h * k1;
    else x += (h / 2) * (k1 + f(x + h * k1, s1));
  }
  return x;
}

/** Mean endpoint error of Euler and Heun at each budget of drift evaluations, against a 2000-step Heun reference. */
export function solverErrors(d: number) {
  const f = slopeFn(DATA[d].means);
  const ref = XS.map((x) => solve(f, x, 2000, true));
  const err = (steps: number, heun: boolean) =>
    XS.reduce(
      (a, x, i) => a + Math.abs(solve(f, x, steps, heun) - ref[i]) / NPT,
      0,
    );
  return NFES.map((n) => ({ n, euler: err(n, false), heun: err(n / 2, true) }));
}

export function fitSlope(ns: number[], es: number[]) {
  const xs = ns.map(Math.log),
    ys = es.map(Math.log),
    mx = xs.reduce((a, b) => a + b) / xs.length,
    my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0,
    den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  return num / den;
}

export function SolverOrderViz() {
  const [d, setD] = useState(1);
  const errs = solverErrors(d);
  const ns = errs.map((e) => e.n);
  const se = fitSlope(
      ns,
      errs.map((e) => e.euler),
    ),
    sh = fitSlope(
      ns.slice(2),
      errs.slice(2).map((e) => e.heun),
    );
  const W = 340,
    H = 200,
    XL = 40,
    XR = W - 10,
    Y0 = 10,
    Y1 = H - 24,
    LX0 = Math.log2(4) - 0.3,
    LX1 = Math.log2(128) + 0.3,
    LY0 = -3.8,
    LY1 = 1.2;
  const sx = (n: number) =>
    XL + ((Math.log2(n) - LX0) / (LX1 - LX0)) * (XR - XL);
  const sy = (e: number) =>
    Y1 -
    ((Math.max(LY0, Math.min(LY1, Math.log10(e))) - LY0) / (LY1 - LY0)) *
      (Y1 - Y0);
  const series = [
    { key: "euler", color: "var(--danger)", dash: "4 3" },
    { key: "heun", color: "var(--accent)", dash: undefined },
  ] as const;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Data">
          {DATA.map((dd, j) => (
            <button
              key={dd.name}
              type="button"
              className="seg"
              aria-pressed={d === j}
              onClick={() => setD(j)}
            >
              {dd.name}
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
        aria-label="Error of Euler and Heun samplers against the number of drift evaluations, on log scales"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        <line x1={XL} y1={Y0} x2={XL} y2={Y1} stroke="var(--border)" />
        {series.map(({ key, color, dash }) => (
          <g key={key}>
            <path
              d={errs
                .map((e, i) => `${i ? "L" : "M"}${sx(e.n)},${sy(e[key])}`)
                .join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={dash}
            />
            {errs.map((e) => (
              <circle
                key={e.n}
                cx={sx(e.n)}
                cy={sy(e[key])}
                r={2.5}
                fill={color}
              />
            ))}
          </g>
        ))}
        {[-3, -2, -1, 0, 1].map((v) => (
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
        {NFES.map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={H - 8}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        slopes: Euler {se.toFixed(2)}, Heun {sh.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Error at the end of the probability flow ODE, from noise level 20 down
        to 0.02 on a geometric grid, against the number of evaluations of the
        denoiser (horizontal axis). Dashed: Euler, one evaluation per step.
        Solid: Heun, two per step. Doubling the budget halves Euler&apos;s error
        but divides Heun&apos;s by about four once the steps are small enough,
        so at equal cost Heun wins by an order of magnitude or more. With only
        four evaluations Heun takes two enormous steps and does worse than
        Euler. The Heun slope is fitted from 16 evaluations up.
      </figcaption>
    </figure>
  );
}
