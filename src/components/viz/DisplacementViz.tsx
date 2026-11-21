"use client";

import { useState } from "react";

// mu0 = N(-2, 0.5^2); mu1 = equal mixture of N(1, 0.3^2) and N(3, 0.3^2); densities on a grid
const LO = -4,
  HI = 5,
  NG = 901,
  DX = (HI - LO) / (NG - 1),
  GRID = Array.from({ length: NG }, (_, k) => LO + k * DX);
const npdf = (x: number, m: number, s: number) =>
  Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const p0 = (x: number) => npdf(x, -2, 0.5);
const p1 = (x: number) => 0.5 * npdf(x, 1, 0.3) + 0.5 * npdf(x, 3, 0.3);
const P0 = GRID.map(p0);
const P1 = GRID.map(p1);
const NU = 2000,
  US = Array.from({ length: NU }, (_, j) => (j + 0.5) / NU);

function quantiles(p: number[]) {
  const F: number[] = [];
  let s = 0;
  for (const v of p) {
    s += v * DX;
    F.push(s);
  }
  let i = 0;
  return US.map((u) => {
    const target = u * s;
    while (i < NG - 1 && F[i] < target) i++;
    if (i === 0) return GRID[0];
    const f = (target - F[i - 1]) / (F[i] - F[i - 1] || 1);
    return GRID[i - 1] + f * DX;
  });
}
const Q0 = quantiles(P0),
  Q1 = quantiles(P1);
const TS = [0, 0.25, 0.5, 0.75, 1];

/** Curve (x, density) at time t: the displacement interpolant via its quantile map, or the mixture on the grid. */
export function curve(t: number, disp: boolean): [number, number][] {
  if (!disp) return GRID.map((x, i) => [x, (1 - t) * P0[i] + t * P1[i]]);
  const pts: [number, number][] = US.map((_, k) => [
    (1 - t) * Q0[k] + t * Q1[k],
    1 / ((1 - t) / p0(Q0[k]) + t / p1(Q1[k])),
  ]);
  return [[LO, 0], ...pts, [HI, 0]];
}

/** W2 from mu0 to the curve at time t, divided by W2(mu0, mu1). */
export function relDistance(t: number, disp: boolean) {
  const Q = disp
    ? US.map((_, k) => (1 - t) * Q0[k] + t * Q1[k])
    : quantiles(curve(t, false).map((c) => c[1]));
  const w = (A: number[], B: number[]) =>
    Math.sqrt(A.reduce((s, a, k) => s + (a - B[k]) ** 2, 0) / NU);
  return w(Q0, Q) / w(Q0, Q1);
}

export function DisplacementViz() {
  const [disp, setDisp] = useState(true);
  const W = 340,
    H = 230,
    XL = 10,
    XR = W - 10,
    ROW = 42,
    AMP = 34,
    PMAX = 1.4;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const rel = relDistance(0.5, disp);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Interpolation">
          {[true, false].map((d) => (
            <button
              key={String(d)}
              type="button"
              className="seg"
              aria-pressed={disp === d}
              onClick={() => setDisp(d)}
            >
              {d ? "displacement" : "mixture"}
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
        aria-label="Densities along the interpolation at five times, from the source at the top to the target at the bottom"
      >
        {TS.map((t, r) => {
          const c = curve(t, disp);
          const base = 14 + AMP + r * ROW;
          return (
            <g key={t}>
              <line
                x1={XL}
                y1={base}
                x2={XR}
                y2={base}
                stroke="var(--border)"
              />
              <path
                d={c
                  .map(
                    ([x, v], i) =>
                      `${i ? "L" : "M"}${sx(x)},${base - (Math.min(v, PMAX) / PMAX) * AMP}`,
                  )
                  .join(" ")}
                fill="var(--accent)"
                fillOpacity={0.25}
                stroke="var(--accent)"
                strokeWidth={1.4}
              />
              <text x={XR} y={base - 4} textAnchor="end" className="viz-label">
                t = {t}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        W₂(μ₀, μ½) / W₂(μ₀, μ₁) = {rel.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        From a single bump (top) to two bumps (bottom). The displacement
        interpolation moves every quantile of the source in a straight line
        towards the matching quantile of the target: the bump slides right and
        splits on the way, and halfway in time it is exactly halfway in W₂. The
        mixture fades one density out and the other in without moving anything,
        and halfway in time it is much more than halfway in W₂.
      </figcaption>
    </figure>
  );
}
