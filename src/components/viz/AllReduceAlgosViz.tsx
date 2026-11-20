"use client";

import { useState } from "react";

const ALPHA = 5e-6, BETA = 5e10, PS = [8, 64, 512], SIZES = [1e3, 1e6, 1e9];

/** All-reduce time in seconds for n bytes on p ranks by three algorithms. */
export function allReduceTimes(p: number, n: number) {
  const L = Math.log2(p);
  return {
    ring: 2 * (p - 1) * ALPHA + (2 * (p - 1) / p) * (n / BETA),
    doubling: L * (ALPHA + n / BETA),
    halving: 2 * L * ALPHA + (2 * (p - 1) / p) * (n / BETA),
  };
}

const SERIES = [
  { key: "ring", label: "ring", color: "var(--accent)" },
  { key: "doubling", label: "recursive doubling", color: "var(--danger)" },
  { key: "halving", label: "halving-doubling", color: "var(--success)" },
] as const;

const fmt = (t: number) => (t >= 1e-3 ? `${(t * 1e3).toFixed(t >= 1e-2 ? 1 : 2)} ms` : `${(t * 1e6).toFixed(0)} µs`);
const fmtB = (n: number) => (n >= 1e9 ? "1 GB" : n >= 1e6 ? "1 MB" : "1 KB");

export function AllReduceAlgosViz() {
  const [pi, setPi] = useState(1), [si, setSi] = useState(1);
  const p = PS[pi], n = SIZES[si], t = allReduceTimes(p, n);
  const W = 330, H = 190, X0 = 44, Y0 = 8, PW = W - 52, PH = H - Y0 - 34, XMIN = 3, XMAX = 9, YMIN = -5, YMAX = 0;
  const sx = (b: number) => X0 + ((Math.log10(b) - XMIN) / (XMAX - XMIN)) * PW;
  const sy = (s: number) => Y0 + PH - ((Math.min(YMAX, Math.max(YMIN, Math.log10(s))) - YMIN) / (YMAX - YMIN)) * PH;
  const grid = Array.from({ length: 61 }, (_, i) => 10 ** (XMIN + ((XMAX - XMIN) * i) / 60));
  const best = SERIES.reduce((a, s) => (t[s.key] < t[a.key] ? s : a));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">ranks</span>
        <div className="segmented" role="group" aria-label="Number of ranks">
          {PS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{x}</button>)}
        </div>
        <span className="viz-label">message</span>
        <div className="segmented" role="group" aria-label="Message size">
          {SIZES.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{fmtB(x)}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="All-reduce time against message size for three algorithms">
        {[-5, -4, -3, -2, -1, 0].map((l) => (
          <g key={l}>
            <line x1={X0} x2={X0 + PW} y1={sy(10 ** l)} y2={sy(10 ** l)} stroke="var(--border)" strokeDasharray={l > -5 ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(10 ** l) + 4} textAnchor="end" className="viz-label">{["10 µs", "100 µs", "1 ms", "10 ms", "100 ms", "1 s"][l + 5]}</text>
          </g>
        ))}
        {SERIES.map((s) => <path key={s.key} d={grid.map((b, i) => `${i ? "L" : "M"}${sx(b).toFixed(1)},${sy(allReduceTimes(p, b)[s.key]).toFixed(1)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={1.8} />)}
        <line x1={sx(n)} x2={sx(n)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {[3, 6, 9].map((l) => <text key={l} x={sx(10 ** l)} y={Y0 + PH + 14} textAnchor={l === 3 ? "start" : l === 9 ? "end" : "middle"} className="viz-label">{["1 KB", "1 MB", "1 GB"][l / 3 - 1]}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">message size</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        {SERIES.map((s) => <span key={s.key}><span style={{ color: s.color }}>●</span> {s.label}</span>)}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${fmtB(n)} on ${p} ranks: ring ${fmt(t.ring)}, doubling ${fmt(t.doubling)}, halving-doubling ${fmt(t.halving)}; fastest ${best.label}`}
      </div>
      <figcaption className="viz-caption">
        All-reduce with latency α = 5 µs and bandwidth β = 50 GB/s per link. Recursive doubling exchanges whole vectors in log₂ p
        rounds: few latencies, but the full message log₂ p times. The ring sends the bandwidth-optimal 2(p − 1)/p of the
        message but pays 2(p − 1) latencies, so on 512 ranks a 1 KB all-reduce takes 5.1 ms by ring and 45 µs by doubling.
        Recursive halving and doubling combines the bandwidth term of the ring with 2 log₂ p latencies, and in every case here it is within a
        factor of two of the fastest of the three, and the fastest itself for messages of 1 MB and more.
      </figcaption>
    </figure>
  );
}
