"use client";

import { useState } from "react";

const T = 8;
export const STRATEGIES = [
  { name: "program per key block", mm: 5, atomics: 1, own: "dK, dV", shared: "dQ" },
  { name: "program per query block", mm: 5, atomics: 2, own: "dQ", shared: "dK and dV" },
  { name: "two kernels", mm: 7, atomics: 0, own: "dK, dV, then dQ", shared: "nothing" },
];

/**
 * The backward pass over an 8 by 8 grid of attention tiles (a sequence of 1024 in 128 by 128 tiles). For each way of assigning
 * tiles to programs: the tiles computed, the matrix multiplications per tile (recomputing S, then dV, dP, dK and dQ, with S and dP
 * recomputed again when dQ has its own kernel), and the tile-sized atomic additions into gradients that several programs share.
 */
export function backwardCost(k: number, causal: boolean) {
  const tiles = causal ? (T * (T + 1)) / 2 : T * T;
  const s = STRATEGIES[k];
  return { tiles, matmuls: tiles * s.mm, atomics: tiles * s.atomics };
}

export function FlashBackwardViz() {
  const [k, setK] = useState(0);
  const [c, setC] = useState(1);
  const causal = c === 1;
  const r = backwardCost(k, causal);
  const PROG = 2;
  const SZ = 200, X0 = 34, Y0 = 18, cell = SZ / T, W = X0 + SZ + 8, H = Y0 + SZ + 8;
  const mine = (i: number, j: number) => (k === 0 ? j === PROG : k === 1 ? i === PROG : j === PROG);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How tiles are assigned to programs">
          {STRATEGIES.map((s, i) => <button key={s.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{s.name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Masking">
          {["bidirectional", "causal"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={c === i} onClick={() => setC(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }} role="img" aria-label="Tiles of the attention matrix handled by one program in the backward pass">
        <text x={X0 + SZ / 2} y={11} textAnchor="middle" className="viz-label">key blocks j</text>
        <text x={14} y={Y0 + SZ / 2} textAnchor="middle" className="viz-label" transform={`rotate(-90 14 ${Y0 + SZ / 2})`}>query blocks i</text>
        {Array.from({ length: T }, (_, i) => Array.from({ length: T }, (_, j) => {
          const on = !causal || j <= i;
          return (
            <rect key={`${i}-${j}`} x={X0 + j * cell} y={Y0 + i * cell} width={cell - 1} height={cell - 1}
              style={{ fill: !on ? "var(--bg-subtle)" : mine(i, j) ? "var(--accent)" : "var(--text-muted)", stroke: "var(--border)" }}
              opacity={on && !mine(i, j) ? 0.55 : 1} />
          );
        }))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {r.tiles} tiles, {r.matmuls} tile matmuls, {r.atomics} atomic tile additions; on chip: {STRATEGIES[k].own}; shared: {STRATEGIES[k].shared}
      </div>
      <figcaption className="viz-caption">
        Every tile of the attention matrix contributes to three gradients: dQ for its query block, and dK and dV for its key block. A
        program that owns a column of tiles (accent) can keep dK and dV for its key block in registers, but dQ for each query block
        receives contributions from many programs and must be added atomically; owning a row reverses the problem for two gradients. A
        separate kernel for dQ avoids atomics at the price of recomputing the scores and dP a second time.
      </figcaption>
    </figure>
  );
}
