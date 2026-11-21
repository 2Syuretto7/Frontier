"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// velocity v(x) = -1.2 sin x on [-3, 3]; initial density an equal mixture of N(-1.5, 0.5^2) and N(1.5, 0.5^2)
const LO = -3,
  HI = 3,
  NC = 120,
  DX = (HI - LO) / NC,
  DT = 0.02,
  NPART = 2000,
  NB = 40;
const vel = (x: number) => -1.2 * Math.sin(x);
const p0 = (x: number) =>
  (Math.exp(-((x + 1.5) ** 2) / 0.5) + Math.exp(-((x - 1.5) ** 2) / 0.5)) /
  (2 * Math.sqrt(0.5 * Math.PI));
const r0 = rand(5303);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const X0 = Array.from(
  { length: NPART },
  (_, i) => (i % 2 ? 1.5 : -1.5) + 0.5 * gauss(),
);
const TIMES = [0, 0.5, 1.5, 3];

/** Finite-volume (upwind) solution of the continuity equation and particles moved by the same field, at time t. */
export function transport(t: number) {
  const steps = Math.round(t / DT);
  let p = Array.from({ length: NC }, (_, i) => p0(LO + (i + 0.5) * DX));
  const xs = X0.slice();
  for (let s = 0; s < steps; s++) {
    const F = Array(NC + 1).fill(0);
    for (let f = 1; f < NC; f++) {
      const v = vel(LO + f * DX);
      F[f] = v > 0 ? v * p[f - 1] : v * p[f];
    }
    p = p.map((q, i) => q - (DT / DX) * (F[i + 1] - F[i]));
    for (let k = 0; k < NPART; k++) xs[k] += DT * vel(xs[k]);
  }
  const hist = Array(NB).fill(0);
  const bw = (HI - LO) / NB;
  for (const x of xs) {
    const b = Math.floor((x - LO) / bw);
    if (b >= 0 && b < NB) hist[b] += 1 / (NPART * bw);
  }
  const mass = p.reduce((a, b) => a + b, 0) * DX;
  return { p, hist, mass };
}

export function DensityTransportViz() {
  const [ti, setTi] = useState(2);
  const t = TIMES[ti];
  const { p, hist, mass } = transport(t);
  const W = 340,
    H = 190,
    XL = 28,
    XR = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    PMAX = 4;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const sy = (v: number) => Y1 - (Math.min(v, PMAX) / PMAX) * (Y1 - Y0);
  const bw = (HI - LO) / NB;
  const peak = Math.max(...p);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Time">
          {TIMES.map((tt, j) => (
            <button
              key={tt}
              type="button"
              className="seg"
              aria-pressed={ti === j}
              onClick={() => setTi(j)}
            >
              t = {tt}
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
        aria-label="Histogram of transported particles and the finite-volume solution of the continuity equation"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        {hist.map((h, b) => (
          <rect
            key={b}
            x={sx(LO + b * bw) + 0.5}
            y={sy(h)}
            width={Math.max(0, sx(LO + bw) - sx(LO) - 1)}
            height={Y1 - sy(h)}
            fill="var(--text-muted)"
            fillOpacity={0.35}
          />
        ))}
        <path
          d={p
            .map(
              (v, i) => `${i ? "L" : "M"}${sx(LO + (i + 0.5) * DX)},${sy(v)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.8}
        />
        {[-2, 0, 2].map((x) => (
          <text
            key={x}
            x={sx(x)}
            y={H - 6}
            textAnchor="middle"
            className="viz-label"
          >
            {x}
          </text>
        ))}
        {[0, 2, 4].map((v) => (
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
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        total mass {mass.toFixed(3)}, peak density {peak.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        The velocity field v(x) = −1.2 sin x pushes everything towards 0. Grey
        bars: a histogram of 2000 particles moved by the ODE. Curve: the
        continuity equation solved on a grid by a conservative upwind scheme,
        which never looks at a particle. They agree at every time: the two
        clusters slide inwards and pile up, the density rising where the
        velocity converges, while the total mass stays 1.
      </figcaption>
    </figure>
  );
}
