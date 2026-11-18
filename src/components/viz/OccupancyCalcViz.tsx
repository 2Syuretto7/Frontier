"use client";

import { useState } from "react";

const LIM = { blocks: 32, threads: 2048, regs: 65536, smem: 228 };

/** Blocks per SM allowed by each resource, for an SM with H100-like limits; shared memory in KB. */
export function perResource(threads: number, regs: number, smemKB: number) {
  const r: [string, number][] = [
    ["block slots", LIM.blocks],
    ["threads", Math.floor(LIM.threads / threads)],
    ["registers", Math.floor(LIM.regs / (regs * threads))],
  ];
  if (smemKB > 0) r.push(["shared memory", Math.floor(LIM.smem / smemKB)]);
  const blocks = Math.min(...r.map((x) => x[1]));
  return { r, blocks, occ: (blocks * threads) / LIM.threads };
}

export function OccupancyCalcViz() {
  const [threads, setThreads] = useState(256);
  const [regs, setRegs] = useState(64);
  const [smem, setSmem] = useState(32);
  const { r, blocks, occ } = perResource(threads, regs, smem);
  const W = 320, rh = 22, X0 = 96, H = r.length * rh + 6, PW = W - X0 - 30;
  const maxB = 32;
  const sliders: [string, number, number, number, number, (v: number) => void][] = [
    ["threads per block", threads, 64, 1024, 64, setThreads],
    ["registers per thread", regs, 16, 255, 1, setRegs],
    ["shared memory per block (KB)", smem, 0, 228, 4, setSmem],
  ];
  return (
    <figure className="viz">
      <div style={{ display: "grid", gap: 6 }}>
        {sliders.map(([label, v, lo, hi, step, set], i) => (
          <div key={label} className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
            <label className="viz-label" htmlFor={`occ-${i}`} style={{ minWidth: 190 }}>{`${label}: ${v}`}</label>
            <input id={`occ-${i}`} type="range" min={lo} max={hi} step={step} value={v} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "8px auto 0" }} role="img" aria-label="Blocks per SM allowed by each resource">
        {r.map(([name, b], k) => {
          const y = 3 + k * rh;
          const bind = b === blocks;
          return (
            <g key={name}>
              <text x={X0 - 6} y={y + 13} textAnchor="end" className="viz-label" style={{ fontSize: 10 }}>{name}</text>
              <rect x={X0} y={y} width={Math.max((Math.min(b, maxB) / maxB) * PW, 1)} height={rh - 6} fill={bind ? "var(--danger)" : "var(--accent-soft)"} />
              <text x={X0 + (Math.min(b, maxB) / maxB) * PW + 4} y={y + 13} className="viz-label" style={{ fontSize: 10 }}>{b}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {blocks === 0
          ? "0 blocks fit: the kernel cannot launch with these settings"
          : `${blocks} blocks × ${threads} threads = ${blocks * threads} of 2048 threads: occupancy ${(occ * 100).toFixed(1)}%`}
      </div>
      <figcaption className="viz-caption">
        Each bar is the number of blocks that one SM could hold if only that resource counted; the smallest (red) decides.
        With the starting settings, 64 registers per thread let 4 blocks of 256 threads in, half the 2048 threads an SM can
        hold. Drop to 32 registers and shared memory binds instead; set shared memory to 0 and threads and registers tie at
        8 blocks, full occupancy. Real GPUs allocate registers and shared memory in chunks, so their figures are slightly
        lower than this model.
      </figcaption>
    </figure>
  );
}
