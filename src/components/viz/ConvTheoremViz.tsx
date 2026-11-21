"use client";

import { useState } from "react";

// signals on the cyclic group Z_16; f is fixed, the filter h is chosen
const N = 16;
const F = Array.from(
  { length: N },
  (_, k) => (k >= 3 && k <= 7 ? 1 : 0) + (k === 11 ? 0.6 : 0),
);
const FILTERS = [
  { name: "blur", h: [0.5, 0.25, ...new Array(N - 3).fill(0), 0.25] },
  { name: "difference", h: [1, -1, ...new Array(N - 2).fill(0)] },
  { name: "shift by 3", h: [0, 0, 0, 1, ...new Array(N - 4).fill(0)] },
];

export function conv(f: number[], h: number[]) {
  return f.map((_, g) =>
    f.reduce((s, fu, u) => s + fu * h[(g - u + N) % N], 0),
  );
}

/** |f_hat(m)| with f_hat(m) = sum_k f(k) exp(2 pi i m k / N). */
export function mag(f: number[]) {
  return f.map((_, m) => {
    let re = 0,
      im = 0;
    f.forEach((v, k) => {
      re += v * Math.cos((2 * Math.PI * m * k) / N);
      im += v * Math.sin((2 * Math.PI * m * k) / N);
    });
    return Math.hypot(re, im);
  });
}

export function ConvTheoremViz() {
  const [k, setK] = useState(0);
  const h = FILTERS[k].h;
  const out = conv(F, h);
  const rows: [string, number[], number][] = [
    ["f", F, 1.2],
    ["h", h, 1.2],
    ["f * h", out, 1.2],
  ];
  const fr: [string, number[], number][] = [
    ["|f̂|", mag(F), 6],
    ["|ĥ|", mag(h), 2.2],
    ["|f̂| |ĥ|", mag(F).map((v, i) => v * mag(h)[i]), 6],
  ];
  const bw = 7.5;
  const bars = (vals: number[], x0: number, y0: number, top: number) =>
    vals.map((v, i) => {
      const hgt = (Math.abs(v) / top) * 22;
      return (
        <rect
          key={i}
          x={x0 + i * (bw + 1)}
          y={v >= 0 ? y0 - hgt : y0}
          width={bw}
          height={Math.max(hgt, 0.5)}
          fill={v >= 0 ? "var(--accent)" : "var(--danger)"}
        />
      );
    });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Filter">
          {FILTERS.map((x, j) => (
            <button
              key={x.name}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {x.name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 200"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A signal, a filter and their circular convolution, beside the magnitudes of their Fourier transforms"
      >
        <text x={10} y={14} className="viz-label">
          on the group
        </text>
        <text x={180} y={14} className="viz-label">
          Fourier magnitudes
        </text>
        {rows.map(([name, v, top], j) => (
          <g key={name}>
            <text x={10} y={48 + j * 60} className="viz-label">
              {name}
            </text>
            <line
              x1={30}
              y1={50 + j * 60}
              x2={30 + N * (bw + 1)}
              y2={50 + j * 60}
              stroke="var(--border)"
            />
            {bars(v, 30, 50 + j * 60, top)}
          </g>
        ))}
        {fr.map(([name, v, top], j) => (
          <g key={name}>
            <line
              x1={180}
              y1={50 + j * 60}
              x2={180 + N * (bw + 1)}
              y2={50 + j * 60}
              stroke="var(--border)"
            />
            {bars(v, 180, 50 + j * 60, Math.max(top, ...v))}
            <text x={180} y={64 + j * 60} className="viz-label">
              {name}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption">
        Left: a signal f on the cyclic group of 16 elements, a filter h and
        their convolution. Right: the magnitudes of the Fourier coefficients,
        one per irreducible representation. The transform of f * h is the
        product of the transforms, so the bottom right is the Fourier magnitude
        of the bottom left. Blurring damps high frequencies, differencing damps
        low ones, and a shift changes only phases, so every magnitude is
        unchanged.
      </figcaption>
    </figure>
  );
}
