"use client";

import { useMemo, useState } from "react";

const D = 40, NS = [20, 40, 80, 160, 640, 2560];

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

/** Eigenvalues of a symmetric matrix by cyclic Jacobi rotations. */
export function eigenvalues(A: number[][]) {
  const a = A.map((r) => r.slice()), n = a.length;
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = a[k][p], akq = a[k][q];
        a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = a[p][k], aqk = a[q][k];
        a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
      }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => x - y);
}

/** Eigenvalues of the sample covariance of n standard Gaussian vectors in dimension D, with the predicted edges. */
export function simulate(n: number) {
  const r = rand(11 + n);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const S = Array.from({ length: D }, () => new Array(D).fill(0));
  for (let k = 0; k < n; k++) {
    const x = Array.from({ length: D }, g);
    for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) S[i][j] += (x[i] * x[j]) / n;
  }
  const ev = eigenvalues(S);
  const ratio = Math.sqrt(D / n);
  return { ev, lo: Math.max(0, 1 - ratio) ** 2, hi: (1 + ratio) ** 2, err: Math.max(Math.abs(ev[0] - 1), Math.abs(ev[D - 1] - 1)) };
}

export function SampleSpectrumViz() {
  const [n, setN] = useState(160);
  const { ev, lo, hi, err } = useMemo(() => simulate(n), [n]);
  const W = 330, H = 96, X0 = 12, PW = W - 24, MAX = 6, Y = 40;
  const sx = (v: number) => X0 + (Math.min(v, MAX) / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">samples n</span>
        <div className="segmented" role="group" aria-label="Number of samples">
          {NS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={n === v} onClick={() => setN(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Eigenvalues of a sample covariance matrix">
        <rect x={sx(lo)} y={Y - 22} width={sx(hi) - sx(lo)} height={44} fill="var(--accent-soft)" opacity={0.5} />
        <line x1={X0} x2={X0 + PW} y1={Y} y2={Y} stroke="var(--border)" />
        <line x1={sx(1)} x2={sx(1)} y1={Y - 24} y2={Y + 24} stroke="var(--danger)" strokeWidth={1.5} />
        {ev.map((v, i) => (
          <line key={i} x1={sx(v)} x2={sx(v)} y1={Y - 14} y2={Y + 14} stroke="var(--accent)" strokeWidth={1.5} opacity={0.8} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((v) => (
          <text key={v} x={sx(v)} y={Y + 40} textAnchor="middle" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`eigenvalues ${Math.max(0, ev[0]).toFixed(2)} to ${ev[D - 1].toFixed(2)}; predicted ${lo.toFixed(2)} to ${hi.toFixed(2)}; ‖Σ̂ − I‖ = ${err.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        The 40 eigenvalues (blue ticks) of the sample covariance of n standard Gaussian vectors in 40 dimensions. Every true
        eigenvalue is 1 (red). With n = 160 samples, four per dimension, they still spread from about 0.26 to 2.0, close to
        the predicted band (1 ± √(d/n))² (shaded). With fewer samples than dimensions, d − n eigenvalues are exactly zero. The
        operator-norm error shrinks like √(d/n), so a relative error ε needs a number of samples proportional to d/ε².
      </figcaption>
    </figure>
  );
}
