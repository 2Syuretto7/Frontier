"use client";

import { useState } from "react";

const SIZES = [32, 64, 128, 256];
const SMS = 132;
export const SHAPES = [
  { name: "decode, M = 16", M: 16, N: 8192, K: 8192 },
  { name: "square, 4096", M: 4096, N: 4096, K: 4096 },
  { name: "square, 1536", M: 1536, N: 1536, K: 1536 },
];

/**
 * A modelled time, in arbitrary units, for a matrix multiplication with BM by BN output tiles on a GPU with 132 SMs, one tile per SM
 * at a time. Each tile costs 2 BM BN K operations at an efficiency I / (I + 24), where I = BM BN / (BM + BN) is the tile's arithmetic
 * intensity per byte loaded; tiles run in waves of 132. Tiles larger than 128 by 256 do not fit in registers and are rejected.
 */
export function modelTime(M: number, N: number, K: number, BM: number, BN: number) {
  if (BM * BN > 128 * 256) return Infinity;
  const tiles = Math.ceil(M / BM) * Math.ceil(N / BN);
  const waves = Math.ceil(tiles / SMS);
  const I = (BM * BN) / (BM + BN);
  return (waves * 2 * BM * BN * K) / (I / (I + 24)) / 1e9;
}

export function tuneGrid(s: number) {
  const { M, N, K } = SHAPES[s];
  const t = SIZES.map((bm) => SIZES.map((bn) => modelTime(M, N, K, bm, bn)));
  let best = [0, 0];
  t.forEach((row, i) => row.forEach((v, j) => { if (v < t[best[0]][best[1]]) best = [i, j]; }));
  const tb = t[best[0]][best[1]];
  const tiles = Math.ceil(M / SIZES[best[0]]) * Math.ceil(N / SIZES[best[1]]);
  return { t, best, tb, def: t[2][2] / tb, tiles, waves: Math.ceil(tiles / SMS) };
}

export function AutotuneHeatmapViz() {
  const [s, setS] = useState(0);
  const g = tuneGrid(s);
  const CELL = 52, X0 = 52, Y0 = 26, W = X0 + 4 * CELL + 6, H = Y0 + 4 * CELL + 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Problem shape">
          {SHAPES.map((sh, i) => <button key={sh.name} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{sh.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Modelled time of each tile shape, relative to the best">
        <text x={X0 + 2 * CELL} y={10} textAnchor="middle" className="viz-label">BN</text>
        <text x={10} y={Y0 + 2 * CELL} textAnchor="middle" className="viz-label">BM</text>
        {SIZES.map((v, i) => (
          <g key={v}>
            <text x={X0 + i * CELL + CELL / 2} y={Y0 - 4} textAnchor="middle" className="viz-label">{v}</text>
            <text x={X0 - 6} y={Y0 + i * CELL + CELL / 2 + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {g.t.map((row, i) => row.map((v, j) => {
          const ok = Number.isFinite(v), r = ok ? v / g.tb : 0, best = i === g.best[0] && j === g.best[1];
          return (
            <g key={`${i}-${j}`}>
              <rect x={X0 + j * CELL} y={Y0 + i * CELL} width={CELL - 2} height={CELL - 2}
                style={{ fill: best ? "var(--accent)" : ok ? "var(--text-muted)" : "var(--bg-subtle)", stroke: "var(--border)" }} opacity={best || !ok ? 1 : Math.max(0.12, 0.85 / r)} />
              <text x={X0 + j * CELL + CELL / 2 - 1} y={Y0 + i * CELL + CELL / 2 + 3} textAnchor="middle" className="viz-label" style={{ fill: best ? "var(--bg)" : "var(--text)" }}>{ok ? r.toFixed(2) : "×"}</text>
            </g>
          );
        }))}
        <rect x={X0 + 2 * CELL - 1} y={Y0 + 2 * CELL - 1} width={CELL} height={CELL} style={{ fill: "none", stroke: "var(--text)" }} strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best {SIZES[g.best[0]]}×{SIZES[g.best[1]]}: {g.tiles} tiles in {g.waves} wave{g.waves > 1 ? "s" : ""}; the outlined 128×128 default is {g.def.toFixed(2)}× slower
      </div>
      <figcaption className="viz-caption">
        A simple model of a matrix multiplication on a 132-SM GPU: each cell is the time of one tile shape relative to the best, and ×
        marks shapes too large for the registers. Large tiles reuse operands better, but a small or oddly sized problem leaves SMs idle
        in the last wave or wastes work on masked rows. The best shape changes with the problem, which is why it is chosen per shape by
        timing candidates.
      </figcaption>
    </figure>
  );
}
