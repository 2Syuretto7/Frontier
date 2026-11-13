"use client";

import { useEffect, useMemo, useState } from "react";

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

type Cols = number[][]; // array of column vectors
const M = 80, N = 60, R = 60, K = 10, P = 5;
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function orth(C: Cols): Cols {
  const Q: Cols = [];
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? C : Q.splice(0);
    for (const c of src) {
      let v = c.slice();
      for (const q of Q) { const r = dot(q, v); v = v.map((x, i) => x - r * q[i]); }
      const nv = Math.sqrt(dot(v, v));
      Q.push(v.map((x) => x / nv));
    }
  }
  return Q;
}

function symEigs(A0: number[][]): number[] {
  const n = A0.length, A = A0.map((r) => r.slice());
  for (let sweep = 0; sweep < 40; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < 1e-30) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => b - a);
}

/** Randomised SVD with k = 10 and oversampling 5 on an 80 × 60 matrix: estimated against true singular values, with q power iterations. */
export function RsvdSpectrumViz() {
  const [slow, setSlow] = useState(true);
  const [q, setQ] = useState(0);
  const [base, setBase] = useState<{ U: Cols; V: Cols; Om: Cols } | null>(null);
  useEffect(() => {
    const r = makeRng(31);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const U = orth(Array.from({ length: R }, () => Array.from({ length: M }, normal)));
    const V = orth(Array.from({ length: R }, () => Array.from({ length: N }, normal)));
    const Om = Array.from({ length: K + P }, () => Array.from({ length: N }, normal));
    setBase({ U, V, Om });
  }, []);
  const sv = useMemo(() => Array.from({ length: R }, (_, j) => (slow ? 1 / (j + 1) : 0.6 ** j)), [slow]);
  const est = useMemo(() => {
    if (!base) return null;
    const { U, V, Om } = base;
    const Av = (x: number[]) => { const c = V.map((v, j) => sv[j] * dot(v, x)); return Array.from({ length: M }, (_, i) => c.reduce((s, cj, j) => s + cj * U[j][i], 0)); };
    const ATv = (y: number[]) => { const c = U.map((u, j) => sv[j] * dot(u, y)); return Array.from({ length: N }, (_, i) => c.reduce((s, cj, j) => s + cj * V[j][i], 0)); };
    let Q = orth(Om.map(Av));
    for (let t = 0; t < q; t++) Q = orth(orth(Q.map(ATv)).map(Av));
    const B = Q.map((qc) => ATv(qc)); // rows of QᵀA, as vectors of length N
    const G = B.map((bi) => B.map((bj) => dot(bi, bj)));
    return symEigs(G).map((l) => Math.sqrt(Math.max(l, 0))).slice(0, K);
  }, [base, sv, q]);
  const W = 330, H = 150;
  const X = (j: number) => 28 + (j / 15) * (W - 40);
  const lo = slow ? -1.3 : -3.5;
  const Y = (v: number) => 10 + ((0 - Math.log10(Math.max(v, 1e-6))) / -lo) * (H - 30);
  const errTop = est ? Math.max(...est.map((e, j) => Math.abs(e - sv[j]) / sv[j])) : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="seg" aria-pressed={!slow} onClick={() => setSlow(false)}>fast decay 0.6ʲ</button>
        <button type="button" className="seg" aria-pressed={slow} onClick={() => setSlow(true)}>slow decay 1/j</button>
        {[0, 1, 2].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={q === v} onClick={() => setQ(v)}>q = {v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="True and estimated singular values on a log scale">
        {sv.slice(0, 16).map((v, j) => <circle key={`t${j}`} cx={X(j)} cy={Y(v)} r={4} fill="none" stroke="var(--text-muted)" />)}
        {est && est.map((v, j) => <circle key={`e${j}`} cx={X(j)} cy={Y(v)} r={2.4} fill="var(--accent)" />)}
        <line x1={X(K - 0.5)} x2={X(K - 0.5)} y1={8} y2={H - 20} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 4} className="viz-label">j = 1</text>
        <text x={X(K - 0.5)} y={H - 4} textAnchor="middle" className="viz-label">k = {K}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        largest relative error in the top {K} estimates: {est ? errTop.toExponential(1) : "…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey rings are the true singular values (log scale); accent dots are the top 10 estimated by sketching A with 15
        random vectors, orthonormalising, and taking the SVD of the small matrix QᵀA. When the spectrum decays fast, the
        sketch captures the top directions almost exactly even with q = 0. With slow decay the tail leaks into the sketch
        and the estimates sag; each power iteration multiplies by AAᵀ, which raises every singular value to a higher
        power and so sharpens the decay, and q = 1 or 2 already recovers them.
      </figcaption>
    </figure>
  );
}
