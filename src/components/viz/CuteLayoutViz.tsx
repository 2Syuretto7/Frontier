"use client";

import { useState } from "react";

const N = 8;

export const LAYOUTS = [
  { name: "row-major", note: "shape (8, 8), stride (8, 1)", f: (r: number, c: number) => r * 8 + c },
  { name: "column-major", note: "shape (8, 8), stride (1, 8)", f: (r: number, c: number) => r + 8 * c },
  { name: "4×4 tiles", note: "shape ((4, 2), (4, 2)), stride ((4, 32), (1, 16))", f: (r: number, c: number) => (Math.floor(r / 4) * 2 + Math.floor(c / 4)) * 16 + (r % 4) * 4 + (c % 4) },
  { name: "swizzled", note: "row-major, then column XOR row", f: (r: number, c: number) => r * 8 + (c ^ r) },
];

/** The offset of every (row, column) of an 8 by 8 tile under one of four layouts. */
export function layoutGrid(k: number) {
  return Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => LAYOUTS[k].f(r, c)));
}

export function CuteLayoutViz() {
  const [k, setK] = useState(0);
  const [hl, setHl] = useState(0);
  const g = layoutGrid(k);
  const CELL = 30, X0 = 4, Y0 = 4, W = X0 * 2 + N * CELL;
  const lo = hl * 8;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Layout">
          {LAYOUTS.map((l, i) => <button key={l.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{l.name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Which run of eight consecutive offsets to highlight">
          {[0, 1, 2].map((i) => <button key={i} type="button" className="seg" aria-pressed={hl === i} onClick={() => setHl(i)}>offsets {i * 8} to {i * 8 + 7}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }} role="img" aria-label="Memory offset of each element of an 8 by 8 tile">
        {g.map((row, r) => row.map((o, c) => {
          const on = o >= lo && o < lo + 8;
          return (
            <g key={`${r}-${c}`}>
              <rect x={X0 + c * CELL} y={Y0 + r * CELL} width={CELL - 1} height={CELL - 1} style={{ fill: on ? "var(--accent)" : "var(--bg-subtle)", stroke: "var(--border)" }} />
              <text x={X0 + c * CELL + (CELL - 1) / 2} y={Y0 + r * CELL + CELL / 2 + 4} textAnchor="middle" className="viz-label" style={{ fill: on ? "var(--bg)" : undefined }}>{o}</text>
            </g>
          );
        }))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LAYOUTS[k].name}: {LAYOUTS[k].note}
      </div>
      <figcaption className="viz-caption">
        A layout is a function from a coordinate in a tile to an offset in memory; each cell shows the offset of its element. The same
        logical 8 by 8 tile can be stored row by row, column by column, as four contiguous 4 by 4 blocks, or with each row&apos;s columns
        permuted by XOR so that a column is spread over different banks. CUTLASS writes kernels against such functions instead of
        hard-coded index arithmetic.
      </figcaption>
    </figure>
  );
}
