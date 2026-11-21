"use client";

import { useState } from "react";

// five tokens A..E with fixed 2-d embeddings; attention scores q.k with q = k = embedding (scaled), plus a position term
const EMB = [
  [1.2, 0.2],
  [0.1, 1.0],
  [-0.8, 0.4],
  [0.3, -1.1],
  [-0.5, -0.6],
];
const NAMES = ["A", "B", "C", "D", "E"];
const ORDERS = [
  { name: "original", order: [0, 1, 2, 3, 4] },
  { name: "cyclic shift", order: [3, 4, 0, 1, 2] },
  { name: "shuffle", order: [2, 0, 4, 1, 3] },
];
const SCHEMES = ["no positions", "absolute", "relative (cyclic)"];
const N = 5;
const ABS = [0.9, -0.4, 0.2, -0.9, 0.5];
const REL = [0.6, 1.1, -0.7, -0.3, 0.8];

/** Attention weights indexed by token identity (row token attends to column token) for a given order and scheme. */
export function weights(order: number[], scheme: number) {
  const n = order.length;
  const S = order.map((a, i) =>
    order.map((b, j) => {
      let s = 1.5 * (EMB[a][0] * EMB[b][0] + EMB[a][1] * EMB[b][1]);
      if (scheme === 1) s += ABS[i] * 2 * ABS[j];
      if (scheme === 2) s += REL[(j - i + n) % n];
      return s;
    }),
  );
  const P = S.map((row) => {
    const m = Math.max(...row);
    const e = row.map((v) => Math.exp(v - m));
    const z = e.reduce((x, y) => x + y, 0);
    return e.map((v) => v / z);
  });
  const W = Array.from({ length: n }, () => new Array(n).fill(0));
  order.forEach((a, i) => order.forEach((b, j) => (W[a][b] = P[i][j])));
  return W;
}

export function AttentionSymmetryViz() {
  const [o, setO] = useState(2);
  const [s, setS] = useState(0);
  const W = weights(ORDERS[o].order, s);
  const W0 = weights(ORDERS[0].order, s);
  const gap = Math.max(
    ...W.flatMap((row, i) => row.map((v, j) => Math.abs(v - W0[i][j]))),
  );
  const c = 24;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Positional scheme">
          {SCHEMES.map((x, j) => (
            <button
              key={x}
              type="button"
              className="seg"
              aria-pressed={s === j}
              onClick={() => setS(j)}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Token order">
          {ORDERS.map((x, j) => (
            <button
              key={x.name}
              type="button"
              className="seg"
              aria-pressed={o === j}
              onClick={() => setO(j)}
            >
              {x.name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 170"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Attention weights between five tokens, indexed by token, for a chosen order and positional scheme"
      >
        <text x={10} y={16} className="viz-label">
          sequence: {ORDERS[o].order.map((a) => NAMES[a]).join(" ")}
        </text>
        {NAMES.map((nm, j) => (
          <text
            key={`c${j}`}
            x={60 + j * c + c / 2}
            y={40}
            textAnchor="middle"
            className="viz-label"
          >
            {nm}
          </text>
        ))}
        {W.map((row, i) => (
          <g key={i}>
            <text
              x={50}
              y={48 + i * c + c / 2 + 4}
              textAnchor="end"
              className="viz-label"
            >
              {NAMES[i]}
            </text>
            {row.map((v, j) => (
              <rect
                key={j}
                x={60 + j * c}
                y={48 + i * c}
                width={c - 1}
                height={c - 1}
                fill="var(--accent)"
                fillOpacity={0.08 + 0.92 * v}
              />
            ))}
          </g>
        ))}
        <text x={200} y={70} className="viz-label">
          largest change from the
        </text>
        <text x={200} y={86} className="viz-label">
          original order: {gap.toFixed(3)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        Attention weights of five tokens, with rows and columns labelled by
        token rather than by position. Without positional information the
        weights between tokens do not depend on the order at all: attention is
        permutation equivariant. Absolute positional terms break this for every
        reordering. A bias that depends only on the cyclic offset between
        positions survives cyclic shifts but not shuffles.
      </figcaption>
    </figure>
  );
}
