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
function zUpper(a: number) {
  let lo = -8, hi = 8;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (1 - Phi(m) > a) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/** Testing N(0, 1) against N(0, σ²) from one observation: the ROC curve of the likelihood ratio test |x| > c against the one-sided test x > c. */
export function NpRocViz() {
  const [s10, setS10] = useState(20);
  const sig = s10 / 10;
  const as = Array.from({ length: 101 }, (_, i) => i / 100);
  const lr = (a: number) => (a <= 0 ? 0 : a >= 1 ? 1 : 2 * Phi(-zUpper(a / 2) / sig));
  const naive = (a: number) => (a <= 0 ? 0 : a >= 1 ? 1 : Phi(-zUpper(a) / sig));
  const W = 330, H = 170, P = 22;
  const S = H - P - 10;
  const X = (a: number) => P + a * S;
  const Y = (b: number) => 10 + (1 - b) * S;
  const pts = (f: (a: number) => number) => as.map((a) => `${X(a).toFixed(1)},${Y(f(a)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          alternative σ = {sig.toFixed(1)}
          <input type="range" min={11} max={50} value={s10} onChange={(e) => setS10(Number(e.target.value))} aria-label="alternative standard deviation" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="ROC curves of two tests">
        <rect x={X(0)} y={Y(1)} width={S} height={S} fill="none" stroke="var(--border)" />
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={pts(lr)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} points={pts(naive)} />
        <circle cx={X(0.05)} cy={Y(lr(0.05))} r={3} fill="var(--accent)" />
        <circle cx={X(0.05)} cy={Y(naive(0.05))} r={3} fill="var(--danger)" />
        <text x={X(0.5)} y={H - 2} textAnchor="middle" className="viz-label">size α</text>
        <text x={X(1) + 6} y={Y(0.5)} className="viz-label">power</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        at α = 0.05: likelihood ratio test {lr(0.05).toFixed(3)}, one-sided test {naive(0.05).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each curve traces size against power as the cut-off c varies. The null is N(0, 1) and the alternative N(0, σ²). The
        likelihood ratio grows with |x|, so the Neyman-Pearson test rejects for large |x| (accent). Rejecting for large x
        (danger), natural for a shift in mean, is wrong-shaped here: at every size it has less power, and the dots compare
        them at α = 0.05.
      </figcaption>
    </figure>
  );
}
