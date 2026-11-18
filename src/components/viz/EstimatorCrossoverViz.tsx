"use client";

import { useState } from "react";

const SIGMAS = [0.5, 1, 2];
const MU = 0.3, KMAX = 5, LOGLO = -4, LOGHI = 2;

/** Exact variances of the one-sample pathwise and score-function estimates of d/dμ E sin(kX), X ~ N(μ, σ²). */
export function sinVariances(k: number, sigma: number) {
  const c2 = Math.cos(2 * k * MU), e2 = Math.exp(-2 * k * k * sigma * sigma);
  const g = k * Math.cos(k * MU) * Math.exp(-(k * k * sigma * sigma) / 2);
  return {
    path: k * k * 0.5 * (1 + c2 * e2) - g * g,
    score: (0.5 * (1 - c2 * e2 * (1 - 4 * k * k * sigma * sigma))) / (sigma * sigma) - g * g,
  };
}

/** Smallest k on a fine grid where the pathwise variance overtakes the score-function variance. */
export function crossover(sigma: number) {
  for (let k = 0.01; k <= KMAX; k += 0.005) {
    const v = sinVariances(k, sigma);
    if (v.path > v.score) return k;
  }
  return null;
}

export function EstimatorCrossoverViz() {
  const [sigma, setSigma] = useState(1);
  const W = 330, H = 160, X0 = 34, PW = W - 42, PH = 130;
  const sx = (k: number) => X0 + (k / KMAX) * PW;
  const sy = (v: number) => 10 + (1 - (Math.log10(Math.max(v, 1e-12)) - LOGLO) / (LOGHI - LOGLO)) * PH;
  const ks = Array.from({ length: 200 }, (_, i) => 0.025 + (KMAX * i) / 200);
  const cut = (v: number) => Math.min(Math.max(sy(v), 10), 10 + PH);
  const kx = crossover(sigma);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SIGMAS.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={s === sigma} onClick={() => setSigma(s)}>σ = {s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Variance of pathwise and score-function gradient estimates against the frequency of the integrand">
        {[-4, -2, 0, 2].map((e) => (
          <g key={e}>
            <line x1={X0} y1={sy(10 ** e)} x2={X0 + PW} y2={sy(10 ** e)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label">{e === 0 ? "1" : `1e${e}`}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={ks.map((k) => `${sx(k)},${cut(sinVariances(k, sigma).path)}`).join(" ")} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 3" points={ks.map((k) => `${sx(k)},${cut(sinVariances(k, sigma).score)}`).join(" ")} />
        {kx !== null && <line x1={sx(kx)} y1={10} x2={sx(kx)} y2={10 + PH} stroke="var(--danger)" strokeDasharray="2 2" />}
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">k = {KMAX}</text>
        <text x={X0} y={H + 12} className="viz-label">k = 0</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {kx !== null ? `pathwise is better for k below ${kx.toFixed(2)}, score function above` : "pathwise is better throughout"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Variances of the two one-sample estimates of the derivative in μ of E sin(kX), with X ~ N(0.3, σ²), on a log scale.
        Colour: pathwise, k cos(kX), whose variance grows like k² because it follows every wiggle of f. Dashed: score function,
        sin(kX)(X − μ)/σ², whose variance stays bounded because it only uses the size of f. Slowly varying integrands favour
        the pathwise estimate by orders of magnitude; rapidly oscillating ones favour the score function.
      </figcaption>
    </figure>
  );
}
