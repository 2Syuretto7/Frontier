"use client";

import { useState } from "react";

/** The expected log-likelihood of one Bernoulli observation, as a function of the guess q when the truth is p: its curvature at the peak is the Fisher information 1/(p(1 − p)). */
export function FisherCurvViz() {
  const [p100, setP100] = useState(50);
  const p = p100 / 100;
  const I = 1 / (p * (1 - p));
  const K = (q: number) => p * Math.log(q) + (1 - p) * Math.log(1 - q);
  const top = K(p);
  const qs = Array.from({ length: 197 }, (_, i) => 0.01 + (0.98 * i) / 196);
  const ymin = -1.2;
  const W = 330, H = 150;
  const X = (q: number) => 16 + q * (W - 32);
  const Y = (y: number) => 10 + (Math.max(y, ymin) / ymin) * (H - 26);
  const pts = (f: (q: number) => number) => qs.map((q) => `${X(q).toFixed(1)},${Y(f(q)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          true p = {p.toFixed(2)}
          <input type="range" min={3} max={97} value={p100} onChange={(e) => setP100(Number(e.target.value))} aria-label="true probability" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Expected log-likelihood and its quadratic approximation">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} strokeDasharray="4 3" points={pts((q) => -0.5 * I * (q - p) * (q - p))} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={pts((q) => K(q) - top)} />
        <line x1={X(p)} x2={X(p)} y1={Y(0)} y2={H - 16} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 2} className="viz-label">q = 0</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        I(p) = 1/(p(1 − p)) = {I.toFixed(3)}; per-flip standard error of p̂ ≈ {Math.sqrt(1 / I).toFixed(3)}/√n
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is the expected log-likelihood of one flip, E[log f(X; q)] when X has bias p, shifted so its peak at
        q = p is 0. The dashed parabola has curvature I(p), the Fisher information. A sharper peak means the data separate
        nearby values of q better. Move p towards 0 or 1: the peak sharpens, because a rare outcome is very informative.
      </figcaption>
    </figure>
  );
}
