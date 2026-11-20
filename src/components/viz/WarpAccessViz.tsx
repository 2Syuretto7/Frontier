"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const WARP = 32, SECTOR = 32, PEAK = 3;
const PATTERNS = ["structure of arrays", "array of structures", "offset by one word", "random gather"];

/**
 * Byte addresses requested by the 32 lanes of a warp, each loading `width` bytes (4 for a float, 16 for a float4), for four access
 * patterns: consecutive elements of one array; one 16-byte struct per lane (reading its first float, or the whole struct with a
 * float4); consecutive elements starting one word late; and elements at random positions in a large array. Returns the addresses,
 * whether every access is aligned to its width, the 32-byte sectors fetched and the fraction of fetched bytes that are used.
 */
export function warpAccess(pattern: number, width: number, seed = 9) {
  const r = rand(seed);
  const addrs = Array.from({ length: WARP }, (_, l) => {
    if (pattern === 0) return l * width;
    if (pattern === 1) return l * 16;
    if (pattern === 2) return 4 + l * width;
    return Math.floor(r() * (1 << 22)) * width;
  });
  const aligned = addrs.every((a) => a % width === 0);
  const secs = new Set<number>();
  for (const a of addrs) for (let s = Math.floor(a / SECTOR); s <= Math.floor((a + width - 1) / SECTOR); s++) secs.add(s);
  const fetched = secs.size * SECTOR;
  return { addrs, aligned, sectors: [...secs].sort((p, q) => p - q), eff: (WARP * width) / fetched };
}

export function WarpAccessViz() {
  const [p, setP] = useState(0);
  const [v, setV] = useState(0);
  const width = v ? 16 : 4;
  const res = useMemo(() => warpAccess(p, width), [p, width]);
  const shown = res.sectors.slice(0, 32);
  const COLS = 8, SW = 38, SH = 16, X0 = 8, Y0 = 8;
  const W = X0 * 2 + COLS * (SW + 2), H = Y0 * 2 + 4 * (SH + 4);
  const used = new Set<number>();
  for (const a of res.addrs) for (let b = a; b < a + width; b += 4) used.add(b);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Access pattern">
          {PATTERNS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>{n}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Bytes loaded per lane">
          {["float per lane", "float4 per lane"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={v === i} onClick={() => setV(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Sectors fetched by one warp, with the words actually used">
        {shown.map((s, k) => {
          const x = X0 + (k % COLS) * (SW + 2), y = Y0 + Math.floor(k / COLS) * (SH + 4);
          return (
            <g key={s}>
              <rect x={x} y={y} width={SW} height={SH} style={{ fill: "var(--bg-subtle)", stroke: "var(--text-muted)" }} />
              {Array.from({ length: 8 }, (_, w) => used.has(s * SECTOR + 4 * w) && (
                <rect key={w} x={x + 1 + w * ((SW - 2) / 8)} y={y + 2} width={(SW - 2) / 8 - 0.6} height={SH - 4} style={{ fill: "var(--accent)" }} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {res.aligned
          ? `${res.sectors.length} sectors (${res.sectors.length * SECTOR} bytes) fetched for ${WARP * width} used: ${(100 * res.eff).toFixed(0)}% efficient, about ${(PEAK * res.eff).toFixed(2)} of ${PEAK} TB/s useful`
          : "misaligned: a float4 load must start at a multiple of 16 bytes, so this kernel would fault"}
      </div>
      <figcaption className="viz-caption">
        One warp&apos;s load, drawn as the 32-byte sectors the memory system fetches (boxes, up to 32 shown) and the words the lanes use
        (filled). Sectors that are far apart in memory are drawn side by side. The peak bandwidth of 3 TB/s is a round illustrative
        figure; the useful share scales with the efficiency.
      </figcaption>
    </figure>
  );
}
