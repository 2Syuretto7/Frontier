"use client";

import { useState } from "react";

const WARP = 32, WORDS = 8; // 32-byte sectors hold 8 floats
const STRIDES = [1, 2, 3, 4, 8, 32];

/** Sectors touched by a warp reading float32 at a word stride and offset, and which words of each sector are used. */
export function warpSectors(stride: number, offset: number) {
  const used = new Map<number, Set<number>>();
  for (let l = 0; l < WARP; l++) {
    const w = offset + l * stride;
    const s = Math.floor(w / WORDS);
    if (!used.has(s)) used.set(s, new Set());
    used.get(s)!.add(w % WORDS);
  }
  const list = [...used.entries()].sort((a, b) => a[0] - b[0]);
  return { list, eff: WARP / (list.length * WORDS) };
}

export function CoalescingViz() {
  const [stride, setStride] = useState(1);
  const [off, setOff] = useState(0);
  const { list, eff } = warpSectors(stride, off);
  const PER = 8, cw = 4.5, sw = WORDS * cw + 6, W = PER * sw + 4, H = Math.ceil(list.length / PER) * 16 + 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Stride in floats">
          {STRIDES.map((s) => (
            <button key={s} type="button" className="seg" aria-pressed={stride === s} onClick={() => setStride(s)}>{`stride ${s}`}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Alignment">
          <button type="button" className="seg" aria-pressed={off === 0} onClick={() => setOff(0)}>aligned</button>
          <button type="button" className="seg" aria-pressed={off === 1} onClick={() => setOff(1)}>offset by one float</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Memory sectors fetched for one warp">
        {list.map(([s, ws], k) => {
          const x = 2 + (k % PER) * sw, y = 3 + Math.floor(k / PER) * 16;
          return (
            <g key={s}>
              {Array.from({ length: WORDS }, (_, j) => (
                <rect key={j} x={x + j * cw} y={y} width={cw - 0.6} height={12} fill={ws.has(j) ? "var(--accent)" : "var(--bg)"} stroke="var(--border)" strokeWidth={0.5} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${list.length} sectors of 32 bytes fetched for 128 useful bytes: ${(eff * 100).toFixed(1)}% of the traffic is used`}
      </div>
      <figcaption className="viz-caption">
        Each group of eight cells is one 32-byte sector of memory; filled cells are the floats the 32 threads of a warp
        actually read. Consecutive threads reading consecutive floats need 4 sectors, all used. A stride of 2 doubles the
        sectors and halves the useful fraction, and from a stride of 8 on every thread costs its own sector, so only one
        byte in eight is used. For contiguous reads, a start that is not aligned to a sector costs one extra sector.
      </figcaption>
    </figure>
  );
}
