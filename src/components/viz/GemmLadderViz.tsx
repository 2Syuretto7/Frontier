"use client";

import { useState } from "react";

const PEAK = 20, DRAM = 1, SMEM = 10;

export const LEVELS = [
  { name: "naive", bm: 1, r: 0, desc: "one thread per output, operands straight from global memory" },
  { name: "shared 32", bm: 32, r: 1, desc: "32×32 tiles staged in shared memory, one output per thread" },
  { name: "+ 4×4 registers", bm: 64, r: 4, desc: "64×64 block tile, each thread computes 4×4 outputs" },
  { name: "+ 8×8 registers", bm: 128, r: 8, desc: "128×128 block tile, each thread computes 8×8 outputs" },
];

/**
 * Roofline bounds, in TFLOP/s, for a large square float32 matrix multiplication on an illustrative GPU with a 20 TFLOP/s peak,
 * 1 TB/s of global memory bandwidth and 10 TB/s of shared memory bandwidth, ignoring caches. A square block tile of side bm gives a
 * global intensity of bm / 4 FLOP per byte; an r by r register tile gives a shared-memory intensity of r / 4 (r = 0: no shared memory).
 */
export function gemmBounds(bm: number, r: number) {
  const global = (bm / 4) * DRAM;
  const shared = r ? (r / 4) * SMEM : Infinity;
  const best = Math.min(PEAK, global, shared);
  const by = best === PEAK ? "compute" : best === global ? "global memory" : "shared memory";
  return { global, shared, peak: PEAK, best, by };
}

export function GemmLadderViz() {
  const [k, setK] = useState(0);
  const L = LEVELS[k];
  const b = gemmBounds(L.bm, L.r);
  const rows = [
    { name: "global memory", v: b.global },
    { name: "shared memory", v: b.shared },
    { name: "compute peak", v: b.peak },
  ];
  const W = 330, H = 136, X0 = 104, PW = 190, MAX = 40;
  const px = (v: number) => X0 + (Math.min(v, MAX) / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Kernel version">
          {LEVELS.map((l, i) => <button key={l.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{l.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The three ceilings on matrix multiplication throughput for the chosen kernel">
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={px(v)} x2={px(v)} y1={6} y2={104} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={px(v)} y={116} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        {rows.map((row, i) => {
          const bind = row.v === b.best;
          return (
            <g key={row.name}>
              <text x={X0 - 8} y={26 + i * 32} textAnchor="end" className="viz-label">{row.name}</text>
              {Number.isFinite(row.v) && <rect x={X0} y={12 + i * 32} width={px(row.v) - X0} height={20} style={{ fill: bind ? "var(--accent)" : "var(--text-muted)" }} opacity={bind ? 1 : 0.55} />}
              <text x={Number.isFinite(row.v) ? Math.min(px(row.v), X0 + PW) + 4 : X0 + 4} y={26 + i * 32} className="viz-label">{Number.isFinite(row.v) ? row.v : "not used"}</text>
            </g>
          );
        })}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">TFLOP/s allowed by each limit</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {L.desc}: at most {b.best} TFLOP/s, limited by {b.by}
      </div>
      <figcaption className="viz-caption">
        Each kernel version is capped by the slowest of three rates: how fast global memory can supply operands, how fast shared memory
        can feed the arithmetic units, and the arithmetic peak. The machine is illustrative and caches are ignored, so in practice the
        naive kernel does somewhat better than shown; the order of the improvements is the point.
      </figcaption>
    </figure>
  );
}
