"use client";

import { useState } from "react";

/** sin of the eigenvector rotation for A = diag(1 + g, 1) perturbed by ε[[0, 1], [1, 0]], against the Davis–Kahan bound ε/(g − ε). */
export function DavisKahanViz() {
  const [g100, setG100] = useState(50);
  const g = g100 / 100;
  const W = 320, H = 170, EMAX = 0.5;
  const X = (e: number) => 34 + (e / EMAX) * (W - 44);
  const Y = (v: number) => H - 22 - Math.min(v, 1) * (H - 34);
  const actual = (e: number) => Math.sin(0.5 * Math.atan2(2 * e, g));
  const bound = (e: number) => (e < g ? e / (g - e) : Infinity);
  const line = (f: (e: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const e = (EMAX * i) / 120, v = f(e);
      if (!Number.isFinite(v) || v > 1.05) break;
      pts.push(`${X(e).toFixed(1)},${Y(v).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const e0 = 0.1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          eigenvalue gap g = {g.toFixed(2)}
          <input type="range" min={2} max={200} value={g100} onChange={(e) => setG100(Number(e.target.value))} aria-label="eigenvalue gap" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Eigenvector rotation against perturbation size">
        <line x1={34} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={34} x2={34} y1={Y(1)} y2={Y(0)} stroke="var(--border)" />
        <text x={30} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={30} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X(EMAX)} y={H - 6} textAnchor="end" className="viz-label">‖E‖ = 0.5</text>
        <polyline fill="none" stroke="var(--danger)" strokeDasharray="5 3" strokeWidth={1.6} points={line(bound)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(actual)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        at ‖E‖ = 0.1: sin θ = {actual(e0).toFixed(3)}, bound {Number.isFinite(bound(e0)) ? bound(e0).toFixed(3) : "none (‖E‖ ≥ gap)"}; eigenvalues move by at most 0.1
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A = diag(1 + g, 1) plus E = ε[[0, 1], [1, 0]], with ‖E‖ = ε on the horizontal axis. Blue: the sine of the angle the
        top eigenvector turns through. Red dashed: the bound ‖E‖/(g − ‖E‖), valid while ‖E‖ &lt; g. Eigenvalues always move
        by at most ‖E‖ (Weyl), but eigenvectors are only as stable as the gap: shrink g and a tiny perturbation spins the
        eigenvector by 45°.
      </figcaption>
    </figure>
  );
}
