"use client";

import { useState } from "react";

/** Operation counts for solving (D + UUᵀ)x = b directly (≈ n³/3) and by Woodbury (≈ 2nk² + k³/3), on log scales. */
export function WoodburyCostViz() {
  const [k, setK] = useState(20);
  const W = 320, H = 180;
  const lo = 1, hi = 6; // log10 n from 10 to 1e6
  const ylo = 0, yhi = 18;
  const X = (l: number) => 40 + ((l - lo) / (hi - lo)) * (W - 50);
  const Y = (l: number) => H - 22 - ((Math.min(yhi, Math.max(ylo, l)) - ylo) / (yhi - ylo)) * (H - 34);
  const direct = (n: number) => (n * n * n) / 3;
  const wood = (n: number) => 2 * n * k * k + (k * k * k) / 3;
  const curve = (f: (n: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const l = lo + ((hi - lo) * i) / 100;
      const n = Math.exp(l * Math.LN10);
      pts.push(`${X(l).toFixed(1)},${Y(Math.log10(f(n))).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const n0 = 100000;
  const ratio = direct(n0) / wood(n0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          rank k = {k}
          <input type="range" min={1} max={500} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="rank of the low-rank part" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Cost of direct and Woodbury solves against matrix size">
        {[0, 6, 12, 18].map((e) => (
          <g key={e}>
            <line x1={40} x2={W - 10} y1={Y(e)} y2={Y(e)} stroke="var(--border)" />
            <text x={36} y={Y(e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[1, 2, 3, 4, 5, 6].map((e) => <text key={e} x={X(e)} y={H - 6} textAnchor="middle" className="viz-label">n=1e{e}</text>)}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve(direct)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(wood)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        at n = 100,000: Woodbury is about {ratio >= 1e6 ? `${(ratio / 1e6).toFixed(0)} million` : ratio.toFixed(0)} times cheaper
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Red: a dense solve with an n×n matrix, about n³/3 operations. Blue: the Woodbury route for diagonal plus rank k,
        about 2nk² for the products plus k³/3 for a k×k solve. The Woodbury cost grows only linearly in n, so for large n and
        modest k the difference is many orders of magnitude, and the n×n matrix never has to be stored.
      </figcaption>
    </figure>
  );
}
