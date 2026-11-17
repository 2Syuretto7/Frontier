"use client";

import { useEffect, useState } from "react";

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

const N = 60, MS = [6, 12, 24, 48], RUNS = 24;
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function orth(C: number[][]): number[][] {
  const Q: number[][] = [];
  for (const c of C) {
    let v = c.slice();
    for (let pass = 0; pass < 2; pass++) for (const q of Q) { const r = dot(q, v); v = v.map((x, i) => x - r * q[i]); }
    const nv = Math.sqrt(dot(v, v));
    if (nv > 1e-12) Q.push(v.map((x) => x / nv));
  }
  return Q;
}

/** Mean relative error of Hutchinson (Gaussian and Rademacher probes) and Hutch++ against the number of matrix-vector products, for a PSD matrix with eigenvalues j^(−α). */
export function HutchErrorViz() {
  const [alpha, setAlpha] = useState(1);
  const [res, setRes] = useState<number[][] | null>(null);
  useEffect(() => {
    const r = makeRng(41 + 7 * alpha);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const sign = (): number => (r() < 0.5 ? -1 : 1);
    const U = orth(Array.from({ length: N }, () => Array.from({ length: N }, normal)));
    const lam = Array.from({ length: N }, (_, j) => (j + 1) ** -alpha);
    const A = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, k) => U.reduce((s, u, j) => s + u[i] * lam[j] * u[k], 0)));
    const mv = (v: number[]) => A.map((row) => dot(row, v));
    const tr = lam.reduce((s, v) => s + v, 0);
    const out = MS.map((m) => {
      let eg = 0, er = 0, ep = 0;
      for (let run = 0; run < RUNS; run++) {
        let sg = 0, sr = 0;
        for (let t = 0; t < m; t++) {
          const g = Array.from({ length: N }, normal); sg += dot(g, mv(g));
          const s = Array.from({ length: N }, sign); sr += dot(s, mv(s));
        }
        eg += Math.abs(sg / m - tr) / tr; er += Math.abs(sr / m - tr) / tr;
        const k = m / 3;
        const Q = orth(Array.from({ length: k }, () => mv(Array.from({ length: N }, sign))));
        let t1 = 0;
        for (const q of Q) t1 += dot(q, mv(q));
        let t2 = 0;
        for (let t = 0; t < k; t++) {
          let v = Array.from({ length: N }, sign);
          for (const q of Q) { const c = dot(q, v); v = v.map((x, i) => x - c * q[i]); }
          let w = mv(v);
          for (const q of Q) { const c = dot(q, w); w = w.map((x, i) => x - c * q[i]); }
          t2 += dot(v, w);
        }
        ep += Math.abs(t1 + t2 / k - tr) / tr;
      }
      return [eg / RUNS, er / RUNS, ep / RUNS];
    });
    setRes(out);
  }, [alpha]);
  const W = 330, H = 160;
  const X = (m: number) => 34 + ((Math.log2(m) - Math.log2(6)) / 3) * (W - 50);
  const Yv = (e: number) => 10 + ((0 - Math.log10(Math.max(e, 1e-4))) / 4) * (H - 30);
  const colors = ["var(--text-muted)", "var(--accent)", "var(--danger)"];
  const names = ["Gaussian", "Rademacher", "Hutch++"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {[0, 1, 2].map((a) => (
          <button key={a} type="button" className="seg" aria-pressed={alpha === a} onClick={() => setAlpha(a)}>
            eigenvalues j^−{a}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error of trace estimators against number of matrix-vector products">
        {[0, -1, -2, -3, -4].map((l) => (
          <g key={l}>
            <line x1={X(6)} x2={X(48)} y1={Yv(10 ** l)} y2={Yv(10 ** l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={Yv(10 ** l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
          </g>
        ))}
        {res && [0, 1, 2].map((a) => (
          <g key={a}>
            <polyline fill="none" stroke={colors[a]} strokeWidth={1.8} strokeDasharray={a === 0 ? "4 3" : undefined} points={res.map((e, i) => `${X(MS[i]).toFixed(1)},${Yv(e[a]).toFixed(1)}`).join(" ")} />
            {res.map((e, i) => <circle key={i} cx={X(MS[i])} cy={Yv(e[a])} r={2.4} fill={colors[a]} />)}
          </g>
        ))}
        {MS.map((m) => <text key={m} x={X(m)} y={H - 6} textAnchor="middle" className="viz-label">m = {m}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res ? names.map((nm, a) => `${nm} ${res[MS.length - 1][a].toExponential(1)}`).join("; ") + " at m = 48" : "computing…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Mean relative error over 24 runs of three estimates of the trace of a 60 × 60 positive semidefinite matrix, against
        the number m of matrix-vector products used. Gaussian probes (grey dashed) and random signs (accent) both improve
        like 1/√m, with signs slightly better. Hutch++ (red) spends a third of its products finding the top eigenvectors,
        computes their part of the trace exactly, and applies Hutchinson only to what is left; when the eigenvalues decay,
        what is left is small and its error falls much faster, roughly like 1/m. With α = 0 the matrix is the identity:
        every sign vector has vᵀv = n exactly, so random signs make no error at all, while Gaussian probes still do.
      </figcaption>
    </figure>
  );
}
