"use client";

import { useState } from "react";

function erf(x: number) {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
const ALPHAS: [number, number][] = [[0.01, 2.576], [0.05, 1.96], [0.1, 1.645]];

/** The power function of the two-sided z-test of μ = 0: the probability of rejecting, as a function of the true mean in units of σ. */
export function PowerCurveViz() {
  const [n, setN] = useState(25);
  const [ai, setAi] = useState(1);
  const [alpha, z] = ALPHAS[ai];
  const power = (d: number) => Phi(-z + Math.sqrt(n) * d) + Phi(-z - Math.sqrt(n) * d);
  const ds = Array.from({ length: 241 }, (_, i) => -1.5 + (3 * i) / 240);
  const W = 330, H = 150;
  const X = (d: number) => 16 + ((d + 1.5) / 3) * (W - 32);
  const Y = (y: number) => H - 16 - y * (H - 26);
  let half = 0;
  while (half < 3 && power(half) < 0.8) half += 0.001;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={1} max={200} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 120 }} />
        </label>
        {ALPHAS.map(([a], i) => (
          <button key={a} type="button" className="seg" aria-pressed={ai === i} onClick={() => setAi(i)}>α = {a}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Power of the z-test as a function of the true mean">
        <line x1={X(-1.5)} x2={X(1.5)} y1={Y(0.8)} y2={Y(0.8)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <line x1={X(-1.5)} x2={X(1.5)} y1={Y(alpha)} y2={Y(alpha)} stroke="var(--danger)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={ds.map((d) => `${X(d).toFixed(1)},${Y(power(d)).toFixed(1)}`).join(" ")} />
        <line x1={X(-1.5)} x2={X(1.5)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={Y(1)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(-1.5)} y={H - 2} className="viz-label">μ/σ = −1.5</text>
        <text x={X(1.5)} y={H - 2} textAnchor="end" className="viz-label">1.5</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        power at μ = 0 is α = {alpha}; power reaches 0.8 at |μ|/σ ≈ {half.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the probability that the test rejects μ = 0, as a function of the true μ. At μ = 0 it equals the size
        α (danger line): the false alarm rate. Away from 0 it rises towards 1. More data steepens the curve, so smaller
        effects reach 80% power (muted line); a smaller α lowers the whole curve, trading false alarms for missed effects.
      </figcaption>
    </figure>
  );
}
