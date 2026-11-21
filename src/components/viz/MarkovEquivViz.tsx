"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// four causal graphs on X, Y, Z, each simulated as a linear Gaussian model with coefficient 0.8 per edge
const GRAPHS = [
  {
    name: "chain X→Y→Z",
    edges: [
      ["X", "Y"],
      ["Y", "Z"],
    ],
  },
  {
    name: "chain Z→Y→X",
    edges: [
      ["Z", "Y"],
      ["Y", "X"],
    ],
  },
  {
    name: "fork X←Y→Z",
    edges: [
      ["Y", "X"],
      ["Y", "Z"],
    ],
  },
  {
    name: "collider X→Y←Z",
    edges: [
      ["X", "Y"],
      ["Z", "Y"],
    ],
  },
];
const POS: Record<string, [number, number]> = {
  X: [40, 60],
  Y: [120, 120],
  Z: [200, 60],
};

const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

const corr = (a: number[], b: number[]) => {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < n; i++) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) ** 2;
    sbb += (b[i] - mb) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
};

/** Sample correlation of X and Z, and their partial correlation given Y, for graph k. */
export function stats(k: number, n = 3000) {
  const r = rand(11 + k);
  const order = ["X", "Y", "Z"].sort((a, b) =>
    GRAPHS[k].edges.some(([p, c]) => p === b && c === a) ? 1 : -1,
  );
  // place every parent before its child
  const sorted: string[] = [];
  while (sorted.length < 3)
    for (const v of order)
      if (
        !sorted.includes(v) &&
        GRAPHS[k].edges.every(([p, c]) => c !== v || sorted.includes(p))
      )
        sorted.push(v);
  const S: Record<string, number[]> = { X: [], Y: [], Z: [] };
  for (let i = 0; i < n; i++) {
    const v: Record<string, number> = {};
    for (const u of sorted)
      v[u] =
        GRAPHS[k].edges
          .filter(([, c]) => c === u)
          .reduce((s, [p]) => s + 0.8 * v[p], 0) + gauss(r);
    for (const u of sorted) S[u].push(v[u]);
  }
  const rxz = corr(S.X, S.Z),
    rxy = corr(S.X, S.Y),
    rzy = corr(S.Z, S.Y);
  const partial =
    (rxz - rxy * rzy) / Math.sqrt((1 - rxy ** 2) * (1 - rzy ** 2));
  return { rxz, partial };
}

export function MarkovEquivViz() {
  const [k, setK] = useState(0);
  const all = GRAPHS.map((_, j) => stats(j));
  const { rxz, partial } = all[k];
  const indep = (v: number) => Math.abs(v) < 0.05;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Causal graph">
          {GRAPHS.map((g, j) => (
            <button
              key={g.name}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 180"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A causal graph on three variables and the correlations it produces in simulated data"
      >
        <defs>
          <marker
            id="mev-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
        </defs>
        {GRAPHS[k].edges.map(([p, c]) => {
          const [x1, y1] = POS[p],
            [x2, y2] = POS[c];
          const d = Math.hypot(x2 - x1, y2 - y1);
          return (
            <line
              key={p + c}
              x1={x1 + ((x2 - x1) * 17) / d}
              y1={y1 + ((y2 - y1) * 17) / d}
              x2={x2 - ((x2 - x1) * 17) / d}
              y2={y2 - ((y2 - y1) * 17) / d}
              stroke="var(--accent)"
              strokeWidth={2}
              markerEnd="url(#mev-arrow)"
            />
          );
        })}
        {Object.entries(POS).map(([v, [x, y]]) => (
          <g key={v}>
            <circle
              cx={x}
              cy={y}
              r={15}
              fill="var(--surface)"
              stroke="var(--text-muted)"
            />
            <text x={x} y={y + 4} textAnchor="middle" className="viz-label">
              {v}
            </text>
          </g>
        ))}
        <text x={236} y={50} className="viz-label">
          corr(X, Z) = {rxz.toFixed(2)}
        </text>
        <text x={236} y={66} className="viz-label">
          {indep(rxz) ? "independent" : "dependent"}
        </text>
        <text x={236} y={96} className="viz-label">
          given Y: {partial.toFixed(2)}
        </text>
        <text x={236} y={112} className="viz-label">
          {indep(partial) ? "independent" : "dependent"}
        </text>
        <text x={10} y={170} className="viz-label">
          same pattern as:{" "}
          {GRAPHS.filter(
            (_, j) =>
              j !== k &&
              indep(all[j].rxz) === indep(rxz) &&
              indep(all[j].partial) === indep(partial),
          )
            .map((g) => g.name)
            .join(", ") || "none"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        3000 samples from each graph, every edge a linear effect of size 0.8
        plus independent noise. Both chains and the fork make X and Z dependent
        but independent given Y, so data alone cannot tell them apart. The
        collider does the opposite: X and Z are independent until Y is held
        fixed.
      </figcaption>
    </figure>
  );
}
