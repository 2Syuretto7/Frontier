"use client";

import { useState } from "react";

/** How the pseudoinverse, truncated SVD and ridge regression treat each singular value σ: the factor multiplying uᵀb. */
export function FilterFactorViz() {
  const [e10, setE10] = useState(-10);
  const lam = Math.exp((e10 / 10) * Math.LN10); // λ = 10^(e10/10), computed without **
  const tau = Math.sqrt(lam);
  const W = 320, H = 170;
  const lo = -2, hi = 1; // log10 σ from 0.01 to 10
  const X = (l: number) => 34 + ((l - lo) / (hi - lo)) * (W - 44);
  const ymax = 12;
  const Y = (v: number) => H - 22 - (Math.min(v, ymax) / ymax) * (H - 34);
  const curve = (f: (s: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 150; i++) {
      const l = lo + ((hi - lo) * i) / 150;
      const s = Math.exp(l * Math.LN10);
      pts.push(`${X(l).toFixed(1)},${Y(f(s)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          λ = {lam.toPrecision(2)} (cut-off τ = √λ = {tau.toPrecision(2)})
          <input type="range" min={-40} max={10} value={e10} onChange={(e) => setE10(Number(e.target.value))} aria-label="regularisation strength" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Filter factors against the singular value">
        <line x1={34} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {[-2, -1, 0, 1].map((l) => (
          <text key={l} x={X(l)} y={H - 6} textAnchor="middle" className="viz-label">σ={["0.01", "0.1", "1", "10"][l + 2]}</text>
        ))}
        <text x={30} y={Y(10) + 4} textAnchor="end" className="viz-label">10</text>
        <text x={30} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" points={curve((s) => 1 / s)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.6} points={curve((s) => (s > tau ? 1 / s : 0))} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve((s) => s / (s * s + lam))} />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Each method solves Ax ≈ b by multiplying the coordinate uⱼᵀb by a factor depending on σⱼ, then adding the vⱼ. The
        pseudoinverse uses 1/σ (dashed), which explodes for tiny σ, so noise along weak directions is amplified enormously.
        Truncation (red) keeps 1/σ above the cut-off τ and drops the rest. Ridge (blue) uses σ/(σ² + λ): almost 1/σ for large
        σ, almost σ/λ for small σ, a smooth version of truncation peaking at σ = √λ. As λ → 0 both tend to the pseudoinverse.
      </figcaption>
    </figure>
  );
}
