"use client";

import { useMemo, useState } from "react";

const NS = [10, 50, 200, 400], BINS = 32;

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

/** Householder reduction of a symmetric matrix to tridiagonal form: returns the diagonal and off-diagonal. */
export function tridiagonal(A: number[][]) {
  const n = A.length, a = A.map((r) => Float64Array.from(r));
  for (let k = 0; k < n - 2; k++) {
    let alpha = 0;
    for (let i = k + 1; i < n; i++) alpha += a[i][k] * a[i][k];
    alpha = Math.sqrt(alpha);
    if (alpha < 1e-300) continue;
    if (a[k + 1][k] > 0) alpha = -alpha;
    const v = new Float64Array(n);
    v[k + 1] = a[k + 1][k] - alpha;
    for (let i = k + 2; i < n; i++) v[i] = a[i][k];
    let vv = 0;
    for (let i = k + 1; i < n; i++) vv += v[i] * v[i];
    if (vv < 1e-300) continue;
    // A <- H A H with H = I - 2 v v^T / vv, using p = A v, K = v^T p / vv
    const p = new Float64Array(n);
    for (let i = k; i < n; i++) { let s = 0; for (let j = k + 1; j < n; j++) s += a[i][j] * v[j]; p[i] = (2 * s) / vv; }
    let K = 0;
    for (let i = k + 1; i < n; i++) K += v[i] * p[i];
    K /= vv;
    for (let i = k; i < n; i++) p[i] -= K * v[i];
    for (let i = k; i < n; i++) for (let j = k; j < n; j++) a[i][j] -= v[i] * p[j] + p[i] * v[j];
  }
  return { d: Array.from({ length: n }, (_, i) => a[i][i]), e: Array.from({ length: n - 1 }, (_, i) => a[i + 1][i]) };
}

/** Number of eigenvalues below x of the tridiagonal matrix (d, e), by the Sturm sequence. */
export function countBelow(d: number[], e: number[], x: number) {
  let q = d[0] - x, c = q < 0 ? 1 : 0;
  for (let i = 1; i < d.length; i++) {
    q = d[i] - x - (e[i - 1] * e[i - 1]) / (q === 0 ? 1e-300 : q);
    if (q < 0) c++;
  }
  return c;
}

/** Histogram of the eigenvalues of an n by n Wigner matrix scaled by 1/sqrt(n), on BINS bins over [-2.5, 2.5]. */
export function simulate(n: number, signs: boolean) {
  const r = rand(5 + n + (signs ? 1000 : 0));
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const W = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) W[i][j] = W[j][i] = (signs ? (r() < 0.5 ? -1 : 1) : g()) / Math.sqrt(n);
  const { d, e } = tridiagonal(W);
  const edges = Array.from({ length: BINS + 1 }, (_, i) => -2.5 + (5 * i) / BINS);
  const below = edges.map((x) => countBelow(d, e, x));
  const hist = below.slice(1).map((c, i) => c - below[i]);
  const outside = below[0] + (n - below[BINS]);
  const top = countBelow(d, e, 2.2) < n ? "above 2.2" : "none above 2.2";
  return { hist, outside, top, maxEv: maxEigen(d, e) };
}

function maxEigen(d: number[], e: number[]) {
  let lo = -10, hi = 10;
  for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (countBelow(d, e, m) < d.length) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

export function SemicircleViz() {
  const [n, setN] = useState(200);
  const [signs, setSigns] = useState(false);
  const { hist, maxEv } = useMemo(() => simulate(n, signs), [n, signs]);
  const W = 330, H = 170, X0 = 10, Y0 = 8, PW = W - 20, PH = H - Y0 - 30;
  const bw = PW / BINS, width = 5 / BINS;
  const dens = hist.map((h) => h / (n * width));
  const top = 0.45;
  const sx = (v: number) => X0 + ((v + 2.5) / 5) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, top) / top) * PH;
  const curve = Array.from({ length: 101 }, (_, i) => { const x = -2 + (4 * i) / 100; return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(Math.sqrt(Math.max(0, 4 - x * x)) / (2 * Math.PI)).toFixed(1)}`; }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">size n</span>
        <div className="segmented" role="group" aria-label="Matrix size">
          {NS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={n === v} onClick={() => setN(v)}>{v}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Entry distribution">
          <button type="button" className="seg" aria-pressed={!signs} onClick={() => setSigns(false)}>Gaussian</button>
          <button type="button" className="seg" aria-pressed={signs} onClick={() => setSigns(true)}>signs</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of eigenvalues of a random symmetric matrix with the semicircle density">
        {dens.map((v, b) => v > 0 && (
          <rect key={b} x={X0 + b * bw} y={sy(v)} width={Math.max(bw - 1, 0.5)} height={Y0 + PH - sy(v)} fill="var(--accent)" opacity={0.75} />
        ))}
        <path d={curve} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[-2, -1, 0, 1, 2].map((v) => (
          <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">eigenvalue of W/√n</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`n = ${n}, ${signs ? "±1" : "Gaussian"} entries: largest eigenvalue ${maxEv.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Eigenvalues of a random symmetric n × n matrix with independent entries of variance 1, scaled by 1/√n, as a
        histogram of density, against the semicircle √(4 − x²)/(2π) (red). At n = 10 the match is rough; by n = 400 the
        histogram follows the curve closely and the largest eigenvalue is close to 2. Switching the entries from Gaussian to
        random signs changes nothing visible: the limit depends only on the variance of the entries.
      </figcaption>
    </figure>
  );
}
