"use client";

import { useState } from "react";

const LAMS = [1, 2.2, 3.5, 5, 6.2, 8];

/** Inverse iteration with shift σ multiplies the component along each eigenvector by 1/|λ − σ|; the eigenvalue nearest σ wins, at rate |λ_near − σ|/|λ_next − σ|. */
export function ShiftInvertViz() {
  const [k, setK] = useState(31);
  const sigma = k / 10;
  const amps = LAMS.map((l) => 1 / Math.max(Math.abs(l - sigma), 1e-9));
  const order = amps.map((a, i) => [a, i] as const).sort((a, b) => b[0] - a[0]);
  const best = order[0][1], second = order[1][1];
  const rate = order[1][0] / order[0][0];
  const powerRate = LAMS[LAMS.length - 2] / LAMS[LAMS.length - 1];
  const W = 330, H = 160;
  const X = (x: number) => 20 + (x / 9) * (W - 40);
  const amax = 4;
  const Y = (a: number) => H - 28 - (Math.min(Math.log10(a) + 1, amax) / amax) * (H - 44);
  const digitsPerStep = -Math.log10(rate);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          shift σ = {sigma.toFixed(1)}
          <input type="range" min={0} max={90} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="shift" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Amplification factors 1 over the distance from each eigenvalue to the shift">
        <line x1={X(0)} x2={X(9)} y1={H - 28} y2={H - 28} stroke="var(--border)" />
        {LAMS.map((l, i) => (
          <g key={i}>
            <rect x={X(l) - 6} y={Y(amps[i])} width={12} height={H - 28 - Y(amps[i])} fill={i === best ? "var(--accent)" : i === second ? "var(--text-muted)" : "var(--border)"} opacity={0.85} />
            <text x={X(l)} y={H - 16} textAnchor="middle" className="viz-label">{l}</text>
          </g>
        ))}
        <line x1={X(sigma)} x2={X(sigma)} y1={8} y2={H - 28} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(sigma)} y={H - 3} textAnchor="middle" className="viz-label">σ</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        converges to λ = {LAMS[best]} at rate {rate.toFixed(3)} per step ({digitsPerStep.toFixed(2)} digits per step); plain power
        iteration: rate {powerRate.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The ticks are the eigenvalues of a symmetric matrix and the bars the factors 1/|λ − σ| (log scale) by which one
        step of inverse iteration with shift σ (red dashed line) multiplies each eigenvector component. The tallest bar
        (accent) wins; the error shrinks each step by the ratio of the second tallest (grey) to the tallest. Plain power
        iteration can only find the largest eigenvalue, here at the slow rate 6.2/8. Move σ close to any eigenvalue and that
        eigenvalue is found in a handful of steps; Rayleigh quotient iteration moves σ to the current estimate every step.
      </figcaption>
    </figure>
  );
}
