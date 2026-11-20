"use client";

import { useState } from "react";

const P = 4;
const vec = (r: number) => Array.from({ length: P }, (_, i) => r * P + i + 1);
const colSum = (i: number) => Array.from({ length: P }, (_, r) => vec(r)[i]).reduce((a, b) => a + b, 0);

type Grid = (number | null)[][];
const OPS: { name: string; before: () => Grid; after: () => Grid; reduced: boolean; factor: number }[] = [
  {
    name: "all-gather",
    before: () => Array.from({ length: P }, (_, r) => vec(r).map((x, i) => (i === r ? x : null))),
    after: () => Array.from({ length: P }, () => Array.from({ length: P }, (_, i) => vec(i)[i])),
    reduced: false, factor: 1,
  },
  {
    name: "reduce-scatter",
    before: () => Array.from({ length: P }, (_, r) => vec(r)),
    after: () => Array.from({ length: P }, (_, r) => Array.from({ length: P }, (_, i) => (i === r ? colSum(i) : null))),
    reduced: true, factor: 1,
  },
  {
    name: "all-reduce",
    before: () => Array.from({ length: P }, (_, r) => vec(r)),
    after: () => Array.from({ length: P }, () => Array.from({ length: P }, (_, i) => colSum(i))),
    reduced: true, factor: 2,
  },
];

export const collectiveGrids = (k: number) => ({ before: OPS[k].before(), after: OPS[k].after() });

function GridSvg({ g, x0, title, reduced }: { g: Grid; x0: number; title: string; reduced: boolean }) {
  const cs = 30;
  return (
    <g>
      <text x={x0 + (cs * P) / 2} y={12} textAnchor="middle" className="viz-label">{title}</text>
      {g.map((row, r) => row.map((v, i) => (
        <g key={`${r}-${i}`}>
          <rect x={x0 + i * cs} y={20 + r * cs} width={cs - 3} height={cs - 3} rx={3} fill={v === null ? "none" : reduced ? "var(--success-soft)" : "var(--accent-soft)"} stroke="var(--border-strong)" />
          {v !== null && <text x={x0 + i * cs + (cs - 3) / 2} y={20 + r * cs + 18} textAnchor="middle" className="viz-label" style={{ fill: "var(--text)" }}>{v}</text>}
        </g>
      )))}
    </g>
  );
}

export function CollectiveOpsViz() {
  const [k, setK] = useState(2);
  const op = OPS[k], { before, after } = collectiveGrids(k);
  const W = 330, H = 150;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">collective</span>
        <div className="segmented" role="group" aria-label="Collective operation">
          {OPS.map((o, i) => <button key={o.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{o.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Each rank's buffer before and after the collective">
        {Array.from({ length: P }, (_, r) => <text key={r} x={2} y={20 + r * 30 + 18} className="viz-label">{`rank ${r}`}</text>)}
        <GridSvg g={before} x0={48} title="before" reduced={false} />
        <text x={48 + 120 + 10} y={20 + 2 * 30 + 4} textAnchor="middle" className="viz-label">→</text>
        <GridSvg g={after} x0={48 + 120 + 22} title="after" reduced={op.reduced} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`each rank must send at least ${op.factor === 2 ? "2" : ""}(p − 1)/p · n = ${(op.factor * (P - 1)) / P * P} elements, with n = p = ${P}`}
      </div>
      <figcaption className="viz-caption">
        Four ranks, each with a buffer of four elements, one chunk per rank. All-gather starts with one chunk on each rank and
        ends with every rank holding all of them. Reduce-scatter starts with a full vector on every rank and ends with rank i
        holding the sum of chunk i (green). All-reduce leaves the full sum on every rank, and is exactly a reduce-scatter
        followed by an all-gather, so a bandwidth-optimal all-reduce sends twice what either half sends.
      </figcaption>
    </figure>
  );
}
