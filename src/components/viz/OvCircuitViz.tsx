"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const V = 12;

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) * Math.cos(2 * Math.PI * r());
}

/** V by r matrix with orthonormal columns, by Gram-Schmidt on Gaussian columns. */
function orthonormal(r: number, seed: number) {
  const g = rand(seed);
  const cols: number[][] = [];
  while (cols.length < r) {
    let v = Array.from({ length: V }, () => gauss(g));
    for (const c of cols) { const d = v.reduce((s, x, i) => s + x * c[i], 0); v = v.map((x, i) => x - d * c[i]); }
    const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    cols.push(v.map((x) => x / n));
  }
  return cols;
}

/**
 * A full OV circuit on a vocabulary of twelve tokens, with a head of dimension r: entry (i, j) is how much attending to token i raises
 * the logit of token j. The head projects onto an r-dimensional subspace, then copies, suppresses or shifts to the next token.
 */
export function ovCircuit(kind: "copy" | "suppress" | "successor", r: number, seed = 4) {
  const cols = orthonormal(r, seed);
  const P = Array.from({ length: V }, (_, i) => Array.from({ length: V }, (_, j) => cols.reduce((s, c) => s + c[i] * c[j], 0)));
  const sign = kind === "suppress" ? -1 : 1;
  const M = Array.from({ length: V }, (_, i) => Array.from({ length: V }, (_, j) => sign * 3 * (kind === "successor" ? P[i][(j + V - 1) % V] : P[i][j])));
  const target = (i: number) => (kind === "successor" ? (i + 1) % V : i);
  const hits = M.filter((row, i) => (sign > 0 ? row.indexOf(Math.max(...row)) : row.indexOf(Math.min(...row))) === target(i)).length;
  return { M, hits };
}

const KINDS: { key: "copy" | "suppress" | "successor"; name: string }[] = [
  { key: "copy", name: "copying" },
  { key: "suppress", name: "suppression" },
  { key: "successor", name: "successor" },
];
const RANKS = [2, 4, 12];

export function OvCircuitViz() {
  const [k, setK] = useState(0);
  const [r, setR] = useState(1);
  const { M, hits } = useMemo(() => ovCircuit(KINDS[k].key, RANKS[r]), [k, r]);
  const S = 15, X0 = 14, Y0 = 6, W = X0 + V * S + 100, H = Y0 + V * S + 34;
  const big = Math.max(...M.flat().map(Math.abs));
  const col = (v: number) => {
    const t = Math.min(1, Math.abs(v) / big);
    return { fill: v >= 0 ? "var(--accent)" : "var(--danger)", opacity: t };
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="What the head does">
          {KINDS.map((x, i) => <button key={x.key} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{x.name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Head dimension">
          {RANKS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={r === i} onClick={() => setR(i)}>head dim {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Heat map of the full OV circuit">
        <rect x={X0} y={Y0} width={V * S} height={V * S} style={{ fill: "var(--bg-subtle)" }} />
        {M.map((row, i) => row.map((v, j) => {
          const c = col(v);
          return <rect key={`${i}-${j}`} x={X0 + j * S} y={Y0 + i * S} width={S - 1} height={S - 1} style={{ fill: c.fill }} opacity={c.opacity} />;
        }))}
        <text x={X0 + (V * S) / 2} y={Y0 + V * S + 14} textAnchor="middle" className="viz-label">rows: attended token</text>
        <text x={X0 + (V * S) / 2} y={Y0 + V * S + 27} textAnchor="middle" className="viz-label">columns: output logit</text>
        <g>
          <rect x={X0 + V * S + 14} y={Y0 + 10} width={12} height={12} style={{ fill: "var(--accent)" }} />
          <text x={X0 + V * S + 30} y={Y0 + 20} className="viz-label">raises</text>
          <rect x={X0 + V * S + 14} y={Y0 + 30} width={12} height={12} style={{ fill: "var(--danger)" }} />
          <text x={X0 + V * S + 30} y={Y0 + 40} className="viz-label">lowers</text>
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        tokens whose strongest effect is on the intended logit: {hits} of {V}
      </div>
      <figcaption className="viz-caption">
        The full OV circuit of a head says, for each token the head attends to, how much it raises or lowers each output logit. A
        copying head has a strong positive diagonal; a suppression head a negative one; a successor head shifts by one. The head works
        through a subspace of the head&apos;s dimension, so with a small head the pattern blurs and some tokens are copied poorly. Shading is relative to the largest entry.
      </figcaption>
    </figure>
  );
}
