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

const N = 40;

/** Eigenvalues of a symmetric matrix by cyclic Jacobi rotations. */
function symEigs(A0: number[][]): number[] {
  const A = A0.map((r) => r.slice());
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0;
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) off += A[p][q] * A[p][q];
    if (off < 1e-22) break;
    for (let p = 0; p < N - 1; p++) {
      for (let q = p + 1; q < N; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < N; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < N; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
      }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => a - b);
}

function cgIters(A: number[][], minv: number[]) {
  const b = Array(N).fill(1);
  let x = Array(N).fill(0), r = b.slice();
  let z = r.map((v, i) => v * minv[i]);
  let p = z.slice(), rz = r.reduce((s, v, i) => s + v * z[i], 0);
  const nb = Math.sqrt(N);
  for (let k = 0; k < 2000; k++) {
    if (Math.sqrt(r.reduce((s, v) => s + v * v, 0)) <= 1e-8 * nb) return k;
    const Ap = A.map((row) => row.reduce((s, v, j) => s + v * p[j], 0));
    const al = rz / p.reduce((s, v, i) => s + v * Ap[i], 0);
    x = x.map((v, i) => v + al * p[i]);
    r = r.map((v, i) => v - al * Ap[i]);
    z = r.map((v, i) => v * minv[i]);
    const rzn = r.reduce((s, v, i) => s + v * z[i], 0);
    p = z.map((v, i) => v + (rzn / rz) * p[i]);
    rz = rzn;
  }
  return 2000;
}

/** Eigenvalues of A = DCD (C well conditioned, D diagonal with a wide range) and of the Jacobi-preconditioned D⁻¹ᐟ²AD⁻¹ᐟ², on a log scale. */
export function PrecondSpectrumViz() {
  const [spread, setSpread] = useState(2);
  const [C, setC] = useState<number[][] | null>(null);
  useEffect(() => {
    const r = makeRng(99);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const G = Array.from({ length: N }, () => Array.from({ length: N }, normal));
    setC(G.map((gi, i) => G.map((gj, j) => gi.reduce((s, v, k) => s + v * gj[k], 0) / N + (i === j ? 1 : 0))));
  }, []);
  const res = useMemo(() => {
    if (!C) return null;
    const d = Array.from({ length: N }, (_, i) => 10 ** ((spread * i) / (N - 1)));
    const A = C.map((row, i) => row.map((v, j) => d[i] * v * d[j]));
    const diag = A.map((r, i) => r[i]);
    const S = A.map((row, i) => row.map((v, j) => v / Math.sqrt(diag[i] * diag[j])));
    return {
      ea: symEigs(A), es: symEigs(S),
      ka: cgIters(A, Array(N).fill(1)), ks: cgIters(A, diag.map((v) => 1 / v)),
    };
  }, [C, spread]);
  const W = 330, H = 130;
  const lo = -1, hi = 9;
  const X = (v: number) => 20 + ((Math.log10(v) - lo) / (hi - lo)) * (W - 40);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          scales of the variables span 10^{spread.toFixed(1)}
          <input type="range" min={0} max={4} step={0.5} value={spread} onChange={(e) => setSpread(Number(e.target.value))} aria-label="scale spread" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Eigenvalues before and after Jacobi preconditioning on a log scale">
        {[0, 3, 6, 9].map((l) => (
          <g key={l}>
            <line x1={X(10 ** l)} x2={X(10 ** l)} y1={20} y2={H - 22} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X(10 ** l)} y={H - 8} textAnchor="middle" className="viz-label">1e{l}</text>
          </g>
        ))}
        <text x={20} y={14} className="viz-label">A</text>
        <text x={20} y={64} className="viz-label">Jacobi-preconditioned</text>
        {res && res.ea.map((v, i) => <circle key={`a${i}`} cx={X(v)} cy={34} r={2.4} fill="var(--danger)" opacity={0.7} />)}
        {res && res.es.map((v, i) => <circle key={`s${i}`} cx={X(v)} cy={84} r={2.4} fill="var(--accent)" opacity={0.7} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res
          ? `κ(A) = ${(res.ea[N - 1] / res.ea[0]).toExponential(1)}, CG steps to 10⁻⁸: ${res.ka}; preconditioned κ = ${(res.es[N - 1] / res.es[0]).toFixed(1)}, PCG steps: ${res.ks}`
          : "computing…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A is a well-conditioned 40 × 40 matrix C whose rows and columns are rescaled by factors spread over the chosen
        range, as happens when features are measured in wildly different units. The red dots are its eigenvalues, smeared
        over many decades, and CG needs many steps. Jacobi preconditioning divides by the diagonal, undoing the scaling:
        the accent dots are the eigenvalues of D⁻¹ᐟ²AD⁻¹ᐟ², which stay in a narrow band whatever the spread, and PCG
        needs the same handful of steps every time.
      </figcaption>
    </figure>
  );
}
