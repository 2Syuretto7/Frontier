"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// true DAG A -> C <- B, C -> D -> E, linear Gaussian with coefficient 0.6
const V = ["A", "B", "C", "D", "E"];
const TRUE: [number, number][] = [
  [0, 2],
  [1, 2],
  [2, 3],
  [3, 4],
];
const POS: [number, number][] = [
  [50, 40],
  [50, 140],
  [140, 90],
  [230, 90],
  [310, 90],
];
const NS = [30, 100, 1000];

const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

function inv(A: number[][]) {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...r.map((_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++)
      if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    const d = M[i][i];
    for (let j = 0; j < 2 * n; j++) M[i][j] /= d;
    for (let k = 0; k < n; k++)
      if (k !== i) {
        const f = M[k][i];
        for (let j = 0; j < 2 * n; j++) M[k][j] -= f * M[i][j];
      }
  }
  return M.map((r) => r.slice(n));
}

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/** Run PC with Fisher-z tests at level 0.05 on n samples; returns adjacency and arrows. */
export function runPc(n: number, seed: number) {
  const r = rand(seed);
  const X: number[][] = [];
  for (let s = 0; s < n; s++) {
    const a = gauss(r),
      b = gauss(r);
    const c = 0.6 * a + 0.6 * b + gauss(r);
    const d = 0.6 * c + gauss(r);
    X.push([a, b, c, d, 0.6 * d + gauss(r)]);
  }
  const mean = V.map((_, j) => X.reduce((s, x) => s + x[j], 0) / n);
  const C = V.map((_, i) =>
    V.map(
      (_, j) =>
        X.reduce((s, x) => s + (x[i] - mean[i]) * (x[j] - mean[j]), 0) /
        (n - 1),
    ),
  );
  const indep = (i: number, j: number, S: number[]) => {
    const idx = [i, j, ...S];
    const P = inv(idx.map((a) => idx.map((b) => C[a][b])));
    const pr = -P[0][1] / Math.sqrt(P[0][0] * P[1][1]);
    const z = Math.sqrt(n - S.length - 3) * Math.atanh(pr);
    return 1 - erf(Math.abs(z) / Math.SQRT2) > 0.05;
  };
  const adj = V.map(
    (_, i) => new Set(V.map((_, j) => j).filter((j) => j !== i)),
  );
  const sep: Record<string, number[]> = {};
  const subsets = (arr: number[], k: number): number[][] =>
    k === 0
      ? [[]]
      : arr.flatMap((v, i) =>
          subsets(arr.slice(i + 1), k - 1).map((s) => [v, ...s]),
        );
  for (let k = 0; k < 4; k++)
    for (let a = 0; a < 5; a++)
      for (const b of [...adj[a]]) {
        if (!adj[a].has(b)) continue;
        for (const S of subsets(
          [...adj[a]].filter((v) => v !== b),
          k,
        ))
          if (indep(a, b, S)) {
            adj[a].delete(b);
            adj[b].delete(a);
            sep[[a, b].sort().join()] = S;
            break;
          }
      }
  const arrows = new Set<string>();
  for (let c = 0; c < 5; c++)
    for (const a of adj[c])
      for (const b of adj[c])
        if (
          a < b &&
          !adj[a].has(b) &&
          !(sep[[a, b].sort().join()] ?? []).includes(c)
        ) {
          arrows.add(`${a}>${c}`);
          arrows.add(`${b}>${c}`);
        }
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of [...arrows]) {
      const [a, b] = e.split(">").map(Number);
      for (const c of adj[b])
        if (
          c !== a &&
          !adj[a].has(c) &&
          !arrows.has(`${b}>${c}`) &&
          !arrows.has(`${c}>${b}`)
        ) {
          arrows.add(`${b}>${c}`);
          changed = true;
        }
    }
  }
  return { adj, arrows };
}

export function PcDiscoveryViz() {
  const [k, setK] = useState(2);
  const [seed, setSeed] = useState(3);
  const { adj, arrows } = runPc(NS[k], seed);
  const isTrue = (a: number, b: number) =>
    TRUE.some(([p, c]) => p === a && c === b);
  const pairs: [number, number][] = [];
  for (let a = 0; a < 5; a++)
    for (let b = a + 1; b < 5; b++) pairs.push([a, b]);
  let right = 0,
    wrong = 0;
  const draw = pairs.flatMap(([a, b]) => {
    const found = adj[a].has(b);
    const truth = isTrue(a, b) || isTrue(b, a);
    if (!found && !truth) return [];
    const dir = arrows.has(`${a}>${b}`)
      ? [a, b]
      : arrows.has(`${b}>${a}`)
        ? [b, a]
        : null;
    const ok = found && truth && dir !== null && isTrue(dir[0], dir[1]);
    if (ok) right++;
    else wrong++;
    const [p, c] = dir ?? [a, b];
    const [x1, y1] = POS[p],
      [x2, y2] = POS[c];
    const d = Math.hypot(x2 - x1, y2 - y1);
    return [
      <line
        key={`${a}-${b}`}
        x1={x1 + ((x2 - x1) * 15) / d}
        y1={y1 + ((y2 - y1) * 15) / d}
        x2={x2 - ((x2 - x1) * 15) / d}
        y2={y2 - ((y2 - y1) * 15) / d}
        stroke={
          !found
            ? "var(--border-strong)"
            : ok
              ? "var(--accent)"
              : "var(--danger)"
        }
        strokeWidth={found ? 2 : 1}
        strokeDasharray={found ? undefined : "4 3"}
        markerEnd={
          found && dir ? (ok ? "url(#pcv-a)" : "url(#pcv-d)") : undefined
        }
      />,
    ];
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Sample size">
          {NS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              n = {v}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
          new sample
        </button>
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
        aria-label="The graph recovered by the PC algorithm from simulated data, compared with the true graph"
      >
        <defs>
          {[
            ["pcv-a", "var(--accent)"],
            ["pcv-d", "var(--danger)"],
          ].map(([id, col]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={col} />
            </marker>
          ))}
        </defs>
        {draw}
        {V.map((v, i) => (
          <g key={v}>
            <circle
              cx={POS[i][0]}
              cy={POS[i][1]}
              r={13}
              fill="var(--surface)"
              stroke="var(--text-muted)"
            />
            <text
              x={POS[i][0]}
              y={POS[i][1] + 4}
              textAnchor="middle"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <text x={10} y={176} className="viz-label">
          true graph: A → C ← B, C → D → E
        </text>
        <text x={10} y={190} className="viz-label">
          edges right {right} of 4, errors {wrong}
        </text>
      </svg>
      <figcaption className="viz-caption">
        The PC algorithm removes an edge as soon as some test finds the two
        variables independent given a set of neighbours, then orients the
        collider at C and propagates. Colour: an edge found with the right
        direction. Red: a wrong, extra or unoriented edge. Dashed: a true edge
        that was missed. Small samples miss weak dependencies, and one wrong
        test can flip arrows elsewhere.
      </figcaption>
    </figure>
  );
}
