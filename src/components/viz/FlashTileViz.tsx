"use client";

import { useState } from "react";

const NS = [512, 1024, 2048];
const B = 128, D = 128;

/**
 * Tiles of the attention matrix that a FlashAttention forward pass computes for one head, with 128 by 128 tiles and head dimension
 * 128, and the bytes it moves to and from global memory in bfloat16, against a standard implementation that writes and reads the
 * score and probability matrices.
 */
export function flashTiles(N: number, causal: boolean) {
  const T = N / B;
  const tiles: ("full" | "diag" | "skip")[][] = Array.from({ length: T }, (_, i) =>
    Array.from({ length: T }, (_, j) => (!causal ? "full" : j < i ? "full" : j === i ? "diag" : "skip")));
  const computed = tiles.flat().filter((t) => t !== "skip").length;
  const flash = 2 * (2 * N * D + computed * 2 * B * D);
  const standard = 2 * (4 * N * N + 4 * N * D);
  return { T, tiles, computed, flash, standard };
}

export function FlashTileViz() {
  const [k, setK] = useState(1);
  const [c, setC] = useState(1);
  const N = NS[k];
  const r = flashTiles(N, c === 1);
  const SZ = 224, X0 = 34, Y0 = 18, cell = SZ / r.T, W = X0 + SZ + 8, H = Y0 + SZ + 8;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Sequence length">
          {NS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>N = {n}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Masking">
          {["bidirectional", "causal"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={c === i} onClick={() => setC(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Tiles of the attention matrix computed by FlashAttention">
        <text x={X0 + SZ / 2} y={11} textAnchor="middle" className="viz-label">key blocks j</text>
        <text x={14} y={Y0 + SZ / 2} textAnchor="middle" className="viz-label" transform={`rotate(-90 14 ${Y0 + SZ / 2})`}>query blocks i</text>
        {r.tiles.map((row, i) => row.map((t, j) => (
          <rect key={`${i}-${j}`} x={X0 + j * cell} y={Y0 + i * cell} width={cell - 1} height={cell - 1}
            style={{ fill: t === "skip" ? "var(--bg-subtle)" : t === "diag" ? "var(--accent)" : "var(--text-muted)", stroke: "var(--border)" }}
            opacity={t === "full" ? 0.7 : 1} />
        )))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {r.computed} of {r.T * r.T} tiles; global memory {(r.flash / 1e6).toFixed(2)} MB, against {(r.standard / 1e6).toFixed(2)} MB with the
        attention matrix stored
      </div>
      <figcaption className="viz-caption">
        One head of attention, head dimension 128, split into 128 by 128 tiles. Each program owns one row of query blocks and walks along
        it, computing each tile in on-chip memory and folding it into a running softmax state. With a causal mask, tiles above the
        diagonal are skipped and diagonal tiles (accent) are masked inside. Traffic counts bfloat16 reads and writes of Q, K, V, the
        output, and, for the standard method, the scores and probabilities.
      </figcaption>
    </figure>
  );
}
