"use client";

import { useState } from "react";

const COMPUTE = [10, 10, 10, 10, 10, 10];
const GATHER = [14, 6, 14, 6, 14, 6];
const UNIT_GB = 1.5, SHARDED_GB = 0.6;

/**
 * FSDP forward pass over six units. One all-gather runs at a time; with prefetch p the gather for unit i may start once unit
 * i − p − 1 has finished computing and freed its buffer. Unit i computes when its weights have arrived and unit i − 1 is done.
 */
export function prefetchTimeline(p: number) {
  const g: [number, number][] = [], c: [number, number][] = [];
  for (let i = 0; i < COMPUTE.length; i++) {
    let s = i ? g[i - 1][1] : 0;
    if (i - p - 1 >= 0) s = Math.max(s, c[i - p - 1][1]);
    g.push([s, s + GATHER[i]]);
    const cs = Math.max(i ? c[i - 1][1] : 0, s + GATHER[i]);
    c.push([cs, cs + COMPUTE[i]]);
  }
  let held = 0;
  for (const [a] of c) held = Math.max(held, g.filter(([s], j) => s <= a && c[j][1] > a).length);
  return { g, c, total: c[c.length - 1][1], peak: SHARDED_GB + held * UNIT_GB };
}

export function FsdpPrefetchViz() {
  const [p, setP] = useState(0);
  const r = prefetchTimeline(p);
  const W = 330, X0 = 62, PW = 260, MAX = 140;
  const px = (t: number) => X0 + (t / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Prefetch depth">
          {[0, 1, 2].map((v) => <button key={v} type="button" className="seg" aria-pressed={p === v} onClick={() => setP(v)}>{v === 0 ? "no prefetch" : `prefetch ${v}`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} 86`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="All-gathers and compute for six FSDP units on a time line">
        <text x={X0 - 6} y={23} textAnchor="end" className="viz-label">all-gather</text>
        <text x={X0 - 6} y={51} textAnchor="end" className="viz-label">compute</text>
        {r.g.map(([a, b], i) => <rect key={`g${i}`} x={px(a)} y={10} width={px(b) - px(a) - 1} height={18} style={{ fill: "var(--accent)" }} opacity={0.75} />)}
        {r.c.map(([a, b], i) => (
          <g key={`c${i}`}>
            <rect x={px(a)} y={38} width={px(b) - px(a) - 1} height={18} style={{ fill: "var(--text-muted)" }} opacity={0.7} />
            <text x={(px(a) + px(b)) / 2} y={50} textAnchor="middle" className="viz-label" style={{ fill: "var(--bg)", fontSize: 9 }}>{i + 1}</text>
          </g>
        ))}
        {[0, 40, 80, 120].map((v) => <text key={v} x={px(v)} y={76} textAnchor="middle" className="viz-label">{v} ms</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        forward {r.total} ms; up to {(r.peak - SHARDED_GB) / UNIT_GB} gathered unit{r.peak - SHARDED_GB > UNIT_GB ? "s" : ""}, {r.peak.toFixed(1)} GB of weights per GPU
      </div>
      <figcaption className="viz-caption">
        Each unit&apos;s weights must be all-gathered before it computes. Without prefetching the network and the GPU take turns.
        Allowing the next unit&apos;s gather to start while the current one computes hides most of it, at the cost of holding one more
        unit&apos;s full weights; a deeper prefetch helps only where a slow gather follows a quick one.
      </figcaption>
    </figure>
  );
}
