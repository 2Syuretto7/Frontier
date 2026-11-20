"use client";

import { useState } from "react";

const C = 4, K = 2 * C;

/** Owner of query chunk q among C ranks: contiguous gives rank ⌊q/2⌋, zig-zag gives chunks i and 2C − 1 − i to rank i. */
export function chunkOwner(q: number, zigzag: boolean) {
  return zigzag ? Math.min(q, K - 1 - q) : Math.floor(q / 2);
}

export function RingAttentionViz() {
  const [zz, setZz] = useState(false);
  const W = 330, X0 = 70, CS = 22, Y0 = 18;
  const work = Array.from({ length: C }, () => 0);
  for (let q = 0; q < K; q++) work[chunkOwner(q, zz)] += q + 0.5;
  const mean = work.reduce((a, b) => a + b, 0) / C;
  const op = (r: number) => 0.2 + (0.75 * r) / (C - 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Sequence partition">
          <button type="button" className="seg" aria-pressed={!zz} onClick={() => setZz(false)}>contiguous</button>
          <button type="button" className="seg" aria-pressed={zz} onClick={() => setZz(true)}>zig-zag</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + K * CS + 10}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Causal attention blocks coloured by the rank that computes them">
        <text x={X0 + (K * CS) / 2} y={11} textAnchor="middle" className="viz-label">key chunk</text>
        {Array.from({ length: K }, (_, q) => {
          const r = chunkOwner(q, zz);
          return (
            <g key={q}>
              <text x={X0 - 6} y={Y0 + q * CS + 15} textAnchor="end" className="viz-label">q{q} · rank {r}</text>
              {Array.from({ length: K }, (_, k) => {
                const x = X0 + k * CS, y = Y0 + q * CS;
                if (k > q) return <rect key={k} x={x} y={y} width={CS - 2} height={CS - 2} style={{ fill: "var(--bg-subtle)", stroke: "var(--border)" }} />;
                if (k === q) return <polygon key={k} points={`${x},${y} ${x},${y + CS - 2} ${x + CS - 2},${y + CS - 2}`} style={{ fill: "var(--accent)" }} opacity={op(r)} />;
                return <rect key={k} x={x} y={y} width={CS - 2} height={CS - 2} style={{ fill: "var(--accent)" }} opacity={op(r)} />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        blocks per rank: {work.join(", ")}; slowest / mean = {(Math.max(...work) / mean).toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Four ranks share a causal sequence cut into eight chunks; each row is a query chunk, shaded by the rank that owns it, and
        each filled cell is a block of attention that rank must compute. With contiguous chunks the last rank does seven times the
        first rank&apos;s work and everyone waits for it. Pairing an early chunk with a late one evens out the work exactly.
      </figcaption>
    </figure>
  );
}
