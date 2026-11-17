"use client";

import { useEffect, useState } from "react";

const BULK = 47;
const EIGS = [...Array.from({ length: BULK }, (_, i) => (i / (BULK - 1)) ** 2), 3, 5, 8];
const N = EIGS.length, K = 60;

/** Eigenvalues of the symmetric tridiagonal matrix (a, b) by bisection with Sturm counts. */
function tridiagEigs(a: number[], b: number[]): number[] {
  const n = a.length;
  const count = (x: number) => {
    let c = 0, d = 1;
    for (let i = 0; i < n; i++) {
      d = a[i] - x - (i > 0 ? (b[i - 1] * b[i - 1]) / (d === 0 ? 1e-300 : d) : 0);
      if (d < 0) c++;
    }
    return c;
  };
  const out: number[] = [];
  for (let j = 0; j < n; j++) {
    let lo = -1, hi = 10;
    for (let it = 0; it < 60; it++) {
      const mid = (lo + hi) / 2;
      if (count(mid) > j) hi = mid; else lo = mid;
    }
    out.push((lo + hi) / 2);
  }
  return out;
}

function lanczos(reorth: boolean): number[][] {
  const q0 = Array(N).fill(1 / Math.sqrt(N));
  const Q = [q0];
  const a: number[] = [], b: number[] = [];
  const ritz: number[][] = [];
  const kmax = reorth ? N : K;
  for (let j = 0; j < kmax; j++) {
    const q = Q[j];
    let w = q.map((v, i) => EIGS[i] * v);
    const al = w.reduce((s, v, i) => s + v * q[i], 0);
    a.push(al);
    w = w.map((v, i) => v - al * q[i] - (j > 0 ? b[j - 1] * Q[j - 1][i] : 0));
    if (reorth) for (const p of Q) { const c = p.reduce((s, v, i) => s + v * w[i], 0); w = w.map((v, i) => v - c * p[i]); }
    ritz.push(tridiagEigs(a, b));
    const be = Math.sqrt(w.reduce((s, v) => s + v * v, 0));
    if (be < 1e-12) break;
    b.push(be);
    Q.push(w.map((v) => v / be));
  }
  return ritz;
}

/** Ritz values of Lanczos against the step k for a spectrum with a bulk in [0, 1] and outliers 3, 5 and 8, with and without reorthogonalisation. */
export function RitzPlotViz() {
  const [reorth, setReorth] = useState(false);
  const [k, setK] = useState(12);
  const [data, setData] = useState<{ plain: number[][]; full: number[][] } | null>(null);
  useEffect(() => setData({ plain: lanczos(false), full: lanczos(true) }), []);
  const rz = data ? (reorth ? data.full : data.plain) : null;
  const kk = rz ? Math.min(k, rz.length) : k;
  const W = 330, H = 170;
  const X = (j: number) => 30 + ((j - 1) / (K - 1)) * (W - 50);
  const Y = (v: number) => H - 18 - (v / 8.6) * (H - 28);
  const cur = rz ? rz[kk - 1] : [];
  const copies = cur.filter((t) => Math.abs(t - 8) < 1e-6).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="seg" aria-pressed={!reorth} onClick={() => setReorth(false)}>plain Lanczos</button>
        <button type="button" className="seg" aria-pressed={reorth} onClick={() => setReorth(true)}>full reorthogonalisation</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          k = {kk}
          <input type="range" min={1} max={K} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Lanczos steps" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Ritz values at each Lanczos step">
        {[3, 5, 8].map((e) => <line key={e} x1={30} x2={W - 18} y1={Y(e)} y2={Y(e)} stroke="var(--border)" />)}
        <rect x={W - 16} y={Y(1)} width={8} height={Y(0) - Y(1)} fill="var(--text-muted)" opacity={0.4} />
        {[0, 1, 3, 5, 8].map((e) => <text key={e} x={26} y={Y(e) + 3} textAnchor="end" className="viz-label">{e}</text>)}
        {rz && rz.slice(0, kk).map((th, j) => th.map((t, i) => (
          <circle key={`${j}-${i}`} cx={X(j + 1)} cy={Y(t)} r={1.4} fill={j === kk - 1 ? "var(--danger)" : "var(--accent)"} opacity={j === kk - 1 ? 1 : 0.55} />
        )))}
        <text x={X(1)} y={H - 4} className="viz-label">k = 1</text>
        <text x={X(K)} y={H - 4} textAnchor="end" className="viz-label">k = {K}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {rz ? `largest Ritz value ${cur[cur.length - 1].toFixed(8)}; Ritz values equal to 8 (to 10⁻⁶): ${copies}` : "computing…"}
        {reorth && rz && k > rz.length ? `; stops at k = ${rz.length} = n` : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The matrix is 50 × 50 with 47 eigenvalues spread over [0, 1] (grey bar) and three outliers at 3, 5 and 8. Column k
        shows the eigenvalues of the k × k tridiagonal matrix built after k Lanczos steps (red for the current k). The
        outliers are found within a few steps, long before anything in the bulk is resolved. Without reorthogonalisation,
        rounding errors make the Lanczos vectors lose orthogonality once a Ritz value converges, and the converged
        eigenvalue reappears as extra copies, the ghosts, from about k = 20 on. With full reorthogonalisation each
        eigenvalue appears once, and at k = n the Ritz values are exactly the spectrum.
      </figcaption>
    </figure>
  );
}
