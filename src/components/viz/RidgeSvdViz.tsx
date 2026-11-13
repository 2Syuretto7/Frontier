"use client";

import { useState } from "react";

const D = [5, 2, 0.5, 0.1];
const THETA = [1, 1, 1, 1];
const LOGS = Array.from({ length: 121 }, (_, i) => -4 + (7 * i) / 120);

/** Ridge regression in the singular value basis: each direction is shrunk by d²/(d² + λ), and the mean squared error of the coefficients trades squared bias against variance. */
export function RidgeSvdViz() {
  const [l10, setL10] = useState(-10);
  const [s10, setS10] = useState(5);
  const lam = Math.pow(10, l10 / 10);
  const sig2 = Math.pow(s10 / 10, 2);
  const parts = (L: number) => {
    let b = 0, v = 0;
    D.forEach((d, j) => { const den = (d * d + L) * (d * d + L); v += (sig2 * d * d) / den; b += (L * L * THETA[j] * THETA[j]) / den; });
    return [b, v];
  };
  const curve = LOGS.map((g) => parts(Math.pow(10, g)));
  const ols = sig2 * D.reduce((s, d) => s + 1 / (d * d), 0);
  let best = 0;
  curve.forEach((c, i) => { if (c[0] + c[1] < curve[best][0] + curve[best][1]) best = i; });
  const [bNow, vNow] = parts(lam);
  const lg = (y: number) => Math.log10(Math.max(y, 1e-4));
  const ylo = -3, yhi = 2.5;
  const W = 330, H = 150, PL = 150;
  const X = (g: number) => 16 + ((g + 4) / 7) * (PL - 20);
  const Y = (y: number) => H - 16 - ((Math.min(Math.max(lg(y), ylo), yhi) - ylo) / (yhi - ylo)) * (H - 26);
  const line = (f: (c: number[]) => number) => curve.map((c, i) => `${X(LOGS[i]).toFixed(1)},${Y(f(c)).toFixed(1)}`).join(" ");
  const BX = PL + 24, BW = W - BX - 10;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {lam < 0.01 ? lam.toExponential(1) : lam.toFixed(3)}
          <input type="range" min={-40} max={30} value={l10} onChange={(e) => setL10(Number(e.target.value))} aria-label="log ridge penalty" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          σ = {(s10 / 10).toFixed(1)}
          <input type="range" min={1} max={20} value={s10} onChange={(e) => setS10(Number(e.target.value))} aria-label="noise level" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Mean squared error against lambda, and shrinkage factors per direction">
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.2} strokeDasharray="4 3" points={line((c) => c[0])} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.2} strokeDasharray="2 2" points={line((c) => c[1])} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line((c) => c[0] + c[1])} />
        <line x1={X(l10 / 10)} x2={X(l10 / 10)} y1={10} y2={H - 16} stroke="var(--border)" />
        <circle cx={X(LOGS[best])} cy={Y(curve[best][0] + curve[best][1])} r={3} fill="var(--accent)" />
        <text x={X(-4)} y={H - 2} className="viz-label">log λ = −4</text>
        <text x={X(3)} y={H - 2} textAnchor="end" className="viz-label">3</text>
        {D.map((d, j) => {
          const f = (d * d) / (d * d + lam);
          const y = 14 + j * 30;
          return (
            <g key={j}>
              <rect x={BX} y={y} width={BW} height={12} fill="none" stroke="var(--border)" />
              <rect x={BX} y={y} width={BW * f} height={12} fill="var(--accent)" opacity={0.6} />
              <text x={BX} y={y + 24} className="viz-label">d = {d}: {f.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        MSE {(bNow + vNow).toFixed(3)} (bias² {bNow.toFixed(3)}, variance {vNow.toFixed(3)}); least squares {ols.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The design has singular values 5, 2, 0.5 and 0.1. On the left, on log scales: squared bias (danger dashes),
        variance (muted dashes) and their sum, the coefficient MSE (solid), against λ; the dot marks the best λ. On the
        right, the factor d²/(d² + λ) by which ridge shrinks each direction. The tiny singular value carries almost all of
        the least squares variance, and even a small λ shrinks it away.
      </figcaption>
    </figure>
  );
}
