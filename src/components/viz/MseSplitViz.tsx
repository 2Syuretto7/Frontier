"use client";

import { useState } from "react";

/** Shrinking the sample mean to cX̄ trades squared bias (1 − c)²μ² for variance c²σ²/n; their sum, the MSE, is smallest at c = μ²/(μ² + σ²/n). */
export function MseSplitViz() {
  const [mu10, setMu10] = useState(5);
  const [n, setN] = useState(4);
  const mu = mu10 / 10;
  const cs = Array.from({ length: 241 }, (_, i) => (1.2 * i) / 240);
  const b2 = cs.map((c) => (1 - c) * (1 - c) * mu * mu);
  const vr = cs.map((c) => (c * c) / n);
  const ms = cs.map((_, i) => b2[i] + vr[i]);
  const cstar = (mu * mu) / (mu * mu + 1 / n);
  const mstar = (1 - cstar) * (1 - cstar) * mu * mu + (cstar * cstar) / n;
  const ymax = Math.max(1 / n, mu * mu, 0.05) * 1.6;
  const W = 330, H = 150;
  const X = (c: number) => 18 + (c / 1.2) * (W - 34);
  const Y = (y: number) => H - 16 - (Math.min(y, ymax) / ymax) * (H - 26);
  const line = (ys: number[]) => cs.map((c, i) => `${X(c).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          μ/σ = {mu.toFixed(1)}
          <input type="range" min={0} max={20} value={mu10} onChange={(e) => setMu10(Number(e.target.value))} aria-label="true mean over sigma" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={1} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Squared bias, variance and mean squared error of the shrunken mean as functions of c">
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.3} strokeDasharray="4 3" points={line(b2)} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.3} strokeDasharray="2 2" points={line(vr)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(ms)} />
        <line x1={X(0)} x2={X(1.2)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(1)} x2={X(1)} y1={10} y2={Y(0)} stroke="var(--border)" />
        <circle cx={X(cstar)} cy={Y(mstar)} r={3.5} fill="var(--accent)" />
        <text x={X(0)} y={H - 2} className="viz-label">c = 0</text>
        <text x={X(1)} y={H - 2} textAnchor="middle" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        best c = {cstar.toFixed(3)}, MSE {mstar.toFixed(4)} vs {(1 / n).toFixed(4)} at c = 1 (in units of σ²)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The estimator cX̄ of a normal mean μ has squared bias (1 − c)²μ² (danger dashes) and variance c²σ²/n (muted dashes).
        Their sum, the mean squared error (solid), is minimised at c = μ²/(μ² + σ²/n), marked by the dot, which is always
        below 1: a little shrinkage always helps. But the best c depends on the unknown μ, so it cannot be used directly.
      </figcaption>
    </figure>
  );
}
