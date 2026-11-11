"use client";

import { useState } from "react";

const KEYS = Array.from({ length: 24 }, (_, i) => 10 * (i + 1));

/** Keys that share a pattern pile into a few buckets under k mod m when m shares a factor with the pattern; a prime m spreads them. */
export function HashBucketViz() {
  const [m, setM] = useState(10);
  const [mult, setMult] = useState(false);
  const h = (k: number) => (mult ? Math.floor(((k * 0.6180339887) % 1) * m) : k % m);
  const buckets = Array.from({ length: m }, () => [] as number[]);
  for (const k of KEYS) buckets[h(k)].push(k);
  const used = buckets.filter((b) => b.length).length;
  const longest = Math.max(...buckets.map((b) => b.length));
  const W = 560, bw = (W - 10) / m, C = 9;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Hash function">
        <button type="button" className="seg" aria-pressed={!mult} onClick={() => setMult(false)}>h(k) = k mod m</button>
        <button type="button" className="seg" aria-pressed={mult} onClick={() => setMult(true)}>Multiplicative hash</button>
      </div>
      <svg viewBox={`0 0 ${W} ${24 * C + 30}`} role="img" aria-label={`24 keys in ${m} buckets; the longest holds ${longest}`}>
        {buckets.map((b, i) => (
          <g key={i}>
            {b.map((k, j) => (
              <rect key={k} x={5 + i * bw + 2} y={24 * C - (j + 1) * C} width={bw - 4} height={C - 1} className={b.length === longest ? "viz-cell is-on" : "viz-cell"} />
            ))}
            <text x={5 + i * bw + bw / 2} y={24 * C + 18} textAnchor="middle" className="plot-tick">{i}</text>
          </g>
        ))}
      </svg>
      <div className="viz-sliders">
        <label><span>Buckets <span className="mono">m = {m}</span></span><input type="range" min={2} max={31} value={m} onChange={(e) => setM(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The keys are 10, 20, …, 240. They land in <span className="mono">{used}</span> of {m} buckets, and the longest chain holds{" "}
        <span className="mono">{longest}</span> (an even spread would give {Math.ceil(24 / m)}).{" "}
        {!mult && <>With k mod m, a key 10j lands in bucket 10j mod m, and only multiples of gcd(10, m) = {gcdOf(10, m)} are reachable. Try m = 10, then 11.</>}
        {mult && <>The multiplicative hash uses the fractional part of k × 0.618…, which scatters regular patterns whatever m is.</>}
      </figcaption>
    </figure>
  );
}

function gcdOf(a: number, b: number): number { return b ? gcdOf(b, a % b) : a; }
