"use client";

import { useMemo, useState } from "react";

const N = 40, SIGMA2 = 0.5, TRIALS = 20, PS = [10, 20, 30, 35, 46, 60, 100, 200, 400, 800], TAIL = 2;

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

function solve(A: number[][], b: number[]) {
  const n = A.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let c = n - 1; c >= 0; c--) { let s = M[c][n]; for (let k = c + 1; k < n; k++) s -= M[c][k] * x[k]; x[c] = s / M[c][c]; }
  return x;
}

/** Exact excess risk of least squares (p < n - 1) or minimum-norm interpolation (p > n + 1) for isotropic Gaussian features. */
export function isoRisk(p: number, b2 = 1) {
  if (p < N - 1) return (SIGMA2 * p) / (N - p - 1);
  if (p > N + 1) return b2 * (1 - N / p) + (SIGMA2 * N) / (p - N - 1);
  return Infinity;
}

/** Average excess risk over TRIALS fits; spiked puts the signal in 5 strong features and spreads variance TAIL over the rest. */
export function simulate(spiked: boolean) {
  return PS.map((p) => {
    const r = rand(p * 7 + (spiked ? 1 : 0));
    const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const scale = Array.from({ length: p }, (_, j) => (spiked ? (j < 5 ? 1 : Math.sqrt(TAIL / (p - 5))) : 1));
    let total = 0;
    for (let t = 0; t < TRIALS; t++) {
      const theta = Array.from({ length: p }, (_, j) => (spiked ? (j < 5 ? g() : 0) : g()));
      const tn = Math.sqrt(theta.reduce((s, v, j) => s + v * v * scale[j] * scale[j], 0));
      for (let j = 0; j < p; j++) theta[j] /= tn; // signal of unit variance: theta' Sigma theta = 1
      const X = Array.from({ length: N }, () => scale.map((s) => s * g()));
      const y = X.map((row) => row.reduce((s, v, j) => s + v * theta[j], 0) + Math.sqrt(SIGMA2) * g());
      let est: number[];
      if (p < N) {
        const G = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, row) => s + row[a] * row[b], 0)));
        est = solve(G, Array.from({ length: p }, (_, a) => X.reduce((s, row, i) => s + row[a] * y[i], 0)));
      } else {
        const G = X.map((ra) => X.map((rb) => ra.reduce((s, v, j) => s + v * rb[j], 0)));
        const alpha = solve(G, y);
        est = Array.from({ length: p }, (_, j) => X.reduce((s, row, i) => s + alpha[i] * row[j], 0));
      }
      total += est.reduce((s, v, j) => s + (v - theta[j]) ** 2 * scale[j] * scale[j], 0) / TRIALS;
    }
    return { p, risk: total };
  });
}

export function BenignOverfitViz() {
  const [spiked, setSpiked] = useState(false);
  const pts = useMemo(() => simulate(spiked), [spiked]);
  const W = 330, H = 180, X0 = 30, Y0 = 8, PW = W - 40, PH = H - Y0 - 32, YMAX = 3, LMIN = Math.log(8), LMAX = Math.log(1000);
  const sx = (p: number) => X0 + ((Math.log(p) - LMIN) / (LMAX - LMIN)) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const curve = (lo: number, hi: number) => {
    const out: string[] = [];
    for (let i = 0; i <= 120; i++) { const p = Math.exp(Math.log(lo) + ((Math.log(hi) - Math.log(lo)) * i) / 120); out.push(`${i ? "L" : "M"}${sx(p).toFixed(1)},${sy(isoRisk(p)).toFixed(1)}`); }
    return out.join(" ");
  };
  const last = pts[pts.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">features</span>
        <div className="segmented" role="group" aria-label="Feature covariance">
          <button type="button" className="seg" aria-pressed={!spiked} onClick={() => setSpiked(false)}>all equal</button>
          <button type="button" className="seg" aria-pressed={spiked} onClick={() => setSpiked(true)}>5 strong, rest weak</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Test risk against number of features, showing double descent">
        <line x1={sx(N)} x2={sx(N)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" strokeDasharray="3 3" />
        {!spiked && <path d={curve(8, N - 1.6)} fill="none" stroke="var(--danger)" strokeWidth={1.5} />}
        {!spiked && <path d={curve(N + 1.6, 1000)} fill="none" stroke="var(--danger)" strokeWidth={1.5} />}
        <line x1={X0} x2={X0 + PW} y1={sy(SIGMA2)} y2={sy(SIGMA2)} stroke="var(--text-muted)" strokeDasharray="2 4" />
        {pts.map((q) => <circle key={q.p} cx={sx(q.p)} cy={sy(q.risk)} r={3.2} fill="var(--accent)" />)}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[10, 40, 100, 1000].map((v) => <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor={v === 1000 ? "end" : "middle"} className="viz-label">{v}</text>)}
        {[0, 1, 2, 3].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">features p (log scale; n = 40)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`p = 800, fitting the 40 noisy labels exactly: excess risk ${last.risk.toFixed(3)} (noise variance ${SIGMA2})`}
      </div>
      <figcaption className="viz-caption">
        Excess test risk of least squares (p &lt; 40) and of the minimum-norm interpolator (p &gt; 40), from 40 samples with noise
        variance 0.5 (dotted). Dots average 20 fits; the red curve is the exact formula for equal features. With all features
        equal the risk explodes at p = n and then falls, but only towards the full signal variance 1: the interpolator
        absorbs the noise but forgets the signal. With 5 strong features carrying the signal and the rest weak, the
        interpolator fits every noisy label exactly and still has small risk: benign overfitting.
      </figcaption>
    </figure>
  );
}
