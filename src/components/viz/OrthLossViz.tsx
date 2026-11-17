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

type Mat = number[][]; // column-major: Mat[j] is column j
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const nrm = (a: number[]) => Math.sqrt(dot(a, a));

function cgs(A: Mat): Mat {
  const Q: Mat = [];
  for (const a of A) {
    const r = Q.map((q) => dot(q, a));
    const v = a.map((x, i) => x - Q.reduce((s, q, k) => s + q[i] * r[k], 0));
    const t = nrm(v);
    Q.push(v.map((x) => x / t));
  }
  return Q;
}

function mgs(A: Mat): Mat {
  const Q = A.map((c) => c.slice());
  for (let j = 0; j < Q.length; j++) {
    const t = nrm(Q[j]);
    Q[j] = Q[j].map((x) => x / t);
    for (let k = j + 1; k < Q.length; k++) {
      const r = dot(Q[j], Q[k]);
      Q[k] = Q[k].map((x, i) => x - r * Q[j][i]);
    }
  }
  return Q;
}

function householderQ(A: Mat): Mat {
  const m = A[0].length, n = A.length;
  const R = A.map((c) => c.slice());
  const vs: number[][] = [];
  for (let k = 0; k < n; k++) {
    const x = R[k].slice(k);
    const v = x.slice();
    v[0] += (x[0] >= 0 ? 1 : -1) * nrm(x);
    const t = nrm(v);
    for (let i = 0; i < v.length; i++) v[i] /= t;
    for (let j = k; j < n; j++) {
      const c = 2 * v.reduce((s, vi, i) => s + vi * R[j][k + i], 0);
      for (let i = 0; i < v.length; i++) R[j][k + i] -= c * v[i];
    }
    vs.push(v);
  }
  const Q: Mat = Array.from({ length: n }, (_, j) => Array.from({ length: m }, (_, i) => (i === j ? 1 : 0)));
  for (let k = n - 1; k >= 0; k--) {
    const v = vs[k];
    for (const q of Q) {
      const c = 2 * v.reduce((s, vi, i) => s + vi * q[k + i], 0);
      for (let i = 0; i < v.length; i++) q[k + i] -= c * v[i];
    }
  }
  return Q;
}

function loss(Q: Mat) {
  let s = 0;
  for (let i = 0; i < Q.length; i++) for (let j = 0; j < Q.length; j++) { const d = dot(Q[i], Q[j]) - (i === j ? 1 : 0); s += d * d; }
  return Math.sqrt(s);
}

const M = 30, N = 8, EXPS = Array.from({ length: 33 }, (_, i) => i / 2);

/** Loss of orthogonality ‖QᵀQ − I‖ for classical and modified Gram-Schmidt and Householder QR, as the condition number of A grows. */
export function OrthLossViz() {
  const [k, setK] = useState(16);
  const [data, setData] = useState<number[][] | null>(null);
  useEffect(() => {
    const r = makeRng(77);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const orth = (m: number, n: number) => mgs(mgs(Array.from({ length: n }, () => Array.from({ length: m }, normal))));
    const U = orth(M, N), V = orth(N, N);
    setData(
      EXPS.map((e) => {
        const s = Array.from({ length: N }, (_, j) => 10 ** (-(e * j) / (N - 1)));
        const A: Mat = Array.from({ length: N }, (_, c) => Array.from({ length: M }, (_, i) => U.reduce((acc, u, j) => acc + u[i] * s[j] * V[j][c], 0)));
        return [cgs(A), mgs(A), householderQ(A)].map((Q) => Math.log10(Math.max(loss(Q), 1e-17)));
      }),
    );
  }, []);
  const W = 330, H = 160;
  const X = (e: number) => 34 + (e / 16) * (W - 44);
  const Y = (l: number) => 10 + ((1 - Math.max(-17, Math.min(l, 1))) / 18) * (H - 32);
  const colors = ["var(--danger)", "var(--text-muted)", "var(--accent)"];
  const names = ["classical GS", "modified GS", "Householder"];
  const row = data ? data[k] : null;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          κ(A) = 10^{EXPS[k].toFixed(1)}
          <input type="range" min={0} max={EXPS.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="log condition number" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Loss of orthogonality against condition number for three QR algorithms">
        {[0, -4, -8, -12, -16].map((l) => (
          <g key={l}>
            <line x1={X(0)} x2={X(16)} y1={Y(l)} y2={Y(l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={Y(l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
          </g>
        ))}
        {data && [0, 1, 2].map((a) => (
          <polyline key={a} fill="none" stroke={colors[a]} strokeWidth={1.8} strokeDasharray={a === 1 ? "5 3" : undefined} points={data.map((d, i) => `${X(EXPS[i]).toFixed(1)},${Y(d[a]).toFixed(1)}`).join(" ")} />
        ))}
        <line x1={X(EXPS[k])} x2={X(EXPS[k])} y1={8} y2={H - 22} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 8} className="viz-label">κ = 1</text>
        <text x={X(16)} y={H - 8} textAnchor="end" className="viz-label">κ = 1e16</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {row ? names.map((nm, a) => `${nm}: 1e${row[a].toFixed(1)}`).join("; ") : "computing…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each curve is ‖QᵀQ − I‖ for a 30 × 8 matrix with singular values spread from 1 to 1/κ. Classical Gram-Schmidt (red)
        loses orthogonality like κ²u and is useless by κ ≈ 10⁸. Modified Gram-Schmidt (grey, dashed) degrades like κu.
        Householder QR (accent) stays at the level of the unit roundoff whatever κ is, because it never subtracts
        projections: it applies exact orthogonal reflections, which do not amplify errors.
      </figcaption>
    </figure>
  );
}
