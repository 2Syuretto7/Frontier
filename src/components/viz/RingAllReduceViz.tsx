"use client";

import { useState } from "react";

const P = 4;
const STEPS = 2 * (P - 1);

/** For each node and chunk, the set of nodes whose contributions it holds after `steps` steps of ring all-reduce. */
export function ringState(steps: number) {
  let have: number[][][] = Array.from({ length: P }, (_, i) => Array.from({ length: P }, () => [i]));
  const sends: [number, number][] = [];
  for (let s = 0; s < steps; s++) {
    const reduce = s < P - 1;
    const step = reduce ? s : s - (P - 1);
    const next = have.map((row) => row.map((c) => c.slice()));
    sends.length = 0;
    for (let i = 0; i < P; i++) {
      const k = reduce ? (((i - step) % P) + P) % P : (((i + 1 - step) % P) + P) % P;
      const dst = (i + 1) % P;
      next[dst][k] = reduce ? [...new Set([...have[dst][k], ...have[i][k]])].sort() : have[i][k].slice();
      sends.push([i, k]);
    }
    have = next;
  }
  return { have, sends: sends.slice() };
}

export function RingAllReduceViz() {
  const [s, setS] = useState(0);
  const { have, sends } = ringState(s);
  const cs = 30, X0 = 70, Y0 = 22, W = X0 + P * cs + 70, H = Y0 + P * (cs + 6) + 4;
  const phase = s === 0 ? "start: each node holds its own gradient" : s <= P - 1 ? `reduce-scatter, step ${s} of ${P - 1}` : `all-gather, step ${s - (P - 1)} of ${P - 1}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="ring-s">step: {s} of {STEPS}</label>
        <input id="ring-s" type="range" min={0} max={STEPS} step={1} value={s} onChange={(e) => setS(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Chunks held by four nodes during ring all-reduce">
        {Array.from({ length: P }, (_, k) => (
          <text key={k} x={X0 + k * cs + cs / 2} y={14} textAnchor="middle" className="viz-label" style={{ fontSize: 10 }}>{`chunk ${k}`}</text>
        ))}
        {have.map((row, i) => (
          <g key={i}>
            <text x={X0 - 6} y={Y0 + i * (cs + 6) + cs / 2 + 4} textAnchor="end" className="viz-label" style={{ fontSize: 10 }}>{`node ${i}`}</text>
            {row.map((c, k) => {
              const full = c.length === P;
              const sent = s > 0 && sends.some(([src, kk]) => (src + 1) % P === i && kk === k);
              return (
                <g key={k}>
                  <rect x={X0 + k * cs} y={Y0 + i * (cs + 6)} width={cs - 3} height={cs} rx={3}
                    fill={full ? "var(--accent)" : "var(--accent-soft)"} opacity={full ? 1 : 0.3 + (0.6 * c.length) / P}
                    stroke={sent ? "var(--danger)" : "var(--border)"} strokeWidth={sent ? 2 : 1} />
                  <text x={X0 + k * cs + (cs - 3) / 2} y={Y0 + i * (cs + 6) + cs / 2 + 4} textAnchor="middle" style={{ fontSize: 10, fill: full ? "var(--bg)" : "var(--text)" }}>{c.length}</text>
                </g>
              );
            })}
          </g>
        ))}
        <text x={X0 + P * cs + 10} y={Y0 + 10} className="viz-label" style={{ fontSize: 9 }}>each node</text>
        <text x={X0 + P * cs + 10} y={Y0 + 22} className="viz-label" style={{ fontSize: 9 }}>sends to</text>
        <text x={X0 + P * cs + 10} y={Y0 + 34} className="viz-label" style={{ fontSize: 9 }}>the next</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">{phase}</div>
      <figcaption className="viz-caption">
        Four nodes each hold a gradient split into four chunks; the number in a cell counts the nodes whose contributions
        it already includes, and a red border marks the chunk just received. In each step every node sends one chunk to
        its neighbour around the ring. After three reduce-scatter steps each node owns one fully summed chunk; three
        all-gather steps pass those around until every node has all four. Each node sends 6 chunks, 1.5 times its gradient;
        with p nodes it sends 2(p − 1)/p times its gradient, which stays below twice however many nodes join the ring.
      </figcaption>
    </figure>
  );
}
