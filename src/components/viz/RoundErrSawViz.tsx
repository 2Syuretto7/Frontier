"use client";

import { useState } from "react";

/** Relative rounding error |fl(x) − x|/|x| for round-to-nearest with p fraction bits, over [1, 16]: a sawtooth that never exceeds the unit roundoff u = 2^−(p+1), largest just above each power of two. */
export function RoundErrSawViz() {
  const [p, setP] = useState(3);
  const lo = 1, hi = 16;
  const fl = (x: number) => {
    const e = Math.floor(Math.log2(x));
    const q = 2 ** (e - p);
    const r = x / q;
    const f = Math.floor(r), d = r - f;
    const n = d > 0.5 || (d === 0.5 && f % 2 === 1) ? f + 1 : f;
    return n * q;
  };
  const u = 2 ** -(p + 1);
  const N = 1600;
  const xs = Array.from({ length: N + 1 }, (_, i) => lo * (hi / lo) ** (i / N));
  const errs = xs.map((x) => Math.abs(fl(x) - x) / x);
  const W = 330, H = 160;
  const X = (x: number) => 30 + (Math.log2(x / lo) / Math.log2(hi / lo)) * (W - 42);
  const Y = (v: number) => H - 18 - (v / (u * 1.15)) * (H - 30);
  const worst = Math.max(...errs);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          fraction bits p = {p}
          <input type="range" min={1} max={8} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="fraction bits" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Relative rounding error against x on a log axis, bounded by the unit roundoff">
        <line x1={30} x2={W - 12} y1={Y(u)} y2={Y(u)} stroke="var(--danger)" strokeDasharray="4 3" />
        <text x={W - 12} y={Y(u) - 4} textAnchor="end" className="viz-label">u = 2^−{p + 1}</text>
        <line x1={30} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.1} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(errs[i]).toFixed(1)}`).join(" ")} />
        {[1, 2, 4, 8, 16].map((t) => (
          <text key={t} x={X(t)} y={H - 4} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        largest relative error on the grid {worst.toExponential(3)}; u = {u.toExponential(3)}; ε = 2u = {(2 * u).toExponential(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The horizontal axis is logarithmic from 1 to 16. Within each binade the absolute error is at most half the spacing
        2^(e−p), a fixed amount, so the relative error is a sawtooth that shrinks across the binade and jumps back up just
        after each power of two, where the spacing doubles. Its peaks approach u = 2^−(p+1) but never exceed it, which is the
        whole content of the standard model fl(x) = x(1 + δ), |δ| ≤ u. Each extra fraction bit halves u.
      </figcaption>
    </figure>
  );
}
