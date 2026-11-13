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

const P = 4, SIG2 = 0.04, TAU2 = 1, MAXN = 20;
const phi = (x: number) => [1, x, x * x, x * x * x];
const f = (x: number) => Math.sin(2.2 * x) + 0.3 * x;

function inv(A: number[][]) {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    for (let k = 0; k < 2 * n; k++) M[c][k] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const e = M[r][c]; for (let k = 0; k < 2 * n; k++) M[r][k] -= e * M[c][k]; }
  }
  return M.map((r) => r.slice(n));
}

function chol(A: number[][]) {
  const n = A.length, L = A.map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
  }
  return L;
}

/** Bayesian linear regression with a cubic basis: the posterior over weights gives a predictive mean, a band of ±2 standard deviations, and sample functions. */
export function BayesLinViz() {
  const [n, setN] = useState(3);
  const pts = useMemo(() => {
    const r = makeRng(2024);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: MAXN }, () => { const x = -0.9 + 1.4 * r(); return [x, f(x) + Math.sqrt(SIG2) * normal()]; });
  }, []);
  const data = pts.slice(0, n);
  const A = Array.from({ length: P }, (_, i) => Array.from({ length: P }, (_, j) => (i === j ? 1 / TAU2 : 0)));
  const b = Array(P).fill(0);
  data.forEach(([x, y]) => { const u = phi(x); for (let i = 0; i < P; i++) { b[i] += (u[i] * y) / SIG2; for (let j = 0; j < P; j++) A[i][j] += (u[i] * u[j]) / SIG2; } });
  const S = inv(A);
  const m = S.map((row) => row.reduce((s, v, j) => s + v * b[j], 0));
  const L = chol(S);
  const r = makeRng(77 + n);
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
  const samples = Array.from({ length: 5 }, () => { const z = Array.from({ length: P }, normal); return m.map((mi, i) => mi + L[i].reduce((s, v, k) => s + v * z[k], 0)); });
  const xs = Array.from({ length: 121 }, (_, i) => -1.5 + (3 * i) / 120);
  const pred = xs.map((x) => { const u = phi(x); const mu = u.reduce((s, v, i) => s + v * m[i], 0); let q = 0; for (let i = 0; i < P; i++) for (let j = 0; j < P; j++) q += u[i] * S[i][j] * u[j]; return [mu, Math.sqrt(SIG2 + q)]; });
  const W = 330, H = 200;
  const X = (x: number) => 12 + ((x + 1.5) / 3) * (W - 24);
  const Y = (y: number) => H / 2 - Math.max(-3, Math.min(3, y)) * (H / 6.4);
  const band = [...xs.map((x, i) => `${X(x).toFixed(1)},${Y(pred[i][0] + 2 * pred[i][1]).toFixed(1)}`), ...xs.slice().reverse().map((x, k) => { const i = xs.length - 1 - k; return `${X(x).toFixed(1)},${Y(pred[i][0] - 2 * pred[i][1]).toFixed(1)}`; })].join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => setN(Math.min(MAXN, n + 1))} disabled={n >= MAXN}>add a point</button>
        <button type="button" className="seg" onClick={() => setN(0)}>clear</button>
        <span className="mono" style={{ fontSize: 13 }}>n = {n}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Predictive band, mean and sample functions of Bayesian linear regression">
        <polygon points={band} fill="var(--accent)" opacity={0.15} />
        {samples.map((w, k) => (
          <polyline key={k} fill="none" stroke="var(--text-muted)" strokeWidth={0.9} opacity={0.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(phi(x).reduce((s, v, i) => s + v * w[i], 0)).toFixed(1)}`).join(" ")} />
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(pred[i][0]).toFixed(1)}`).join(" ")} />
        <line x1={X(-0.9)} x2={X(-0.9)} y1={4} y2={H - 4} stroke="var(--border)" strokeDasharray="2 3" />
        <line x1={X(0.5)} x2={X(0.5)} y1={4} y2={H - 4} stroke="var(--border)" strokeDasharray="2 3" />
        {data.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={3} fill="var(--danger)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        predictive sd at x = 0: {pred[60][1].toFixed(3)}; at x = 1.5: {pred[120][1].toFixed(3)} (noise sd 0.2)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The model is a cubic in x with a N(0, I) prior on its four weights and noise sd 0.2; data arrive only between the
        dotted lines. The thick curve is the predictive mean, the band is ±2 predictive standard deviations, and the thin
        curves are functions drawn from the posterior. With no data the band reflects the prior alone. Each point narrows it
        nearby, but outside the observed range the cubic terms are poorly pinned down, so the band and the samples fan out.
        The band never gets thinner than the noise.
      </figcaption>
    </figure>
  );
}
