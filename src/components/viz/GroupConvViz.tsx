"use client";

import { useState } from "react";

// an 11 x 11 image (zero outside), a 3 x 3 corner filter; lifting correlation with the 4 rotated filters, about the centre
const N = 11;
const BASE: number[][] = Array.from({ length: N }, (_, i) =>
  Array.from({ length: N }, (_, j) =>
    (i === 2 && j >= 2 && j <= 7) ||
    (j === 2 && i >= 2 && i <= 6) ||
    (i === 7 && j >= 5 && j <= 8)
      ? 1
      : 0,
  ),
);
const PSI = [
  [-1, -1, -1],
  [-1, 2, 1],
  [-1, 1, -1],
];
const rotA = (a: number[][]) => {
  const n = a.length;
  return a.map((_, i) => a.map((__, j) => a[j][n - 1 - i]));
};
const rotK = (a: number[][], k: number) => {
  let x = a;
  for (let r = 0; r < k; r++) x = rotA(x);
  return x;
};

/** Correlation with the filter rotated r quarter turns, for r = 0..3, then ReLU with bias -2. */
export function lifted(img: number[][]) {
  return [0, 1, 2, 3].map((r) => {
    const p = rotK(PSI, r);
    return img.map((row, i) =>
      row.map((_, j) => {
        let s = 0;
        for (let a = -1; a <= 1; a++)
          for (let b = -1; b <= 1; b++) {
            const y = i + a,
              x = j + b;
            if (y >= 0 && y < N && x >= 0 && x < N)
              s += p[a + 1][b + 1] * img[y][x];
          }
        return Math.max(0, s - 2);
      }),
    );
  });
}

export function GroupConvViz() {
  const [k, setK] = useState(0);
  const img = rotK(BASE, k);
  const maps = lifted(img);
  const pooled = img.map((row, i) =>
    row.map((_, j) => Math.max(...maps.map((m) => m[i][j]))),
  );
  const big = 2;
  const panel = (
    a: number[][],
    ox: number,
    oy: number,
    c: number,
    col: string,
    top: number,
  ) =>
    a.flatMap((row, i) =>
      row.map((v, j) => (
        <rect
          key={`${ox}-${i}-${j}`}
          x={ox + j * c}
          y={oy + i * c}
          width={c - 0.4}
          height={c - 0.4}
          fill={v > 0 ? col : "var(--surface)"}
          fillOpacity={v > 0 ? Math.min(1, v / top) * 0.85 + 0.15 : 1}
          stroke="var(--grid-line)"
          strokeWidth={0.3}
        />
      )),
    );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Rotate input">
          {[0, 1, 2, 3].map((r) => (
            <button
              key={r}
              type="button"
              className="seg"
              aria-pressed={k === r}
              onClick={() => setK(r)}
            >
              {r * 90}°
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 210"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="An input image, its four orientation channels after a lifting convolution, and the map pooled over orientations"
      >
        <text x={10} y={12} className="viz-label">
          input
        </text>
        {panel(img, 10, 18, 7, "var(--text)", 1)}
        <text x={10} y={112} className="viz-label">
          max over r
        </text>
        {panel(pooled, 10, 118, 7, "var(--danger)", big)}
        {maps.map((m, r) => (
          <g key={r}>
            <text
              x={110 + (r % 2) * 115}
              y={12 + Math.floor(r / 2) * 100}
              className="viz-label"
            >
              filter turned {r * 90}°
            </text>
            {panel(
              m,
              110 + (r % 2) * 115,
              18 + Math.floor(r / 2) * 100,
              7,
              "var(--accent)",
              big,
            )}
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption">
        A lifting layer correlates the input with four rotated copies of one
        corner-detecting filter, producing a feature map for each orientation:
        each map responds to corners and line ends facing one way. Rotate the
        input: every map rotates, and the maps also trade places, each
        orientation channel moving to the next. The maximum over orientations
        rotates with the input and does not change otherwise.
      </figcaption>
    </figure>
  );
}
