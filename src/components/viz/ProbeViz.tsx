"use client";

import { useState } from "react";

const M = 61;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s; };
}

/** Open addressing at a chosen load factor: linear probing grows clusters; double hashing scatters its probes. */
export function ProbeViz() {
  const [alpha, setAlpha] = useState(0.7);
  const [dbl, setDbl] = useState(false);
  const [seed, setSeed] = useState(3);
  const r = rng(seed);
  const table: (number | null)[] = Array(M).fill(null);
  const seq = (k: number) => { const step = dbl ? 1 + (Math.floor(k / M) % (M - 1)) : 1; return (i: number) => (k % M + i * step) % M; };
  const n = Math.floor(alpha * M);
  for (let j = 0; j < n; j++) {
    const k = r() % 1000000, s = seq(k);
    for (let i = 0; ; i++) if (table[s(i)] === null) { table[s(i)] = k; break; }
  }
  // Exact average unsuccessful-search cost over many fresh keys.
  let tot = 0; const T = 4000;
  for (let j = 0; j < T; j++) {
    const k = r() % 1000000, s = seq(k);
    for (let i = 0; ; i++) if (table[s(i)] === null) { tot += i + 1; break; }
  }
  let longest = 0, run = 0;
  for (let i = 0; i < 2 * M; i++) { if (table[i % M] !== null) { run++; longest = Math.max(longest, Math.min(run, M)); } else run = 0; }
  const theory = dbl ? 1 / (1 - n / M) : 0.5 * (1 + 1 / (1 - n / M) ** 2);
  const C = 9, W = M * C + 10;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Probing scheme">
        <button type="button" className="seg" aria-pressed={!dbl} onClick={() => setDbl(false)}>Linear probing</button>
        <button type="button" className="seg" aria-pressed={dbl} onClick={() => setDbl(true)}>Double hashing</button>
      </div>
      <svg viewBox={`0 0 ${W} 40`} role="img" aria-label={`${n} keys in ${M} slots; the longest run of full slots is ${longest}`}>
        {table.map((v, i) => <rect key={i} x={5 + i * C} y={6} width={C - 1.5} height={26} className={v !== null ? "viz-cell is-on" : "viz-cell"} />)}
      </svg>
      <div className="viz-sliders">
        <label><span>Load factor <span className="mono">α = {(n / M).toFixed(2)}</span></span><input type="range" min={0.1} max={0.95} step={0.05} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>New random keys</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {n} keys in {M} slots. The longest run of full slots is <span className="mono">{longest}</span>. A search for a missing key probes{" "}
        <span className="mono">{(tot / T).toFixed(2)}</span> slots on average here; theory predicts <span className="mono">{theory.toFixed(2)}</span>{" "}
        ({dbl ? "1/(1 − α) for double hashing" : "½(1 + 1/(1 − α)²) for linear probing"}). {!dbl && "Clusters attract more keys and merge, so linear probing degrades sharply above α ≈ 0.7."}
        {dbl && " Each key has its own step, so clusters do not snowball."}
      </figcaption>
    </figure>
  );
}
