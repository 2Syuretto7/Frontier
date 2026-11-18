"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const SNRS = [0.03, 0.1, 0.3, 1, 3, 10, 30];
const STEPS = 4000, BURN = 1000;

/** Mean and standard deviation of Adam's normalised step m̂/√v̂ for i.i.d. gradients with mean snr and unit variance. */
export function adamStepStats(snr: number, b1: number, b2 = 0.999) {
  const normal = makeNormal(makeRng(11));
  let m = 0, v = 0, s = 0, s2 = 0;
  for (let t = 1; t <= STEPS; t++) {
    const g = snr + normal();
    m = b1 * m + (1 - b1) * g;
    v = b2 * v + (1 - b2) * g * g;
    const r = m / (1 - b1 ** t) / Math.sqrt(v / (1 - b2 ** t));
    if (t > BURN) { s += r; s2 += r * r; }
  }
  const n = STEPS - BURN, mean = s / n;
  return { mean, sd: Math.sqrt(Math.max(0, s2 / n - mean * mean)) };
}

export function AdamSnrViz() {
  const [b1, setB1] = useState(0.9);
  const stats = useMemo(() => SNRS.map((q) => ({ q, ...adamStepStats(q, b1) })), [b1]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const lx0 = Math.log10(0.02), lx1 = Math.log10(50);
  const sx = (q: number) => X0 + ((Math.log10(q) - lx0) / (lx1 - lx0)) * PW;
  const sy = (r: number) => 8 + (1 - (Math.min(1.5, Math.max(-0.5, r)) + 0.5) / 2) * PH;
  const curve = Array.from({ length: 61 }, (_, i) => 0.02 * 2500 ** (i / 60));
  const mid = stats[3];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">momentum β₁</span>
        {[0, 0.9, 0.99].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={b1 === v} onClick={() => setB1(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Mean and spread of Adam's step against the gradient's signal-to-noise ratio">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(1)} x2={X0 + PW} y2={sy(1)} stroke="var(--border)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve.map((q) => `${sx(q)},${sy(q / Math.sqrt(q * q + 1))}`).join(" ")} />
        {stats.map((s) => (
          <g key={s.q}>
            <line x1={sx(s.q)} y1={sy(s.mean - s.sd)} x2={sx(s.q)} y2={sy(s.mean + s.sd)} stroke="var(--danger)" strokeWidth={1.5} />
            <circle cx={sx(s.q)} cy={sy(s.mean)} r={3.5} fill="var(--text)" />
          </g>
        ))}
        {[0.03, 0.3, 3, 30].map((q) => (
          <text key={q} x={sx(q)} y={H + 12} textAnchor="middle" className="viz-label">{q}</text>
        ))}
        {[-0.5, 0, 0.5, 1, 1.5].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`SNR 1: step ${mid.mean.toFixed(3)} ± ${mid.sd.toFixed(3)} (theory ${(1 / Math.SQRT2).toFixed(3)} ± ${(Math.sqrt((1 - b1) / (1 + b1)) / Math.SQRT2).toFixed(3)})`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Adam&apos;s step m̂/√v̂, in units of η, for gradients with mean μ and standard deviation σ, against the signal-to-noise
        ratio μ/σ (log scale). Dots are the mean over 3000 steps, red bars one standard deviation, and the blue curve is
        μ/√(μ² + σ²). With a clean signal the step is η in the direction of the gradient; with a noisy one it shrinks in
        proportion to the SNR. Momentum leaves the mean alone and narrows the spread by √((1 − β₁)/(1 + β₁)).
      </figcaption>
    </figure>
  );
}
