"use client";

import { useState } from "react";

const FAMS = {
  bernoulli: { A: (e: number) => Math.log1p(Math.exp(e)), d1: (e: number) => 1 / (1 + Math.exp(-e)), d2: (e: number) => { const p = 1 / (1 + Math.exp(-e)); return p * (1 - p); }, ymax: 3.2, label: "A(η) = log(1 + e^η)", mean: "p" },
  poisson: { A: (e: number) => Math.exp(e), d1: (e: number) => Math.exp(e), d2: (e: number) => Math.exp(e), ymax: 21, label: "A(η) = e^η", mean: "λ" },
};
type Fam = keyof typeof FAMS;

/** The log-partition function A(η) of an exponential family: its slope at η is the mean of T and its curvature the variance. */
export function ExpFamilyViz() {
  const [fam, setFam] = useState<Fam>("bernoulli");
  const [e10, setE10] = useState(5);
  const eta = e10 / 10;
  const F = FAMS[fam];
  const W = 330, H = 150;
  const X = (e: number) => 16 + ((e + 3) / 6) * (W - 32);
  const Y = (y: number) => H - 16 - (y / F.ymax) * (H - 26);
  const es = Array.from({ length: 241 }, (_, i) => -3 + (6 * i) / 240);
  const a0 = F.A(eta), s = F.d1(eta);
  const tx0 = Math.max(-3, eta - 1.2), tx1 = Math.min(3, eta + 1.2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {(Object.keys(FAMS) as Fam[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={fam === k} onClick={() => setFam(k)}>{k}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          η = {eta.toFixed(1)}
          <input type="range" min={-30} max={30} value={e10} onChange={(e) => setE10(Number(e.target.value))} aria-label="natural parameter" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Log-partition function with its tangent line">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={es.map((e) => `${X(e).toFixed(1)},${Y(F.A(e)).toFixed(1)}`).join(" ")} />
        <line x1={X(tx0)} y1={Y(a0 + s * (tx0 - eta))} x2={X(tx1)} y2={Y(a0 + s * (tx1 - eta))} stroke="var(--danger)" strokeWidth={1.4} />
        <circle cx={X(eta)} cy={Y(a0)} r={3.5} fill="var(--danger)" />
        <line x1={X(-3)} x2={X(3)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(-3)} y={H - 2} className="viz-label">η = −3</text>
        <text x={X(3)} y={H - 2} textAnchor="end" className="viz-label">3</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {F.label}; slope A′ = E[T] = {F.mean} = {s.toFixed(4)}; curvature A″ = Var T = {F.d2(eta).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the log-partition function A(η), which makes the density integrate to 1. Its slope at η (the tangent
        line) is the mean of the sufficient statistic, and its curvature is the variance. A is convex, so the slope only
        increases: each mean corresponds to exactly one η, which is why the maximum likelihood equation A′(η) = T̄ has a
        unique solution.
      </figcaption>
    </figure>
  );
}
