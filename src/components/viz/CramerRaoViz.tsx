"use client";

import { useState } from "react";

/** Efficiency (Cramér-Rao bound divided by variance) of two unbiased estimators of P(X = 0) = e^(−λ) from n Poisson observations. */
export function CramerRaoViz() {
  const [lam10, setLam10] = useState(10);
  const [n, setN] = useState(10);
  const lam = lam10 / 10;
  const NMAX = 60;
  const bound = (m: number) => (lam * Math.exp(-2 * lam)) / m;
  const vRb = (m: number) => Math.exp(-2 * lam) * (Math.exp(lam / m) - 1);
  const vCrude = Math.exp(-lam) * (1 - Math.exp(-lam));
  const effRb = (m: number) => bound(m) / vRb(m);
  const effCrude = (m: number) => bound(m) / vCrude;
  const ns = Array.from({ length: NMAX }, (_, i) => i + 1);
  const W = 330, H = 150;
  const X = (m: number) => 18 + ((m - 1) / (NMAX - 1)) * (W - 34);
  const Y = (y: number) => H - 16 - Math.min(y, 1.05) / 1.05 * (H - 26);
  const pts = (f: (m: number) => number) => ns.map((m) => `${X(m).toFixed(1)},${Y(f(m)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {lam.toFixed(1)}
          <input type="range" min={2} max={50} value={lam10} onChange={(e) => setLam10(Number(e.target.value))} aria-label="Poisson rate" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={1} max={NMAX} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Efficiency of two unbiased estimators against sample size">
        <line x1={X(1)} x2={X(NMAX)} y1={Y(1)} y2={Y(1)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <line x1={X(1)} x2={X(NMAX)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={pts(effRb)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.6} points={pts(effCrude)} />
        <line x1={X(n)} x2={X(n)} y1={10} y2={Y(0)} stroke="var(--border)" />
        <text x={X(1)} y={H - 2} className="viz-label">n = 1</text>
        <text x={X(NMAX)} y={H - 2} textAnchor="end" className="viz-label">{NMAX}</text>
        <text x={X(NMAX)} y={Y(1) - 4} textAnchor="end" className="viz-label">bound attained</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        at n = {n}: bound {bound(n).toExponential(2)}; efficiency ((n − 1)/n)^T {effRb(n).toFixed(3)}, crude {effCrude(n).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both estimators of e^(−λ) are unbiased, so neither variance can fall below the Cramér-Rao bound λe^(−2λ)/n. The
        curves show bound divided by variance. The crude indicator 1(X₁ = 0) (danger) ignores all but one observation and
        its efficiency falls like 1/n. The Rao-Blackwellised estimator (accent) is the best unbiased estimator here, yet it
        still falls short of the bound for small n, reaching it only as n grows.
      </figcaption>
    </figure>
  );
}
