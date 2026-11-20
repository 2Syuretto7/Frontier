"use client";

import { useMemo, useState } from "react";

const NODES = 5, KEYS = 3000, VNODES = [1, 8, 64];
const COLORS = ["var(--accent)", "var(--success)", "var(--danger)", "var(--text-muted)", "var(--code-number)", "var(--code-function)"];

/** A 32-bit integer mixing hash, mapping to [0, 1). */
export function mix(x: number) {
  let h = (x ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const ringOf = (nodes: number, v: number) =>
  Array.from({ length: nodes * v }, (_, i) => ({ pos: mix(1000003 * (Math.floor(i / v) + 1) + (i % v)), node: Math.floor(i / v) })).sort((a, b) => a.pos - b.pos);

const owner = (ring: { pos: number; node: number }[], h: number) => (ring.find((p) => p.pos >= h) ?? ring[0]).node;

/** Keys per node with 5 nodes, and the fraction of keys that move when a sixth node joins, for the ring and for mod-N hashing. */
export function hashStats(v: number) {
  const r5 = ringOf(NODES, v), r6 = ringOf(NODES + 1, v), load = Array(NODES).fill(0);
  let moved = 0, movedMod = 0;
  for (let k = 0; k < KEYS; k++) {
    const h = mix(k + 7), a = owner(r5, h);
    load[a]++;
    if (owner(r6, h) !== a) moved++;
    const m = Math.floor(h * 2 ** 32);
    if (m % NODES !== m % (NODES + 1)) movedMod++;
  }
  return { r5, load, moved: moved / KEYS, movedMod: movedMod / KEYS, imbalance: Math.max(...load) / (KEYS / NODES) };
}

export function ConsistentHashViz() {
  const [vi, setVi] = useState(1);
  const { r5, load, moved, movedMod, imbalance } = useMemo(() => hashStats(VNODES[vi]), [vi]);
  const W = 330, H = 200, cx = 92, cy = 100, rad = 78, bx = 200, bw = 22, bh = 140, by = 30, maxL = 1500;
  const pt = (f: number, r: number) => [cx + r * Math.sin(2 * Math.PI * f), cy - r * Math.cos(2 * Math.PI * f)];
  const arcs = r5.map((p, i) => {
    const prev = i ? r5[i - 1].pos : r5[r5.length - 1].pos - 1;
    const [x1, y1] = pt(prev, rad), [x2, y2] = pt(p.pos, rad), large = p.pos - prev > 0.5 ? 1 : 0;
    return <path key={i} d={`M${x1.toFixed(1)},${y1.toFixed(1)} A${rad},${rad} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)}`} fill="none" stroke={COLORS[p.node]} strokeWidth={10} />;
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">virtual nodes per server</span>
        <div className="segmented" role="group" aria-label="Virtual nodes per server">
          {VNODES.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={vi === i} onClick={() => setVi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The hash ring coloured by owning server, and keys per server">
        {arcs}
        <text x={cx} y={cy + 4} textAnchor="middle" className="viz-label">hash ring</text>
        {load.map((c, i) => (
          <g key={i}>
            <rect x={bx + i * (bw + 4)} y={by + bh - (c / maxL) * bh} width={bw} height={(c / maxL) * bh} fill={COLORS[i]} />
            <text x={bx + i * (bw + 4) + bw / 2} y={by + bh + 13} textAnchor="middle" className="viz-label">{`S${i}`}</text>
          </g>
        ))}
        <line x1={bx - 2} x2={bx + NODES * (bw + 4)} y1={by + bh - (KEYS / NODES / maxL) * bh} y2={by + bh - (KEYS / NODES / maxL) * bh} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={bx + (NODES * (bw + 4)) / 2} y={18} textAnchor="middle" className="viz-label">keys per server</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`busiest server ${imbalance.toFixed(2)}× the mean; adding a 6th server moves ${(moved * 100).toFixed(0)}% of keys (mod-N: ${(movedMod * 100).toFixed(0)}%)`}
      </div>
      <figcaption className="viz-caption">
        Five servers own the arcs of a hash ring that end at their points, and 3000 keys go to the first server point at or
        after their hash. With one or eight points per server the arcs are uneven and the busiest server holds about 1.4 times
        its fair share; with 64 virtual nodes per server, 1.10 times. Adding a sixth server moves only the keys on the arcs it
        takes over: 7%, 11% and 14% here, approaching the ideal of one sixth as its share evens out. Assigning keys by hash
        mod N instead moves 84% of them.
      </figcaption>
    </figure>
  );
}
