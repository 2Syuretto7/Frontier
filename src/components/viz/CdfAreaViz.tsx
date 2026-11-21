"use client";

import { useState } from "react";

// mu is uniform on [0, 1]; nu is one of several uniform mixtures; everything on a grid over [-0.5, 3.5]
const LO = -0.5,
  HI = 3.5,
  NG = 801,
  DX = (HI - LO) / (NG - 1),
  GRID = Array.from({ length: NG }, (_, k) => LO + k * DX);

type Piece = [number, number, number]; // [start, end, mass]
const cdf = (ps: Piece[]) => (x: number) =>
  ps.reduce(
    (s, [a, b, m]) => s + m * Math.min(1, Math.max(0, (x - a) / (b - a))),
    0,
  );
const MU: Piece[] = [[0, 1, 1]];
const NUS: { name: string; ps: Piece[] }[] = [
  { name: "shift 0.5", ps: [[0.5, 1.5, 1]] },
  { name: "shift 2", ps: [[2, 3, 1]] },
  { name: "spread", ps: [[0, 2, 1]] },
  {
    name: "two lumps",
    ps: [
      [0, 0.25, 0.5],
      [0.75, 1, 0.5],
    ],
  },
];

/** W1 as the area between distribution functions, W2 from quantile functions, and total variation from densities. */
export function distances(k: number) {
  const F = GRID.map(cdf(MU)),
    G = GRID.map(cdf(NUS[k].ps));
  const w1 = F.reduce((s, f, i) => s + Math.abs(f - G[i]) * DX, 0);
  const q = (H: number[], u: number) => {
    const i = H.findIndex((h) => h >= u);
    return GRID[Math.max(0, i)];
  };
  let w2 = 0;
  const NU = 2000;
  for (let j = 0; j < NU; j++) {
    const u = (j + 0.5) / NU;
    w2 += (q(F, u) - q(G, u)) ** 2 / NU;
  }
  let tv = 0;
  for (let i = 1; i < NG; i++)
    tv += Math.abs(F[i] - F[i - 1] - (G[i] - G[i - 1])) / 2;
  return { F, G, w1, w2: Math.sqrt(w2), tv };
}

export function CdfAreaViz() {
  const [k, setK] = useState(0);
  const { F, G, w1, w2, tv } = distances(k);
  const W = 340,
    H = 190,
    XL = 28,
    XR = W - 10,
    Y0 = 10,
    Y1 = H - 24;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const sy = (v: number) => Y1 - v * (Y1 - Y0);
  const path = (V: number[]) =>
    V.map((v, i) => `${i ? "L" : "M"}${sx(GRID[i])},${sy(v)}`).join(" ");
  const area =
    GRID.map((x, i) => `${i ? "L" : "M"}${sx(x)},${sy(F[i])}`).join(" ") +
    GRID.slice()
      .reverse()
      .map((x, i) => `L${sx(x)},${sy(G[NG - 1 - i])}`)
      .join(" ") +
    "Z";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Target distribution"
        >
          {NUS.map((n, j) => (
            <button
              key={n.name}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {n.name}
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
        aria-label="Distribution functions of two measures on the line with the area between them shaded"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        <path d={area} fill="var(--accent)" fillOpacity={0.2} stroke="none" />
        <path d={path(F)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path
          d={path(G)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        {[0, 1, 2, 3].map((x) => (
          <text
            key={x}
            x={sx(x)}
            y={H - 8}
            textAnchor="middle"
            className="viz-label"
          >
            {x}
          </text>
        ))}
        {[0, 1].map((v) => (
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
        W₁ {w1.toFixed(3)}, W₂ {w2.toFixed(3)}, total variation {tv.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Solid: the distribution function of μ, uniform on [0, 1]. Dashed: that
        of ν. On the line, W₁ is the shaded area between the two curves, and W₂
        compares the quantile functions, the same curves read sideways. Shifting
        ν by 2 instead of 0.5 multiplies both Wasserstein distances by 4, while
        the total variation distance, which only sees whether the densities
        overlap, is already at its maximum of 1 for any shift of at least 1.
      </figcaption>
    </figure>
  );
}
