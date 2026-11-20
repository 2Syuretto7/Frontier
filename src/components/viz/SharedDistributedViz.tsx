"use client";

import { useState } from "react";

const N = 1e6, TOP = 1, TLOCK = 20, ALPHAS = [100, 1000, 10000], PS = [1, 2, 4, 8, 16, 32, 64];

/** Time in nanoseconds to sum N numbers on p workers by each strategy. */
export function sumTimes(p: number, alpha: number) {
  return {
    locked: N * (TOP + TLOCK),
    privateSums: Math.ceil(N / p) * TOP + p * TLOCK,
    messages: Math.ceil(N / p) * TOP + (p - 1) * alpha,
  };
}

export function bestMessageP(alpha: number) {
  let best = 1;
  for (let p = 1; p <= 64; p++) if (sumTimes(p, alpha).messages < sumTimes(best, alpha).messages) best = p;
  return best;
}

const SERIES = [
  { key: "locked", label: "one locked counter", color: "var(--danger)" },
  { key: "privateSums", label: "shared, private partial sums", color: "var(--success)" },
  { key: "messages", label: "distributed, messages to rank 0", color: "var(--accent)" },
] as const;

export function SharedDistributedViz() {
  const [ai, setAi] = useState(1);
  const alpha = ALPHAS[ai];
  const W = 330, H = 196, X0 = 48, Y0 = 8, PW = W - 58, PH = H - Y0 - 34, LMIN = 4, LMAX = 8;
  const sx = (p: number) => X0 + (Math.log2(p) / 6) * PW;
  const sy = (t: number) => Y0 + PH - ((Math.log10(t) - LMIN) / (LMAX - LMIN)) * PH;
  const bp = bestMessageP(alpha), bt = sumTimes(bp, alpha).messages;
  const us = (t: number) => (t >= 1e6 ? `${(t / 1e6).toFixed(0)} ms` : `${(t / 1e3).toFixed(0)} µs`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">message latency α</span>
        <div className="segmented" role="group" aria-label="Message latency">
          {ALPHAS.map((a, i) => <button key={a} type="button" className="seg" aria-pressed={ai === i} onClick={() => setAi(i)}>{a >= 1000 ? `${a / 1000} µs` : `${a} ns`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Time to sum a million numbers against the number of workers">
        {[4, 5, 6, 7, 8].map((l) => (
          <g key={l}>
            <line x1={X0} x2={X0 + PW} y1={sy(10 ** l)} y2={sy(10 ** l)} stroke="var(--border)" strokeDasharray={l > 4 ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(10 ** l) + 4} textAnchor="end" className="viz-label">{["10 µs", "100 µs", "1 ms", "10 ms", "100 ms"][l - 4]}</text>
          </g>
        ))}
        {SERIES.map((s) => (
          <g key={s.key}>
            <path d={PS.map((p, i) => `${i ? "L" : "M"}${sx(p).toFixed(1)},${sy(sumTimes(p, alpha)[s.key]).toFixed(1)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={1.8} />
            {PS.map((p) => <circle key={p} cx={sx(p)} cy={sy(sumTimes(p, alpha)[s.key])} r={2.5} fill={s.color} />)}
          </g>
        ))}
        {PS.map((p) => <text key={p} x={sx(p)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{p}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">workers p</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        {SERIES.map((s) => <span key={s.key}><span style={{ color: s.color }}>●</span> {s.label}</span>)}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`messages: best p = ${bp}, ${us(bt)}; private sums at p = 64: ${us(sumTimes(64, alpha).privateSums)}`}
      </div>
      <figcaption className="viz-caption">
        Summing a million numbers at 1 ns per addition. Threads that all add into one counter behind a lock (20 ns per
        acquisition) are serialised and take 21 ms however many there are. Threads that keep private partial sums and lock
        once each at the end speed up almost linearly. Processes with separate memories also sum privately, but rank 0 then
        receives p − 1 messages, each costing the latency α, so beyond some p adding workers makes the sum slower: at α = 1 µs
        the best is p = 32 at 62 µs, at α = 100 ns the curve still falls at p = 64, and at α = 10 µs it bottoms out at p = 10.
      </figcaption>
    </figure>
  );
}
