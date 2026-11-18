"use client";

import { useState } from "react";

const H_DIAG = [1.0, 0.05];
const LRS = Array.from({ length: 39 }, (_, i) => 0.05 * (i + 1));
const BS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const TARGET = 0.01;

/** Steps for noisy-gradient SGD on ½Σhᵢxᵢ² from x = (1, 1) to reach expected loss TARGET, minimised over a grid of learning rates. */
export function tunedSteps(B: number, sigma2: number) {
  let best = Infinity;
  for (const lr of LRS) {
    let m = [1, 1];
    for (let k = 1; k <= Math.min(best - 1, 5000); k++) {
      m = m.map((v, i) => (1 - lr * H_DIAG[i]) ** 2 * v + (lr * lr * sigma2) / B);
      if (0.5 * (H_DIAG[0] * m[0] + H_DIAG[1] * m[1]) <= TARGET) {
        best = k;
        break;
      }
    }
  }
  return Number.isFinite(best) ? best : null;
}

/** Least-squares fit of S = S_min + E_min / B to measured points; B_crit = E_min / S_min. */
export function fit(points: { B: number; S: number }[]) {
  const n = points.length, xs = points.map((p) => 1 / p.B), ys = points.map((p) => p.S);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const e = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const s = my - e * mx;
  return { sMin: s, eMin: e, bCrit: e / s };
}

export function CriticalBatchViz() {
  const [sigma2, setSigma2] = useState(1);
  const pts = BS.map((B) => ({ B, S: tunedSteps(B, sigma2) })).filter((p): p is { B: number; S: number } => p.S !== null);
  const f = fit(pts);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const lx0 = Math.log10(2), lx1 = Math.log10(1024), ly1 = Math.log10(Math.max(...pts.map((p) => p.S)) * 1.3), ly0 = 0;
  const sx = (B: number) => X0 + ((Math.log10(B) - lx0) / (lx1 - lx0)) * PW;
  const sy = (S: number) => 8 + (1 - (Math.log10(S) - ly0) / (ly1 - ly0)) * PH;
  const curve = Array.from({ length: 81 }, (_, i) => 2 * 512 ** (i / 80));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">gradient noise σ²</span>
        {[0.25, 1, 4].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={sigma2 === v} onClick={() => setSigma2(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Measured steps to a target loss against batch size, with the fitted hyperbola">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve.map((B) => `${sx(B)},${sy(f.sMin + f.eMin / B)}`).join(" ")} />
        {f.bCrit > 2 && f.bCrit < 1024 && <line x1={sx(f.bCrit)} y1={8} x2={sx(f.bCrit)} y2={8 + PH} stroke="var(--danger)" strokeDasharray="3 3" />}
        {pts.map((p) => (
          <circle key={p.B} cx={sx(p.B)} cy={sy(p.S)} r={3.5} fill="var(--text)" />
        ))}
        {[2, 8, 32, 128, 512].map((B) => (
          <text key={B} x={sx(B)} y={H + 12} textAnchor="middle" className="viz-label">{B}</text>
        ))}
        {[1, 10, 100, 1000].filter((v) => Math.log10(v) <= ly1).map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`fit: S_min ≈ ${f.sMin.toFixed(1)}, E_min ≈ ${f.eMin.toFixed(0)}, B_crit ≈ ${f.bCrit.toFixed(0)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Steps needed to reach a fixed expected loss on a noisy quadratic, with the learning rate tuned separately for each
        batch size (dots), and the hyperbola S = S_min + E_min/B fitted to them by least squares on 1/B. The critical batch
        size E_min/S_min (red) is where the two terms are equal. More gradient noise pushes it to larger batches, in
        proportion: quadrupling σ² roughly quadruples B_crit.
      </figcaption>
    </figure>
  );
}
