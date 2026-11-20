"use client";

import { useState } from "react";

const H = 10, Wd = 13;
const SHAPES: [number, number][] = [[4, 4], [2, 8], [8, 2]];

/**
 * Covers an image of H rows and Wd columns with a two-dimensional grid of blocks of bh rows and bw columns. Returns the grid shape,
 * the number of launched and idle threads, and the pixels touched by the first eight threads of block (0, 0) in launch order
 * (threadIdx.x fastest), when threadIdx.x indexes columns (xIsCol) or rows.
 */
export function threadMapping(bh: number, bw: number, xIsCol: boolean) {
  // With x on rows the block's x extent covers rows, so swap the block's shape in pixel space.
  const [ph, pw] = xIsCol ? [bh, bw] : [bw, bh];
  const gy = Math.ceil(H / ph), gx = Math.ceil(Wd / pw);
  const launched = gy * gx * bh * bw;
  const first: [number, number][] = [];
  for (let k = 0; k < 8; k++) {
    const tx = k % bw, ty = Math.floor(k / bw);
    first.push(xIsCol ? [ty, tx] : [tx, ty]);
  }
  const addrs = first.map(([r, c]) => r * Wd + c);
  return { ph, pw, gy, gx, launched, idle: launched - H * Wd, first, addrs };
}

export function ThreadMappingViz() {
  const [s, setS] = useState(1);
  const [m, setM] = useState(0);
  const [bh, bw] = SHAPES[s];
  const res = threadMapping(bh, bw, m === 0);
  const CELL = 20, X0 = 6, Y0 = 6;
  const W = X0 * 2 + res.gx * res.pw * CELL, Ht = Y0 * 2 + res.gy * res.ph * CELL;
  const firstSet = new Set(res.first.map(([r, c]) => `${r},${c}`));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Block shape, rows by columns of threads">
          {SHAPES.map(([a, b], i) => <button key={i} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>block {a}&#215;{b}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Which image dimension threadIdx.x indexes">
          {["x indexes columns", "x indexes rows"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Ht}`} style={{ width: "100%", maxWidth: Math.min(480, W * 1.6), display: "block", margin: "0 auto" }} role="img" aria-label="An image covered by a grid of thread blocks">
        {Array.from({ length: res.gy * res.ph }, (_, r) =>
          Array.from({ length: res.gx * res.pw }, (_, c) => {
            const inside = r < H && c < Wd;
            const blk = Math.floor(r / res.ph) + Math.floor(c / res.pw);
            const x = X0 + c * CELL, y = Y0 + r * CELL;
            return (
              <g key={`${r}-${c}`}>
                <rect x={x + 0.5} y={y + 0.5} width={CELL - 1} height={CELL - 1}
                  style={{ fill: inside ? (blk % 2 ? "var(--bg-subtle)" : "var(--surface)") : "none", stroke: inside ? "var(--border)" : "var(--text-faint)" }}
                  strokeDasharray={inside ? undefined : "2 2"} />
                {firstSet.has(`${r},${c}`) && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={5} style={{ fill: "var(--accent)" }} />}
              </g>
            );
          }),
        )}
        {Array.from({ length: res.gy + 1 }, (_, i) => <line key={`h${i}`} x1={X0} x2={X0 + res.gx * res.pw * CELL} y1={Y0 + i * res.ph * CELL} y2={Y0 + i * res.ph * CELL} stroke="var(--text-muted)" strokeWidth={1.5} />)}
        {Array.from({ length: res.gx + 1 }, (_, i) => <line key={`v${i}`} y1={Y0} y2={Y0 + res.gy * res.ph * CELL} x1={X0 + i * res.pw * CELL} x2={X0 + i * res.pw * CELL} stroke="var(--text-muted)" strokeWidth={1.5} />)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        grid {res.gy}&#215;{res.gx} blocks, {res.launched} threads for {H * Wd} pixels ({res.idle} idle); first 8 threads read offsets {res.addrs.join(", ")}
      </div>
      <figcaption className="viz-caption">
        A 10 by 13 image stored row by row, covered by thread blocks; dashed cells are threads that fall outside the image and must do
        nothing. The dots mark the first eight threads of the first block in launch order. When threadIdx.x indexes columns they read
        neighbouring addresses; when it indexes rows they jump by a whole row each, which the next lesson shows is far slower.
      </figcaption>
    </figure>
  );
}
