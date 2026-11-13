"use client";

import { useState } from "react";

type V3 = [number, number, number];
type M3 = number[][];

const W0: V3 = [1, 0.8, 0.6];

function fitFa(S: M3, iters = 3000) {
  let w: V3 = [S[0][0] ** 0.5 * 0.5, S[1][1] ** 0.5 * 0.5, S[2][2] ** 0.5 * 0.5];
  let psi: V3 = [S[0][0] / 2, S[1][1] / 2, S[2][2] / 2];
  for (let t = 0; t < iters; t++) {
    const G = 1 / (1 + w.reduce((a, wi, i) => a + (wi * wi) / psi[i], 0));
    const beta = w.map((wi, i) => (G * wi) / psi[i]) as V3;
    const Sb = [0, 1, 2].map((i) => S[i].reduce((a, s, j) => a + s * beta[j], 0)) as V3;
    const Ezz = G + beta.reduce((a, b, i) => a + b * Sb[i], 0);
    w = Sb.map((s) => s / Ezz) as V3;
    psi = [0, 1, 2].map((i) => Math.max(S[i][i] - w[i] * Sb[i], 1e-6)) as V3;
  }
  return w.map((wi, i) => (wi * wi) / (wi * wi + psi[i])) as V3;
}

function fitPpca(S: M3) {
  let u: V3 = [1, 1, 1];
  for (let t = 0; t < 300; t++) {
    const v = [0, 1, 2].map((i) => S[i].reduce((a, s, j) => a + s * u[j], 0));
    const nrm = Math.hypot(...v);
    u = v.map((x) => x / nrm) as V3;
  }
  const lam = [0, 1, 2].reduce((a, i) => a + u[i] * S[i].reduce((b, s, j) => b + s * u[j], 0), 0);
  const s2 = (S[0][0] + S[1][1] + S[2][2] - lam) / 2;
  return u.map((ui) => {
    const wi2 = ui * ui * (lam - s2);
    return wi2 / (wi2 + s2);
  }) as V3;
}

/** Communalities fitted by factor analysis and by PPCA from an exact covariance, as one feature's noise grows or another is rescaled. */
export function FaCommunalityViz() {
  const [psi3, setPsi3] = useState(1);
  const [scale, setScale] = useState(1);
  const psi: V3 = [0.1, 0.5, psi3];
  const d = [scale, 1, 1];
  const S = [0, 1, 2].map((i) => [0, 1, 2].map((j) => d[i] * d[j] * (W0[i] * W0[j] + (i === j ? psi[i] : 0))));
  const truth = W0.map((w, i) => (w * w) / (w * w + psi[i]));
  const fa = fitFa(S);
  const pp = fitPpca(S);
  const W = 330, H = 160;
  const gx = (i: number) => 40 + i * 98;
  const Y = (v: number) => H - 22 - v * (H - 40);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          ψ₃ = {psi3.toFixed(1)}
          <input type="range" min={0.1} max={4} step={0.1} value={psi3} onChange={(e) => setPsi3(Number(e.target.value))} aria-label="noise variance of feature 3" style={{ width: 120 }} />
        </label>
        <span className="mono" style={{ fontSize: 13 }}>scale of feature 1:</span>
        {[1, 10].map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={scale === s} onClick={() => setScale(s)}>×{s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="True, factor-analysis and PPCA communalities of three features">
        <line x1={20} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={gx(i)} y={Y(fa[i])} width={24} height={Y(0) - Y(fa[i])} fill="var(--accent)" opacity={0.7} />
            <rect x={gx(i) + 28} y={Y(pp[i])} width={24} height={Y(0) - Y(pp[i])} fill="var(--danger)" opacity={0.6} />
            <line x1={gx(i) - 4} x2={gx(i) + 56} y1={Y(truth[i])} y2={Y(truth[i])} stroke="var(--text)" strokeDasharray="4 3" />
            <text x={gx(i) + 26} y={H - 6} textAnchor="middle" className="viz-label">feature {i + 1}</text>
          </g>
        ))}
        <text x={20} y={Y(1) - 4} className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        FA: {fa.map((v) => v.toFixed(2)).join(", ")}; PPCA: {pp.map((v) => v.toFixed(2)).join(", ")}; true: {truth.map((v) => v.toFixed(2)).join(", ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Three features share one factor with loadings 1, 0.8 and 0.6, plus their own noise. Each fit is made to the exact
        covariance. The bars show the fraction of each feature&apos;s variance explained by the factor: left bars from factor
        analysis, right bars from PPCA, dashed lines the truth. Factor analysis recovers the truth and ignores rescaling.
        PPCA forces equal noise, so it credits noisy features with signal they lack, and rescaling feature 1 changes its answer.
      </figcaption>
    </figure>
  );
}
