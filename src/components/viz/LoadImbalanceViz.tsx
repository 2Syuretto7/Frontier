"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const R = 8, E = 32, PER = E / R, TOKENS = 4096, K = 4;

/** Slots per expert for one batch routed top-4 over 32 experts with Zipf-like popularity, seeded so the picture is stable. */
export function expertCounts() {
  const rng = rand(3);
  const w = Array.from({ length: E }, (_, e) => 1 / Math.pow(1 + ((e * 7) % E), 0.6));
  const tot = w.reduce((a, b) => a + b, 0);
  const counts = Array(E).fill(0);
  for (let t = 0; t < TOKENS; t++) {
    const picked = new Set<number>();
    while (picked.size < K) {
      let u = rng() * tot, e = 0;
      while (u > w[e]) { u -= w[e]; e++; }
      picked.add(Math.min(e, E - 1));
    }
    picked.forEach((e) => counts[e]++);
  }
  return counts;
}

function lpt(loads: number[]) {
  const place = Array(loads.length).fill(0), total = Array(R).fill(0), slots = Array(R).fill(PER);
  [...loads.keys()].sort((a, b) => loads[b] - loads[a] || a - b).forEach((e) => {
    let r = -1;
    for (let x = 0; x < R; x++) if (slots[x] && (r < 0 || total[x] < total[r])) r = x;
    place[e] = r; total[r] += loads[e]; slots[r]--;
  });
  return total;
}

/** Rank loads under three policies: experts placed in order, placed heaviest-first, and with 8 replicas of the hottest experts. */
export function policyLoads(policy: number, counts: number[]) {
  if (policy === 0) return Array.from({ length: R }, (_, r) => counts.slice(r * PER, (r + 1) * PER).reduce((a, b) => a + b, 0));
  if (policy === 1) return lpt(counts);
  const copies = Array(E).fill(1);
  for (let i = 0; i < R; i++) {
    let best = 0;
    for (let e = 1; e < E; e++) if (counts[e] / copies[e] > counts[best] / copies[best]) best = e;
    copies[best]++;
  }
  const reps = counts.flatMap((c, e) => Array(copies[e]).fill(c / copies[e]));
  const place = Array(reps.length).fill(0), total = Array(R).fill(0), slots = Array(R).fill(reps.length / R);
  [...reps.keys()].sort((a, b) => reps[b] - reps[a] || a - b).forEach((e) => {
    let r = -1;
    for (let x = 0; x < R; x++) if (slots[x] && (r < 0 || total[x] < total[r])) r = x;
    place[e] = r; total[r] += reps[e]; slots[r]--;
  });
  return total;
}

const POLICIES = ["in order", "heaviest first", "+ 8 replicas"];

export function LoadImbalanceViz() {
  const [pi, setPi] = useState(0);
  const counts = expertCounts();
  const loads = policyLoads(pi, counts);
  const mean = loads.reduce((a, b) => a + b, 0) / R;
  const top = Math.max(...policyLoads(0, counts));
  const W = 330, X0 = 24, BW = 32, H = 120, Y1 = 10;
  const y = (v: number) => Y1 + H - (v / top) * H;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Expert placement">
          {POLICIES.map((p, j) => <button key={p} type="button" className="seg" aria-pressed={pi === j} onClick={() => setPi(j)}>{p}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y1 + H + 22}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Token slots received by each of eight ranks">
        {loads.map((v, r) => (
          <g key={r}>
            <rect x={X0 + r * BW} y={y(v)} width={BW - 6} height={Y1 + H - y(v)} style={{ fill: v === Math.max(...loads) ? "var(--accent)" : "var(--text-muted)" }} opacity={0.8} />
            <text x={X0 + r * BW + (BW - 6) / 2} y={Y1 + H + 14} textAnchor="middle" className="viz-label">{r}</text>
          </g>
        ))}
        <line x1={X0 - 4} x2={X0 + R * BW} y1={y(mean)} y2={y(mean)} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={X0 + R * BW + 2} y={y(mean) + 4} className="viz-label">mean</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        busiest rank {Math.round(Math.max(...loads))} slots, mean {Math.round(mean)}; the layer runs at {(mean / Math.max(...loads) * 100).toFixed(0)}% of balanced speed
      </div>
      <figcaption className="viz-caption">
        4096 tokens routed top-4 over 32 experts whose popularity falls off unevenly, on 8 ranks with 4 experts each. Placing experts
        in index order lets popular ones collide on one rank. Placing the heaviest first on the least-loaded rank evens the totals, and
        replicating the hottest experts splits their load, so the busiest rank, which sets the step time, comes close to the mean.
      </figcaption>
    </figure>
  );
}
