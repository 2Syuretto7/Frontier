"use client";

import { useState } from "react";

/** Positions (row, column) held by a lane in the m16n8k16 accumulator tile (16 by 8, float32) and A operand tile (16 by 16, 16-bit). */
export function fragment(lane: number, which: "C" | "A") {
  const g = lane >> 2, t = lane & 3;
  if (which === "C") return Array.from({ length: 4 }, (_, i) => [g + 8 * (i >> 1), 2 * t + (i & 1)] as [number, number]);
  return Array.from({ length: 8 }, (_, i) => [g + 8 * ((i >> 1) & 1), 2 * t + (i & 1) + 8 * (i >> 2)] as [number, number]);
}

const LANES = [0, 5, 18, 31];

export function MmaFragmentViz() {
  const [w, setW] = useState(0);
  const [l, setL] = useState(1);
  const which = w === 0 ? "C" : "A";
  const cols = which === "C" ? 8 : 16;
  const owner: number[][] = Array.from({ length: 16 }, () => new Array(cols).fill(-1));
  for (let lane = 0; lane < 32; lane++) fragment(lane, which).forEach(([r, c], i) => { owner[r][c] = lane * 10 + i; });
  const lane = LANES[l];
  const CELL = which === "C" ? 26 : 19, X0 = 4, Y0 = 4;
  const W = X0 * 2 + cols * CELL, H = Y0 * 2 + 16 * CELL;
  const mine = fragment(lane, which);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Which tile">
          {["accumulator C, 16×8", "operand A, 16×16"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={w === i} onClick={() => setW(i)}>{n}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Lane to highlight">
          {LANES.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={l === i} onClick={() => setL(i)}>lane {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: which === "C" ? 240 : 340, display: "block", margin: "0 auto" }} role="img" aria-label="Which lane of the warp holds each element of the tile">
        {owner.map((row, r) => row.map((o, c) => {
          const ln = Math.floor(o / 10), on = ln === lane;
          return (
            <g key={`${r}-${c}`}>
              <rect x={X0 + c * CELL} y={Y0 + r * CELL} width={CELL - 1} height={CELL - 1} style={{ fill: on ? "var(--accent)" : (r >> 3) % 2 ? "var(--bg-subtle)" : "var(--surface)", stroke: "var(--border)" }} />
              <text x={X0 + c * CELL + (CELL - 1) / 2} y={Y0 + r * CELL + CELL / 2 + 3} textAnchor="middle" style={{ fontSize: 8, fill: on ? "var(--bg)" : "var(--text-muted)" }}>{ln}</text>
            </g>
          );
        }))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        lane {lane} holds {which === "C" ? "c" : "a"}0..{which === "C" ? 3 : 7} at {mine.map(([r, c]) => `(${r},${c})`).join(" ")}
      </div>
      <figcaption className="viz-caption">
        For one tensor core instruction, mma.sync m16n8k16, every element of each tile lives in a register of one of the warp&apos;s 32
        lanes; each cell shows its lane. The layout is fixed by the hardware: lanes come in groups of four sharing a row, and each lane
        holds pairs of neighbouring columns in the top and bottom halves of the tile. Kernels must load operands into exactly these
        positions and know where each result lands.
      </figcaption>
    </figure>
  );
}
