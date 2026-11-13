"use client";

import { useState } from "react";

// f(x) = x on [0, 1] in the orthonormal Fourier basis 1, √2 cos(2πkx), √2 sin(2πkx).
// Coefficients: 1/2 on the constant, −√2/(2πk) on √2 sin(2πkx), 0 on the cosines.
const coef = (k: number) => -Math.SQRT2 / (2 * Math.PI * k);
const partial = (x: number, K: number) => {
  let s = 0.5;
  for (let k = 1; k <= K; k++) s += coef(k) * Math.SQRT2 * Math.sin(2 * Math.PI * k * x);
  return s;
};

/** Partial sums of an orthonormal expansion: the coefficients' squares add up to the squared norm (Bessel, then Parseval). */
export function OrthoExpandViz() {
  const [K, setK] = useState(3);
  let energy = 0.25;
  for (let k = 1; k <= K; k++) energy += coef(k) * coef(k);
  const W = 320, H = 160;
  const X = (x: number) => 30 + x * (W - 40), Y = (y: number) => H - 20 - ((y + 0.2) / 1.4) * (H - 30);
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) pts.push(`${X(i / 200).toFixed(1)},${Y(partial(i / 200, K)).toFixed(1)}`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          K = {K}
          <input type="range" min={0} max={30} value={K} onChange={(e) => setK(Number(e.target.value))} aria-label="number of sine terms" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The function x and its partial orthonormal expansion">
        <line x1={30} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={30} x2={30} y1={10} y2={H - 20} stroke="var(--border)" />
        <text x={26} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={26} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X(1)} y={H - 6} textAnchor="middle" className="viz-label">x = 1</text>
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts.join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        Σ c² = {energy.toFixed(4)}, ‖f‖² = 0.3333, ‖f − S_K‖² = {(1 / 3 - energy).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        f(x) = x (dashed) projected onto the constant and the first K functions √2 sin(2πkx). Each coefficient is just an inner
        product, ⟨f, e_k⟩, with no system to solve. The squared coefficients add up to at most ‖f‖² = 1/3, and the missing
        part is exactly the squared error, so as K grows the sum climbs to 1/3: that is Parseval&apos;s identity in the limit.
      </figcaption>
    </figure>
  );
}
