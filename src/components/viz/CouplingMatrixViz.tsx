"use client";

import { useState } from "react";

// source histogram a on points 0..4, target histogram b on points 0..5
const A = [0.1, 0.3, 0.25, 0.2, 0.15];
const B = [0.25, 0.05, 0.1, 0.15, 0.2, 0.25];
const XA = A.map((_, i) => i);
const XB = B.map((_, j) => j);

/** Greedy fill from one corner: rows in order, columns in the given order. */
export function corner(a: number[], b: number[], cols: number[]) {
  const P = a.map(() => b.map(() => 0));
  const r = a.slice(),
    c = b.slice();
  let i = 0,
    k = 0;
  while (i < a.length && k < cols.length) {
    const j = cols[k],
      m = Math.min(r[i], c[j]);
    P[i][j] = m;
    r[i] -= m;
    c[j] -= m;
    if (r[i] <= 1e-12) i++;
    else k++;
  }
  return P;
}

const MODES = ["independent", "monotone", "anti-monotone"] as const;

export function coupling(mode: number) {
  if (mode === 0) return A.map((ai) => B.map((bj) => ai * bj));
  const cols = XB.map((_, j) => j);
  return corner(A, B, mode === 1 ? cols : cols.reverse());
}

export function sqCost(P: number[][]) {
  return P.reduce(
    (s, row, i) => s + row.reduce((t, p, j) => t + p * (XA[i] - XB[j]) ** 2, 0),
    0,
  );
}

export function CouplingMatrixViz() {
  const [mode, setMode] = useState(1);
  const P = coupling(mode);
  const cell = 34,
    X0 = 70,
    Y0 = 64,
    W = X0 + cell * B.length + 10,
    H = Y0 + cell * A.length + 10,
    pmax = 0.3;
  const nz = P.flat().filter((p) => p > 1e-12).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Coupling">
          {MODES.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={mode === j}
              onClick={() => setMode(j)}
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
          maxWidth: 420,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Coupling matrix with the source histogram on the left and the target histogram on top"
      >
        {B.map((bj, j) => (
          <rect
            key={j}
            x={X0 + j * cell + 4}
            y={Y0 - 6 - (bj / pmax) * 48}
            width={cell - 8}
            height={(bj / pmax) * 48}
            fill="var(--danger)"
            fillOpacity={0.6}
          />
        ))}
        {A.map((ai, i) => (
          <rect
            key={i}
            x={X0 - 6 - (ai / pmax) * 56}
            y={Y0 + i * cell + 4}
            width={(ai / pmax) * 56}
            height={cell - 8}
            fill="var(--accent)"
            fillOpacity={0.6}
          />
        ))}
        {P.map((row, i) =>
          row.map((p, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={X0 + j * cell}
                y={Y0 + i * cell}
                width={cell}
                height={cell}
                fill="var(--accent)"
                fillOpacity={Math.min(1, p / 0.25)}
                stroke="var(--border)"
              />
              {p > 1e-12 && (
                <text
                  x={X0 + j * cell + cell / 2}
                  y={Y0 + i * cell + cell / 2 + 4}
                  textAnchor="middle"
                  className="viz-label"
                  style={{ fontSize: 9 }}
                >
                  {p.toFixed(2).replace(/^0/, "")}
                </text>
              )}
            </g>
          )),
        )}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        squared-distance cost {sqCost(P).toFixed(3)}, nonzero entries {nz}
      </div>
      <figcaption className="viz-caption">
        A coupling is a table of how much mass moves from each source point
        (rows, histogram at left) to each target point (columns, histogram on
        top); its rows sum to the source and its columns to the target. The
        independent coupling spreads every row across every column. The monotone
        coupling fills the table from the top-left corner, sending low to low;
        it is a vertex of the set of couplings, with at most 5 + 6 − 1 nonzero
        entries, and on a line it is optimal for the squared distance. Filling
        from the top-right corner gives the most expensive vertex.
      </figcaption>
    </figure>
  );
}
