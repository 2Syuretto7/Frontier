"use client";

import { useMemo, useState } from "react";
import { countBelow, tridiagonal } from "./SemicircleViz";

const D = 200, GAMMAS = [0.1, 0.25, 0.5, 1], SPIKES = [1, 1.5, 3], BINS = 36, XMAX = 4.5;

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mpDensity(x: number, g: number) {
  const a = (1 - Math.sqrt(g)) ** 2, b = (1 + Math.sqrt(g)) ** 2;
  return x > a && x < b ? Math.sqrt((b - x) * (x - a)) / (2 * Math.PI * g * x) : 0;
}

/** Eigenvalue histogram of the sample covariance of n = D / gamma Gaussian vectors whose first coordinate has variance ell. */
export function simulate(gamma: number, ell: number) {
  const n = Math.round(D / gamma), r = rand(Math.round(gamma * 100) * 10 + Math.round(ell * 2));
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const S = Array.from({ length: D }, () => new Float64Array(D));
  const x = new Float64Array(D), s0 = Math.sqrt(ell);
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < D; i++) x[i] = g();
    x[0] *= s0;
    for (let i = 0; i < D; i++) { const xi = x[i] / n; const row = S[i]; for (let j = 0; j <= i; j++) row[j] += xi * x[j]; }
  }
  for (let i = 0; i < D; i++) for (let j = 0; j < i; j++) S[j][i] = S[i][j];
  const { d, e } = tridiagonal(S.map((row) => Array.from(row)));
  const edges = Array.from({ length: BINS + 1 }, (_, i) => (XMAX * i) / BINS);
  const below = edges.map((t) => countBelow(d, e, t));
  const hist = below.slice(1).map((c, i) => c - below[i]);
  let lo = 0, hi = 50;
  for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (countBelow(d, e, m) < D) lo = m; else hi = m; }
  const edge = (1 + Math.sqrt(gamma)) ** 2;
  const predicted = ell > 1 + Math.sqrt(gamma) ? ell * (1 + gamma / (ell - 1)) : edge;
  return { hist, top: (lo + hi) / 2, edge, predicted };
}

export function MarchenkoPasturViz() {
  const [gamma, setGamma] = useState(0.25);
  const [ell, setEll] = useState(1);
  const { hist, top, edge, predicted } = useMemo(() => simulate(gamma, ell), [gamma, ell]);
  const W = 330, H = 170, X0 = 10, Y0 = 8, PW = W - 20, PH = H - Y0 - 30;
  const bw = PW / BINS, width = XMAX / BINS, YMAX = 1.6;
  const dens = hist.map((h) => h / (D * width));
  const sx = (v: number) => X0 + (Math.min(v, XMAX) / XMAX) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const curve = Array.from({ length: 241 }, (_, i) => { const t = (XMAX * i) / 240; return `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(mpDensity(t, gamma)).toFixed(1)}`; }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">γ = d/n</span>
        <div className="segmented" role="group" aria-label="Aspect ratio">
          {GAMMAS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={gamma === v} onClick={() => setGamma(v)}>{v}</button>
          ))}
        </div>
        <span className="viz-label">spike ℓ</span>
        <div className="segmented" role="group" aria-label="Spike strength">
          {SPIKES.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={ell === v} onClick={() => setEll(v)}>{v === 1 ? "none" : v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of sample covariance eigenvalues with the Marchenko-Pastur density">
        {dens.map((v, b) => v > 0 && (
          <rect key={b} x={X0 + b * bw} y={sy(v)} width={Math.max(bw - 1, 0.5)} height={Y0 + PH - sy(v)} fill="var(--accent)" opacity={0.75} />
        ))}
        <path d={curve} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <line x1={sx(top)} x2={sx(top)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="3 3" />
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 1, 2, 3, 4].map((v) => (
          <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">eigenvalue of the sample covariance</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`d = ${D}, n = ${Math.round(D / gamma)}: largest eigenvalue ${top.toFixed(2)} (dashed); bulk edge ${edge.toFixed(2)}; ${ell === 1 ? "no spike" : `prediction ${predicted.toFixed(2)}`}`}
      </div>
      <figcaption className="viz-caption">
        Eigenvalues of the sample covariance of n Gaussian vectors in 200 dimensions, against the Marchenko-Pastur density
        (red). With no spike every true eigenvalue is 1, yet the sample eigenvalues fill the whole interval
        [(1 − √γ)², (1 + √γ)²]. Adding one true direction of variance ℓ helps only if ℓ is above 1 + √γ: with γ = 0.25,
        ℓ = 1.5 sits exactly at that threshold and its eigenvalue stays near the bulk edge, while ℓ = 3 pops out well beyond the edge,
        at 3.6 in this sample against the limiting prediction ℓ(1 + γ/(ℓ − 1)) = 3.38. With γ = 1, ℓ = 1.5 is invisible. Values beyond 4.5 are drawn at the right edge.
      </figcaption>
    </figure>
  );
}
