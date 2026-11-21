"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// geometric Brownian motion dX = mu X dt + sigma X dW, X0 = 1, on [0, 1]
const MU = 1,
  NF = 256,
  NPATH = 1000,
  LEVELS = [2, 4, 8, 16, 32, 64, 128];
const r0 = rand(6151);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const DW = Array.from({ length: NPATH }, () =>
  Array.from({ length: NF }, () => gauss() * Math.sqrt(1 / NF)),
);
const SIGMAS = [0, 0.5, 1];

/** Strong error E|X_EM - X_exact| from shared Brownian paths, and the exact weak error of the mean, for each step count. */
export function emErrors(sigma: number) {
  return LEVELS.map((n) => {
    const h = 1 / n,
      r = NF / n;
    let strong = 0;
    for (const dw of DW) {
      let x = 1,
        w = 0;
      for (let k = 0; k < n; k++) {
        let d = 0;
        for (let j = 0; j < r; j++) d += dw[k * r + j];
        x += MU * x * h + sigma * x * d;
        w += d;
      }
      const exact = Math.exp(MU - (sigma * sigma) / 2 + sigma * w);
      strong += Math.abs(x - exact) / NPATH;
    }
    const weak = Math.abs(Math.exp(MU) - (1 + MU * h) ** n);
    return { h, strong, weak };
  });
}

export function slope(pts: { h: number; e: number }[]) {
  const xs = pts.map((p) => Math.log(p.h)),
    ys = pts.map((p) => Math.log(p.e));
  const mx = xs.reduce((a, b) => a + b) / xs.length,
    my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0,
    den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  return num / den;
}

export function EmConvergenceViz() {
  const [si, setSi] = useState(2);
  const errs = emErrors(SIGMAS[si]);
  const ss = slope(errs.map((e) => ({ h: e.h, e: e.strong })));
  const W = 340,
    H = 200,
    XL = 34,
    XR = W - 10,
    Y0 = 10,
    Y1 = H - 24,
    LX0 = Math.log2(1 / 128) - 0.3,
    LX1 = Math.log2(1 / 2) + 0.3,
    LY0 = -2.3,
    LY1 = 0.2;
  const sx = (h: number) =>
    XL + ((Math.log2(h) - LX0) / (LX1 - LX0)) * (XR - XL);
  const sy = (e: number) =>
    Y1 -
    ((Math.max(LY0, Math.min(LY1, Math.log10(e))) - LY0) / (LY1 - LY0)) *
      (Y1 - Y0);
  const series = [
    { key: "strong", color: "var(--accent)", dash: undefined },
    { key: "weak", color: "var(--danger)", dash: "4 3" },
  ] as const;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Noise level">
          {SIGMAS.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              σ = {s}
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
        aria-label="Strong and weak errors of Euler-Maruyama against step size on log scales"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        <line x1={XL} y1={Y0} x2={XL} y2={Y1} stroke="var(--border)" />
        {series.map(({ key, color, dash }) => (
          <g key={key}>
            <path
              d={errs
                .map((e, i) => `${i ? "L" : "M"}${sx(e.h)},${sy(e[key])}`)
                .join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={dash}
            />
            {errs.map((e) => (
              <circle
                key={e.h}
                cx={sx(e.h)}
                cy={sy(e[key])}
                r={2.5}
                fill={color}
              />
            ))}
          </g>
        ))}
        {[-2, -1, 0].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(10 ** v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {10 ** v}
          </text>
        ))}
        {[1 / 128, 1 / 32, 1 / 8, 1 / 2].map((h) => (
          <text
            key={h}
            x={sx(h)}
            y={H - 8}
            textAnchor="middle"
            className="viz-label"
          >
            h = 1/{Math.round(1 / h)}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        fitted slope of the strong error: {ss.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Euler-Maruyama for geometric Brownian motion with drift 1 on [0, 1].
        Solid line: the strong error, the mean distance from the exact solution
        driven by the same Brownian path, over 1000 paths. Dashed line: the weak
        error, the error in the mean. Halving the step halves the weak error,
        slope 1 on these log scales. The strong error has slope 1 when σ = 0,
        where the scheme is Euler&apos;s method, but close to 1/2 once the noise
        multiplies the state.
      </figcaption>
    </figure>
  );
}
