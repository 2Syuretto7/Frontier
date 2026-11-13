"use client";

import { useState } from "react";

const K = 60;

/** Gradient descent's optimality gap on a log scale: x⁴/4 (smooth, not strongly convex) falls like a power of k under the L‖x₀ − x*‖²/(2k) bound, while a strongly convex quadratic falls geometrically under the (1 − 1/κ)ᵏ bound. */
export function RateCompareViz() {
  const [kappa, setKappa] = useState(10);
  const ks = Array.from({ length: K + 1 }, (_, k) => k);
  const quart: number[] = [];
  let x = 1;
  for (let k = 0; k <= K; k++) { quart.push(x ** 4 / 4); x = x - x ** 3 / 3; }
  const quad: number[] = [];
  let a = 1, b = 1;
  for (let k = 0; k <= K; k++) { quad.push(0.5 * (a * a + kappa * b * b)); a = a - a / kappa; b = b - b; }
  const subB = ks.map((k) => (k === 0 ? NaN : 1.5 / k));
  const linB = ks.map((k) => Math.pow(1 - 1 / kappa, k) * quad[0]);
  const lo = -8, hi = 2;
  const W = 330, H = 190;
  const X = (k: number) => 34 + (k / K) * (W - 46);
  const Y = (v: number) => {
    const l = Math.max(lo, Math.min(hi, Math.log10(Math.max(v, 1e-300))));
    return 10 + ((hi - l) / (hi - lo)) * (H - 30);
  };
  const line = (vs: number[]) => vs.map((v, k) => (Number.isNaN(v) ? null : `${X(k).toFixed(1)},${Y(v).toFixed(1)}`)).filter(Boolean).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          κ = {kappa}
          <input type="range" min={2} max={50} value={kappa} onChange={(e) => setKappa(Number(e.target.value))} aria-label="condition number" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Optimality gap against iteration on a log scale for two functions, with their bounds">
        {[2, 0, -2, -4, -6, -8].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 12} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke="var(--border)" opacity={0.6} />
            <text x={30} y={Y(10 ** e) + 3} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.2} strokeDasharray="5 3" points={line(subB)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={line(quart)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.2} strokeDasharray="5 3" points={line(linB)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(quad)} />
        <text x={X(K)} y={H - 4} textAnchor="end" className="viz-label">k = {K}</text>
        <text x={X(0)} y={H - 4} className="viz-label">k = 0</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        after {K} steps: x⁴/4 gap {quart[K].toExponential(2)}; quadratic gap {quad[K].toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The vertical axis is f(xₖ) − f* on a log scale. One solid curve is gradient descent with step 1/3 on x⁴/4 from 1,
        which is 3-smooth there but flat at its minimum, under the grey dashed bound L‖x₀ − x*‖²/(2k): it bends ever flatter.
        The other solid curve is the quadratic (x² + κy²)/2 with step 1/κ, under the red dashed bound (1 − 1/κ)ᵏ times the
        starting gap. A geometric rate is a straight line on this scale, and its slope shrinks as κ grows.
      </figcaption>
    </figure>
  );
}
