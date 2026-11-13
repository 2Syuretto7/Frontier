"use client";

import { useState } from "react";

const LO = 1.3, HI = 1.5;

/** Rationals with small denominators near √2, split into the cut {q : q < 0 or q² < 2} and its complement: the gap narrows but no rational fills it. */
export function DedekindCutViz() {
  const [N, setN] = useState(12);
  const pts: { p: number; q: number; v: number; inCut: boolean }[] = [];
  let bestIn = { p: 0, q: 1, v: 0 }, bestOut = { p: 3, q: 2, v: 1.5 };
  for (let q = 1; q <= N; q++) {
    for (let p = Math.ceil(LO * q); p <= Math.floor(HI * q); p++) {
      let g = p, h = q;
      while (h) { const t = g % h; g = h; h = t; }
      if (g !== 1) continue;
      const inCut = p * p < 2 * q * q;
      const v = p / q;
      pts.push({ p, q, v, inCut });
      if (inCut && v > bestIn.v) bestIn = { p, q, v };
      if (!inCut && v < bestOut.v) bestOut = { p, q, v };
    }
  }
  const W = 330, H = 150;
  const X = (v: number) => 12 + ((v - LO) / (HI - LO)) * (W - 24);
  const Y = (q: number) => H - 30 - ((q - 1) / Math.max(1, N - 1)) * (H - 50);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          denominators up to {N}
          <input type="range" min={2} max={60} value={N} onChange={(e) => setN(Number(e.target.value))} aria-label="largest denominator" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Rationals near the square root of two, coloured by side of the cut">
        <line x1={12} x2={W - 12} y1={H - 22} y2={H - 22} stroke="var(--border)" />
        <line x1={X(Math.SQRT2)} x2={X(Math.SQRT2)} y1={8} y2={H - 22} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {pts.map((d, i) => (
          <circle key={i} cx={X(d.v)} cy={Y(d.q)} r={2.4} fill={d.inCut ? "var(--accent)" : "var(--danger)"} />
        ))}
        {[1.3, 1.35, 1.4, 1.45, 1.5].map((t) => <text key={t} x={X(t)} y={H - 8} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X(Math.SQRT2) + 4} y={14} className="viz-label">√2</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        largest in cut {bestIn.p}/{bestIn.q}, smallest outside {bestOut.p}/{bestOut.q}, gap {(bestOut.v - bestIn.v).toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each dot is a fraction p/q in lowest terms, placed by value and raised by its denominator. Dots in the accent colour satisfy p² &lt; 2q²
        and belong to the cut; red dots do not. Allow larger denominators and both colours crowd towards the dashed line,
        but no dot ever lands on it, because no fraction squares to exactly 2. The cut itself is the new number.
      </figcaption>
    </figure>
  );
}
