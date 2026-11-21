"use client";

import { useState } from "react";

// Langevin dynamics in the double well U(x) = (x^2 - 1)^2: dX = -U'(X) dt + dB, so D = 1/2
const NX = 161,
  LO = -2.4,
  HI = 2.4,
  DX = (HI - LO) / (NX - 1),
  D = 0.5,
  DT = 0.0004;
const XS = Array.from({ length: NX }, (_, i) => LO + i * DX);
const B = XS.map((x) => -4 * x * (x * x - 1));
const TIMES = [0, 0.25, 1, 4, 16];

const normalise = (p: number[]) => {
  const m = p.reduce((a, v) => a + v, 0) * DX;
  return p.map((v) => v / m);
};
const STAT = normalise(XS.map((x) => Math.exp(-((x * x - 1) ** 2) / D)));

/** Densities at the listed times from explicit finite differences for dp/dt = -d(b p - D p')/dx, with zero flux at the ends. */
function solve() {
  let p = normalise(XS.map((x) => Math.exp(-((x - 1.2) ** 2) / (2 * 0.04))));
  const snaps: number[][] = [p];
  let t = 0;
  for (const target of TIMES.slice(1)) {
    while (t < target - 1e-9) {
      const flux = Array(NX + 1).fill(0);
      for (let i = 1; i < NX; i++) {
        const bm = (B[i - 1] + B[i]) / 2,
          pm = (p[i - 1] + p[i]) / 2;
        flux[i] = bm * pm - (D * (p[i] - p[i - 1])) / DX;
      }
      p = p.map((v, i) => v - (DT * (flux[i + 1] - flux[i])) / DX);
      t += DT;
    }
    snaps.push(p);
  }
  return snaps;
}

let cache: number[][] | null = null;
export function snapshots() {
  if (!cache) cache = solve();
  return cache;
}

export const leftMass = (p: number[]) =>
  p.slice(0, (NX - 1) / 2).reduce((a, v) => a + v, 0) * DX +
  (p[(NX - 1) / 2] * DX) / 2;

export function FokkerPlanckViz() {
  const [ti, setTi] = useState(1);
  const p = snapshots()[ti];
  const W = 340,
    H = 190,
    XL = 10,
    XR = W - 10,
    Y0 = 8,
    Y1 = H - 22,
    PMAX = 2.2;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const sy = (v: number) => Y1 - (Math.min(v, PMAX) / PMAX) * (Y1 - Y0);
  const line = (q: number[]) =>
    q.map((v, i) => `${i ? "L" : "M"}${sx(XS[i])},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Time">
          {TIMES.map((t, j) => (
            <button
              key={t}
              type="button"
              className="seg"
              aria-pressed={ti === j}
              onClick={() => setTi(j)}
            >
              t = {t}
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
        aria-label="A density evolving under the Fokker-Planck equation towards its stationary law"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border-strong)" />
        <line x1={sx(0)} y1={Y0} x2={sx(0)} y2={Y1} stroke="var(--border)" />
        <path
          d={line(STAT)}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <path
          d={line(p) + ` L${sx(HI)},${sy(0)} L${sx(LO)},${sy(0)} Z`}
          style={{ fill: "var(--accent-soft)" }}
        />
        <path
          d={line(p)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.8}
        />
        {[-2, -1, 0, 1, 2].map((x) => (
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
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        mass in the left well: {(100 * leftMass(p)).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        The density of dX = −U′(X) dt + dB for the double well U(x) = (x² − 1)²,
        started as a narrow bump near x = 1.2 and evolved by the Fokker–Planck
        equation. The drift first pulls the bump into the right well and the
        noise spreads it; then, more slowly, mass leaks over the barrier at 0
        until the density matches the stationary law proportional to exp(−2U)
        (dashed), with half the mass in each well.
      </figcaption>
    </figure>
  );
}
