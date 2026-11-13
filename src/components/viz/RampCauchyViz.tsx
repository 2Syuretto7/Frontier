"use client";

import { useState } from "react";

const ramp = (n: number) => (x: number) => Math.min(1, Math.max(0, n * (x - 0.5) + 0.5));

/** Continuous ramps that steepen towards a step: Cauchy in the integral metric with no continuous limit, and not Cauchy in the sup metric. */
export function RampCauchyViz() {
  const [k, setK] = useState(3);
  const n = Math.pow(2, k);
  const fa = ramp(n), fb = ramp(2 * n);
  const d1 = 1 / (4 * n) - 1 / (8 * n);
  const dsup = 0.5 - n / (4 * n);
  const W = 330, H = 150;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 14 - y * (H - 26);
  const xs = Array.from({ length: 801 }, (_, i) => i / 800);
  const line = (f: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={0} max={8} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="steepness n" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Two ramps of slopes n and 2n and the step they approach">
        <polygon points={[...xs.map((x) => `${X(x).toFixed(1)},${Y(fa(x)).toFixed(1)}`), ...xs.slice().reverse().map((x) => `${X(x).toFixed(1)},${Y(fb(x)).toFixed(1)}`)].join(" ")} fill="var(--accent)" opacity={0.25} />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 3" points={`${X(0)},${Y(0)} ${X(0.5)},${Y(0)} ${X(0.5)},${Y(1)} ${X(1)},${Y(1)}`} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={line(fa)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(fb)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        d₁(fₙ, f₂ₙ) = {d1.toFixed(5)}; d∞(fₙ, f₂ₙ) = {dsup.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        fₙ rises from 0 to 1 with slope n around x = 1/2 (dark curve); f₂ₙ is the accent curve, and the shaded area between
        them is d₁(fₙ, f₂ₙ) = 1/(8n), which tends to 0. In d₁ the ramps form a Cauchy sequence whose only candidate limit is
        the dashed step, which is not continuous: C[0, 1] with d₁ is not complete. In d∞ the two curves stay 1/4 apart, so the
        sequence is not Cauchy at all.
      </figcaption>
    </figure>
  );
}
