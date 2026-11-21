"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// a random 12 x 12 weight matrix, averaged over the subgroup of cyclic shifts by multiples of m
const N = 12;
const r = rand(11);
const W0 = Array.from({ length: N }, () =>
  Array.from({ length: N }, () => 2 * r() - 1),
);
const STEPS = [12, 6, 3, 2, 1]; // shift step m; the subgroup has 12 / m elements
const TESTS = [1, 2, 3, 6];

/** (1/|H|) sum over shifts s in H of S^{-s} W S^{s}, where S^{s} shifts a signal by s. */
export function average(m: number) {
  const out = Array.from({ length: N }, () => new Array(N).fill(0));
  const ks = Array.from({ length: N / m }, (_, j) => j * m);
  for (const s of ks)
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        out[i][j] += W0[(i + s) % N][(j + s) % N] / ks.length;
  return out;
}

/** Largest entry of W S^t - S^t W, zero exactly when W commutes with the shift by t. */
export function commuteError(W: number[][], t: number) {
  let e = 0;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++)
      e = Math.max(e, Math.abs(W[(i + t) % N][(j + t) % N] - W[i][j]));
  return e;
}

export function GroupAverageViz() {
  const [k, setK] = useState(0);
  const W = average(STEPS[k]);
  const big = Math.max(...W0.flat().map(Math.abs));
  const c = 13;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Averaging group">
          {STEPS.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {m === 12 ? "none" : m === 1 ? "all 12 shifts" : `shifts by ${m}`}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 176"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A twelve by twelve weight matrix after averaging over a group of cyclic shifts"
      >
        {W.map((row, i) =>
          row.map((v, j) => (
            <rect
              key={`${i}-${j}`}
              x={10 + j * c}
              y={10 + i * c}
              width={c - 1}
              height={c - 1}
              fill={v >= 0 ? "var(--accent)" : "var(--danger)"}
              fillOpacity={Math.min(1, Math.abs(v) / big) * 0.9 + 0.05}
            />
          )),
        )}
        <text x={180} y={24} className="viz-label">
          commutes with shift by
        </text>
        {TESTS.map((t, n) => {
          const e = commuteError(W, t);
          return (
            <text
              key={t}
              x={180}
              y={50 + n * 26}
              className="viz-label"
              fill={e < 1e-9 ? "var(--success)" : "var(--text-muted)"}
            >
              {t}: {e < 1e-9 ? "yes" : `no (error ${e.toFixed(2)})`}
            </text>
          );
        })}
      </svg>
      <figcaption className="viz-caption">
        A random linear map on signals of length 12 (positive entries in the
        accent colour, negative in red). Averaging it over a group of cyclic
        shifts, conjugating by each shift and taking the mean, makes it commute
        with every shift in that group and with no others. Averaging over all 12
        shifts gives a circulant matrix, constant along wrapped diagonals: a
        convolution.
      </figcaption>
    </figure>
  );
}
