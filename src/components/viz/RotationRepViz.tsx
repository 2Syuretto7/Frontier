"use client";

import { useState } from "react";

// representations of the cyclic group Z_n on the plane: rho_m(k) = rotation by 2 pi m k / n
const NS = [4, 6, 8];
const MS = [0, 1, 2, 3];
const V: [number, number] = [0.9, 0.35];

/** The orbit of V under rho_m, the character values and the average of the orbit (the invariant projection of V). */
export function rep(n: number, m: number) {
  const ang = Array.from({ length: n }, (_, k) => (2 * Math.PI * m * k) / n);
  const orbit = ang.map(
    (a) =>
      [
        Math.cos(a) * V[0] - Math.sin(a) * V[1],
        Math.sin(a) * V[0] + Math.cos(a) * V[1],
      ] as [number, number],
  );
  const chi = ang.map((a) => 2 * Math.cos(a));
  const avg: [number, number] = [
    orbit.reduce((s, p) => s + p[0], 0) / n,
    orbit.reduce((s, p) => s + p[1], 0) / n,
  ];
  const dim = Math.round(chi.reduce((s, c) => s + c, 0) / n);
  return { orbit, chi, avg, dim };
}

export function RotationRepViz() {
  const [ni, setNi] = useState(1);
  const [m, setM] = useState(1);
  const n = NS[ni];
  const { orbit, chi, avg, dim } = rep(n, m);
  const sc = 70,
    cx = 90,
    cy = 95;
  const fmt = (c: number) => (Math.abs(c) < 5e-4 ? "0" : c.toFixed(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Group order">
          {NS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ni === j}
              onClick={() => setNi(j)}
            >
              n = {v}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Frequency">
          {MS.map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={m === v}
              onClick={() => setM(v)}
            >
              m = {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 190"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="The images of one vector under a rotation representation of a cyclic group, and their average"
      >
        <circle
          cx={cx}
          cy={cy}
          r={sc * Math.hypot(V[0], V[1])}
          fill="none"
          stroke="var(--grid-line)"
        />
        <line
          x1={cx - 85}
          y1={cy}
          x2={cx + 85}
          y2={cy}
          stroke="var(--border)"
        />
        <line
          x1={cx}
          y1={cy - 85}
          x2={cx}
          y2={cy + 85}
          stroke="var(--border)"
        />
        {orbit.map(([x, y], k) => (
          <line
            key={k}
            x1={cx}
            y1={cy}
            x2={cx + x * sc}
            y2={cy - y * sc}
            stroke={k === 0 ? "var(--text)" : "var(--accent)"}
            strokeOpacity={k === 0 ? 1 : 0.6}
            strokeWidth={k === 0 ? 2 : 1.4}
          />
        ))}
        <circle
          cx={cx + avg[0] * sc}
          cy={cy - avg[1] * sc}
          r={4.5}
          fill="var(--danger)"
        />
        <text x={190} y={22} className="viz-label">
          character χ(k)
        </text>
        {chi.map((c, k) => (
          <text
            key={k}
            x={190 + (k % 4) * 36}
            y={46 + Math.floor(k / 4) * 20}
            className="viz-label"
          >
            {fmt(c)}
          </text>
        ))}
        <text x={190} y={110} className="viz-label">
          mean of χ = {dim}
        </text>
        <text x={190} y={130} className="viz-label">
          = dim of fixed vectors
        </text>
      </svg>
      <figcaption className="viz-caption">
        The cyclic group of order n acts on the plane by ρ(k) = rotation by
        2πmk/n, a different representation for each frequency m. Dark: a vector
        v. Colour: its images ρ(k)v. Red dot: their average, the projection of v
        onto the vectors every ρ(k) fixes. Unless m is a multiple of n, nothing
        but 0 is fixed and the average is 0, matching the mean of the character.
      </figcaption>
    </figure>
  );
}
