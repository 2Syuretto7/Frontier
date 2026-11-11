"use client";

import { useState } from "react";

const M = 96;

function mix(x: number) {
  let h = (x ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
const positions = (x: number, k: number) => {
  const h1 = mix(x), h2 = mix(x + 0x5bd1e995) | 1;
  return Array.from({ length: k }, (_, i) => (h1 + i * h2) % M);
};

/** A Bloom filter: each item sets k bits; a query that finds all k bits set says "maybe", otherwise "definitely not". */
export function BloomViz() {
  const [n, setN] = useState(10);
  const [k, setK] = useState(4);
  const bits = Array(M).fill(0);
  for (let x = 1; x <= n; x++) for (const p of positions(x, k)) bits[p] = 1;
  let fp = 0; const T = 3000;
  for (let x = 100000; x < 100000 + T; x++) if (positions(x, k).every((p) => bits[p])) fp++;
  const theory = (1 - Math.exp((-k * n) / M)) ** k;
  const set = bits.reduce((a, b) => a + b, 0);
  const probe = positions(100000 + 7, k);
  const C = 12, cols = 24, W = cols * C + 10;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${(M / cols) * C + 10}`} role="img" aria-label={`${set} of ${M} bits set after ${n} insertions with ${k} hash functions`}>
        {bits.map((b, i) => (
          <rect key={i} x={5 + (i % cols) * C} y={5 + Math.floor(i / cols) * C} width={C - 2} height={C - 2} className={b ? "viz-cell is-on" : "viz-cell"} style={probe.includes(i) ? { strokeWidth: 2.5 } : undefined} />
        ))}
      </svg>
      <div className="viz-sliders">
        <label><span>Items inserted <span className="mono">n = {n}</span></span><input type="range" min={0} max={60} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
        <label><span>Hash functions <span className="mono">k = {k}</span></span><input type="range" min={1} max={12} value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {set} of {M} bits are set. The outlined bits are where one item that was never inserted would look: it is{" "}
        {probe.every((p) => bits[p]) ? "a false positive, since all of them happen to be set" : "correctly rejected, since at least one is 0"}. Over {T} such
        queries the false positive rate is <span className="mono">{(100 * fp / T).toFixed(1)}%</span>, against <span className="mono">{(100 * theory).toFixed(1)}%</span>{" "}
        from (1 − e<sup>−kn/m</sup>)<sup>k</sup>. For fixed m and n, too few hash functions leave each query weakly tested, and too many fill the array; the best k is
        (m/n) ln 2 ≈ <span className="mono">{n ? ((M / n) * Math.LN2).toFixed(1) : "∞"}</span>.
      </figcaption>
    </figure>
  );
}
