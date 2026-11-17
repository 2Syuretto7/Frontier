"use client";

import { useState } from "react";

function cheb(k: number, t: number) {
  if (Math.abs(t) <= 1) return Math.cos(k * Math.acos(t));
  const s = t > 0 ? 1 : k % 2 === 0 ? 1 : -1;
  return s * Math.cosh(k * Math.acosh(Math.abs(t)));
}

/** The scaled Chebyshev polynomial of degree k with q(0) = 1 that is smallest on [a, b]: the best residual polynomial a Krylov method can hope for when the eigenvalues fill that interval. */
export function ChebResidualViz() {
  const [k, setK] = useState(5);
  const [lk, setLk] = useState(10);
  const b = 1, kappa = 1.5 ** lk, a = b / kappa;
  const q = (x: number) => cheb(k, (b + a - 2 * x) / (b - a)) / cheb(k, (b + a) / (b - a));
  const maxOn = 1 / Math.abs(cheb(k, (b + a) / (b - a)));
  const sk = Math.sqrt(kappa);
  const bound = 2 * ((sk - 1) / (sk + 1)) ** k;
  const W = 330, H = 160;
  const X = (x: number) => 20 + (x / 1.05) * (W - 30);
  const ymax = 1.1;
  const Y = (y: number) => H / 2 - (Math.max(-ymax, Math.min(ymax, y)) / ymax) * (H / 2 - 12);
  const xs = Array.from({ length: 401 }, (_, i) => (1.05 * i) / 400);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          degree k = {k}
          <input type="range" min={1} max={20} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="polynomial degree" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          κ = b/a = {kappa.toFixed(1)}
          <input type="range" min={1} max={20} value={lk} onChange={(e) => setLk(Number(e.target.value))} aria-label="condition number" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Scaled Chebyshev residual polynomial on the eigenvalue interval">
        <rect x={X(a)} y={Y(maxOn)} width={X(b) - X(a)} height={Y(-maxOn) - Y(maxOn)} fill="var(--accent)" opacity={0.12} />
        <line x1={X(0)} x2={X(1.05)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(a)} x2={X(b)} y1={Y(0)} y2={Y(0)} stroke="var(--accent)" strokeWidth={4} opacity={0.6} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={xs.map((x) => `${X(x).toFixed(1)},${Y(q(x)).toFixed(1)}`).join(" ")} />
        <circle cx={X(0)} cy={Y(1)} r={3} fill="var(--danger)" />
        <text x={X(0) + 6} y={Y(1) + 4} className="viz-label">q(0) = 1</text>
        <text x={X(a)} y={H - 4} textAnchor="middle" className="viz-label">a</text>
        <text x={X(b)} y={H - 4} textAnchor="middle" className="viz-label">b</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        max over [a, b] of |q| = {maxOn.toExponential(2)}; bound 2((√κ − 1)/(√κ + 1))^k = {bound.toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        After k steps, a Krylov method&apos;s residual is q(A)r₀ for some polynomial q of degree k with q(0) = 1, so it can be
        no smaller than how small such a polynomial can be on the eigenvalues. If they fill the interval [a, b] (thick
        accent segment), the best choice is a rescaled Chebyshev polynomial (solid curve); the shaded band is its maximum on
        the interval. The polynomial is pinned at 1 at zero, so the closer a is to zero, the larger κ = b/a, and the higher
        the degree needed to bend it down: the band shrinks by about (√κ − 1)/(√κ + 1) per degree.
      </figcaption>
    </figure>
  );
}
