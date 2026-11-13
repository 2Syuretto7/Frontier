"use client";

import { useState } from "react";

/** The possible values of P(A₁ ∪ … ∪ Aₙ) when each P(Aᵢ) = p: from p (all equal) to min(1, np) (disjoint), with the independent case marked. */
export function UnionRangeViz() {
  const [n, setN] = useState(5);
  const [pc, setPc] = useState(10);
  const p = pc / 100;
  const lo = p, hi = Math.min(1, n * p);
  let q = 1;
  for (let i = 0; i < n; i++) q *= 1 - p;
  const ind = 1 - q;
  const W = 320;
  const X = (v: number) => 20 + v * (W - 40);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={1} max={20} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of events" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          p = {p.toFixed(2)}
          <input type="range" min={1} max={50} value={pc} onChange={(e) => setPc(Number(e.target.value))} aria-label="probability of each event" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} 90`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Range of possible probabilities of a union">
        <line x1={X(0)} x2={X(1)} y1={40} y2={40} stroke="var(--border)" strokeWidth={2} />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={36} y2={44} stroke="var(--border)" />
            <text x={X(t)} y={60} textAnchor="middle" className="viz-label">{t}</text>
          </g>
        ))}
        <rect x={X(lo)} y={32} width={Math.max(2, X(hi) - X(lo))} height={16} fill="var(--accent)" opacity={0.3} />
        <line x1={X(ind)} x2={X(ind)} y1={24} y2={56} stroke="var(--danger)" strokeWidth={2.5} />
        <text x={X(ind)} y={18} textAnchor="middle" className="viz-label" style={{ fill: "var(--danger)" }}>independent</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        possible: [{lo.toFixed(3)}, {hi.toFixed(3)}]; independent: {ind.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        n events, each of probability p. The axioms alone pin the probability of their union only to an interval: at least p,
        reached when the events coincide, and at most min(1, np), the union bound, reached when they are disjoint (if np ≤
        1). Independence picks one point, 1 − (1 − p)ⁿ, which is close to np when np is small and far below it when np is
        large.
      </figcaption>
    </figure>
  );
}
