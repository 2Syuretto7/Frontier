"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chol(A: number[][]) {
  const n = A.length, L = A.map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-10)) : s / L[j][j];
  }
  return L;
}
const fwd = (L: number[][], b: number[]) => { const x: number[] = []; for (let i = 0; i < b.length; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * x[k]; x.push(s / L[i][i]); } return x; };
const bwd = (L: number[][], b: number[]) => { const n = b.length, x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; } return x; };

const ELLS = [0.1, 0.2, 0.4, 0.8, 1.6, 3.2];
const NOISE = 0.01, MAXN = 10;
const GX = Array.from({ length: 61 }, (_, i) => (6 * i) / 60);

/** Gaussian process regression with an RBF kernel: the posterior mean, a ±2 standard deviation band, posterior sample functions and the log marginal likelihood as the lengthscale changes. */
export function GpPosteriorViz() {
  const [n, setN] = useState(5);
  const [ei, setEi] = useState(3);
  const ell = ELLS[ei];
  const data = useMemo(() => {
    const r = makeRng(555);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: MAXN }, () => { const x = 0.3 + 5.4 * r(); return [x, Math.sin(1.3 * x) + 0.1 * normal()]; });
  }, []);
  const res = useMemo(() => {
    const k = (a: number, b: number) => Math.exp((-0.5 * (a - b) * (a - b)) / (ell * ell));
    const pts = data.slice(0, n);
    const L = chol(pts.map(([a], i) => pts.map(([b], j) => k(a, b) + (i === j ? NOISE : 0))));
    const y = pts.map((p) => p[1]);
    const alpha = n ? bwd(L, fwd(L, y)) : [];
    const V = GX.map((g) => (n ? fwd(L, pts.map(([a]) => k(a, g))) : []));
    const mean = GX.map((g) => pts.reduce((s, [a], j) => s + k(a, g) * alpha[j], 0));
    const cov = GX.map((g, i) => GX.map((h, j) => k(g, h) - V[i].reduce((s, v, t) => s + v * V[j][t], 0) + (i === j ? 1e-6 : 0)));
    const Lc = chol(cov);
    const r = makeRng(99 + n * 7 + ei);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const samples = Array.from({ length: 3 }, () => { const z = GX.map(normal); return GX.map((_, i) => mean[i] + Lc[i].reduce((s, v, t) => s + v * z[t], 0)); });
    const lml = n ? -0.5 * y.reduce((s, v, i) => s + v * alpha[i], 0) - L.reduce((s, row, i) => s + Math.log(row[i]), 0) - 0.5 * n * Math.log(2 * Math.PI) : 0;
    return { mean, sd: cov.map((row, i) => Math.sqrt(Math.max(row[i], 0))), samples, lml };
  }, [data, n, ell, ei]);
  const W = 330, H = 190;
  const X = (x: number) => 12 + (x / 6) * (W - 24);
  const Y = (y: number) => H / 2 - Math.max(-2.8, Math.min(2.8, y)) * (H / 6);
  const band = [...GX.map((g, i) => `${X(g).toFixed(1)},${Y(res.mean[i] + 2 * res.sd[i]).toFixed(1)}`), ...GX.slice().reverse().map((g, k) => { const i = GX.length - 1 - k; return `${X(g).toFixed(1)},${Y(res.mean[i] - 2 * res.sd[i]).toFixed(1)}`; })].join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => setN(Math.min(MAXN, n + 1))} disabled={n >= MAXN}>add a point</button>
        <button type="button" className="seg" onClick={() => setN(0)}>clear</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          lengthscale ℓ = {ell}
          <input type="range" min={0} max={ELLS.length - 1} value={ei} onChange={(e) => setEi(Number(e.target.value))} aria-label="lengthscale" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Gaussian process posterior mean, band and samples">
        <polygon points={band} fill="var(--accent)" opacity={0.15} />
        {res.samples.map((s, k) => <polyline key={k} fill="none" stroke="var(--text-muted)" strokeWidth={0.9} points={GX.map((g, i) => `${X(g).toFixed(1)},${Y(s[i]).toFixed(1)}`).join(" ")} />)}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={GX.map((g, i) => `${X(g).toFixed(1)},${Y(res.mean[i]).toFixed(1)}`).join(" ")} />
        {data.slice(0, n).map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={3} fill="var(--danger)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        n = {n}; log marginal likelihood {n ? res.lml.toFixed(2) : "(no data)"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A Gaussian process with an RBF kernel of lengthscale ℓ and noise variance 0.01. With no data, the band is the prior,
        ±2 around 0, and the thin curves are prior draws. Each observation pins the functions down nearby and the band
        pinches; between and beyond the points it reopens at a rate set by ℓ. A tiny ℓ lets the functions wiggle freely
        between points; a huge ℓ forces them to be nearly straight and they cannot follow the data. The log marginal
        likelihood is highest for a lengthscale in between.
      </figcaption>
    </figure>
  );
}
