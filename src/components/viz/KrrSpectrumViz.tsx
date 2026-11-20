"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { symEig } from "./la";

const M = 30, SIGMA = 0.15, NOISE = 0.25;
const k = (a: number, b: number) => Math.exp(-((a - b) ** 2) / (2 * SIGMA * SIGMA));
const f = (x: number) => Math.sin(4 * x) * Math.exp(-x * x);
const GRID = Array.from({ length: 121 }, (_, i) => -1 + i / 60);
export const LAMS = [1e-5, 1e-3, 1e-2, 1e-1];

/** Kernel ridge regression through the eigendecomposition of K: α = V diag(1/(μ + λm)) Vᵀ y. */
export function krr(lam: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const xs = Array.from({ length: M }, () => 2 * r() - 1).sort((a, b) => a - b), ys = xs.map((x) => f(x) + NOISE * nrm());
  const { values, vectors } = symEig(xs.map((a) => xs.map((b) => k(a, b))));
  const mu = values.map((v) => Math.max(v, 0));
  const proj = mu.map((_, j) => xs.reduce((s, _x, i) => s + vectors[i][j] * ys[i], 0));
  const alpha = xs.map((_, i) => mu.reduce((s, m, j) => s + (vectors[i][j] * proj[j]) / (m + lam * M), 0));
  const pred = (x: number) => xs.reduce((s, xi, i) => s + alpha[i] * k(xi, x), 0);
  const shrink = mu.map((m) => m / (m + lam * M));
  const dof = shrink.reduce((a, v) => a + v, 0);
  const train = xs.reduce((a, x, i) => a + (pred(x) - ys[i]) ** 2, 0) / M;
  const test = GRID.reduce((a, x) => a + (pred(x) - f(x)) ** 2, 0) / GRID.length + NOISE * NOISE;
  return { xs, ys, pred, mu, shrink, dof, train, test };
}

export function KrrSpectrumViz() {
  const [li, setLi] = useState(2);
  const e = useMemo(() => krr(LAMS[li], 21), [li]);
  const W = 330, H = 130, X0 = 10, PW = 310, Y0 = 6, PH = 118, YL = -1.6, YH = 1.6;
  const sx = (x: number) => X0 + ((x + 1) / 2) * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  const BH = 90, BW = PW / M, top = Math.log10(e.mu[0]), bottom = -6;
  const by = (v: number) => BH - ((Math.log10(Math.max(v, 1e-6)) - bottom) / (top - bottom)) * (BH - 10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">λ</span>
        <div className="segmented" role="group" aria-label="Regularisation strength">
          {LAMS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Kernel ridge regression fit">
        <path d={GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeDasharray="4 3" strokeWidth={1} />
        {e.xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(e.ys[i])} r={2.2} fill="var(--text)" fillOpacity={0.55} />)}
        <path d={GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(e.pred(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <svg viewBox={`0 0 ${W} ${BH + 14}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "4px auto 0" }} role="img" aria-label="Eigenvalues of the Gram matrix and how much each direction is kept">
        {e.mu.map((m, j) => (
          <g key={j}>
            <rect x={X0 + j * BW + 1} y={by(m)} width={BW - 2} height={BH - by(m)} fill="var(--code-function)" fillOpacity={0.25} />
            <rect x={X0 + j * BW + 1} y={BH - e.shrink[j] * (BH - 10)} width={BW - 2} height={e.shrink[j] * (BH - 10)} fill="var(--accent)" fillOpacity={0.6} />
          </g>
        ))}
        <text x={X0} y={BH + 12} className="viz-label">eigen-directions of K, largest first</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>■</span> eigenvalue μ_j (log scale)</span>
        <span><span style={{ color: "var(--accent)" }}>■</span> fraction kept μ_j / (μ_j + λm)</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        degrees of freedom {e.dof.toFixed(2)}; train {e.train.toFixed(3)}; test {e.test.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Kernel ridge regression on 30 noisy points with a Gaussian kernel. In the eigenbasis of the Gram matrix, the fit keeps
        each direction in proportion μ/(μ + λm), so λ acts as a soft cut-off in the spectrum. With λ = 0.00001 about 17 effective
        directions survive, the rest having eigenvalues near zero, and the curve chases the noise (test error 0.135); λ = 0.01
        keeps about 9 and gives the lowest test error, 0.082.
      </figcaption>
    </figure>
  );
}
