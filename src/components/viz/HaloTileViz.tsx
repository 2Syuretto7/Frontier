"use client";

import { useState } from "react";

const TILES = [8, 16, 32];
const RADII = [1, 2, 4];

/** For a T by T output tile of a stencil of radius r: inputs loaded into shared memory, loads per output, halo share and bytes. */
export function haloTile(T: number, r: number) {
  const side = T + 2 * r;
  const loads = side * side;
  return { side, loads, perOut: loads / (T * T), naive: (2 * r + 1) ** 2, halo: 1 - (T * T) / loads, bytes: loads * 4 };
}

export function HaloTileViz() {
  const [t, setT] = useState(1);
  const [ri, setR] = useState(1);
  const T = TILES[t], r = RADII[ri];
  const res = haloTile(T, r);
  const S = 200, cell = S / res.side, X0 = 10, Y0 = 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Output tile size">
          {TILES.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={t === i} onClick={() => setT(i)}>tile {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Stencil radius">
          {RADII.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ri === i} onClick={() => setR(i)}>radius {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${S + 2 * X0} ${S + 2 * Y0}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="An output tile with its halo of extra inputs">
        <rect x={X0} y={Y0} width={S} height={S} style={{ fill: "var(--bg-subtle)", stroke: "var(--text-muted)" }} />
        <rect x={X0 + r * cell} y={Y0 + r * cell} width={T * cell} height={T * cell} style={{ fill: "var(--accent)" }} opacity={0.75} />
        {res.side <= 24 && Array.from({ length: res.side - 1 }, (_, i) => (
          <g key={i}>
            <line x1={X0 + (i + 1) * cell} x2={X0 + (i + 1) * cell} y1={Y0} y2={Y0 + S} stroke="var(--border)" strokeWidth={0.5} />
            <line y1={Y0 + (i + 1) * cell} y2={Y0 + (i + 1) * cell} x1={X0} x2={X0 + S} stroke="var(--border)" strokeWidth={0.5} />
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {res.loads} inputs for {T * T} outputs: {res.perOut.toFixed(2)} global reads per output (untiled {res.naive}); halo {(100 * res.halo).toFixed(0)}% of the tile; {(res.bytes / 1024).toFixed(1)} KB of shared memory
      </div>
      <figcaption className="viz-caption">
        A block computes a square of outputs (coloured) of a two-dimensional stencil and first copies the inputs it needs, the square
        plus a border of width equal to the radius, into shared memory. Without tiling each output reads its whole neighbourhood from
        global memory. Larger tiles spread the border over more outputs but need more shared memory per block.
      </figcaption>
    </figure>
  );
}
