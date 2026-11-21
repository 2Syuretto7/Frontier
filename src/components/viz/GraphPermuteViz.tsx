"use client";

import { useState } from "react";

// a fixed graph on 6 physical nodes; a relabelling perm gives node p the label perm[p]
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 5],
  [3, 5],
];
const FEAT = [1, 0.5, 2, 0, 1.5, 1];
const PERMS = [
  [0, 1, 2, 3, 4, 5],
  [3, 5, 0, 2, 1, 4],
  [5, 4, 3, 2, 1, 0],
  [1, 3, 5, 0, 2, 4],
];

/** Adjacency matrix and features in the labelling perm, and one message-passing layer relu(x - 0.5 + 0.5 * sum of neighbours). */
export function labelled(perm: number[]) {
  const n = perm.length;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  EDGES.forEach(([a, b]) => {
    A[perm[a]][perm[b]] = 1;
    A[perm[b]][perm[a]] = 1;
  });
  const x = new Array(n).fill(0);
  FEAT.forEach((v, p) => (x[perm[p]] = v));
  const y = x.map((v, i) =>
    Math.max(0, v - 0.5 + 0.5 * A[i].reduce((s, a, j) => s + a * x[j], 0)),
  );
  return { A, x, y };
}

export function GraphPermuteViz() {
  const [k, setK] = useState(0);
  const perm = PERMS[k];
  const { A, x, y } = labelled(perm);
  const pos = [
    [60, 50],
    [30, 110],
    [95, 95],
    [150, 90],
    [175, 150],
    [120, 160],
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Node numbering">
          {PERMS.map((_, j) => (
            <button
              key={j}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              numbering {j + 1}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 220"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A graph with numbered nodes, its adjacency matrix in that numbering, and the outputs of a message-passing layer"
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={pos[a][0]}
            y1={pos[a][1]}
            x2={pos[b][0]}
            y2={pos[b][1]}
            stroke="var(--border-strong)"
          />
        ))}
        {pos.map(([cx, cy], p) => (
          <g key={p}>
            <circle
              cx={cx}
              cy={cy}
              r={13}
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth={1.5}
            />
            <text x={cx} y={cy + 4} textAnchor="middle" className="viz-label">
              {perm[p] + 1}
            </text>
            <text
              x={cx}
              y={cy - 17}
              textAnchor="middle"
              className="viz-label"
              fill="var(--danger)"
            >
              {y[perm[p]].toFixed(2)}
            </text>
          </g>
        ))}
        <text x={222} y={14} className="viz-label">
          A in this numbering
        </text>
        {A.map((row, i) =>
          row.map((v, j) => (
            <rect
              key={`${i}-${j}`}
              x={222 + j * 16}
              y={22 + i * 16}
              width={15}
              height={15}
              fill={v ? "var(--accent)" : "var(--surface)"}
              stroke="var(--grid-line)"
            />
          )),
        )}
        <text x={10} y={196} className="viz-label">
          input x by number: {x.map((v) => v).join(", ")}
        </text>
        <text x={10} y={212} className="viz-label">
          output y by number: {y.map((v) => v.toFixed(1)).join(", ")}
        </text>
        <text x={222} y={136} className="viz-label">
          sum of y: {y.reduce((s, v) => s + v, 0).toFixed(2)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        The same graph under four numberings of its nodes. The adjacency matrix
        and the feature list x change with the numbering, and so does the output
        list y of a message-passing layer, but only by the same reordering: the
        output written next to each node (red) never changes. Summing the
        outputs gives a number that ignores the numbering altogether.
      </figcaption>
    </figure>
  );
}
