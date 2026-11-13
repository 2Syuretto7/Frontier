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

/** Growth factor max|intermediate| / max|A| of elimination with partial pivoting. */
function growth(A: number[][]): number {
  const n = A.length;
  const U = A.map((r) => r.slice());
  const amax = Math.max(...U.flat().map(Math.abs));
  let big = amax;
  for (let k = 0; k < n - 1; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[p][k])) p = i;
    [U[k], U[p]] = [U[p], U[k]];
    for (let i = k + 1; i < n; i++) {
      const l = U[i][k] / U[k][k];
      for (let j = k; j < n; j++) {
        U[i][j] -= l * U[k][j];
        big = Math.max(big, Math.abs(U[i][j]));
      }
    }
  }
  return big / amax;
}

const NMAX = 60;

/** Growth factor of Gaussian elimination with partial pivoting: 2^(n−1) for Wilkinson's matrix, small for random matrices. */
export function GrowthFactorViz() {
  const [n, setN] = useState(30);
  const [rand, setRand] = useState<number[] | null>(null);
  useEffect(() => {
    const r = makeRng(2024);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const out: number[] = [];
    for (let m = 2; m <= NMAX; m++) {
      const A = Array.from({ length: m }, () => Array.from({ length: m }, normal));
      out.push(growth(A));
    }
    setRand(out);
  }, []);
  const W = 330, H = 160, ymax = 64;
  const X = (m: number) => 30 + ((m - 2) / (NMAX - 2)) * (W - 40);
  const Y = (l: number) => H - 20 - (Math.min(l, ymax) / ymax) * (H - 30);
  const wil = Array.from({ length: NMAX - 1 }, (_, i) => i + 2);
  const rn = rand ? rand[n - 2] : null;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={2} max={NMAX} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="matrix size" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Log base 2 of the growth factor against matrix size for Wilkinson's matrix and random matrices">
        {[0, 16, 32, 48, 64].map((l) => (
          <g key={l}>
            <line x1={30} x2={W - 10} y1={Y(l)} y2={Y(l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={26} y={Y(l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `2^${l}`}</text>
          </g>
        ))}
        <line x1={30} x2={W - 10} y1={Y(53)} y2={Y(53)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <text x={34} y={Y(53) - 3} className="viz-label">1/u = 2^53</text>
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={wil.map((m) => `${X(m).toFixed(1)},${Y(m - 1).toFixed(1)}`).join(" ")} />
        {rand && rand.map((g, i) => <circle key={i} cx={X(i + 2)} cy={Y(Math.log2(g))} r={1.8} fill="var(--accent)" />)}
        <line x1={X(n)} x2={X(n)} y1={8} y2={H - 20} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={X(2)} y={H - 6} className="viz-label">n = 2</text>
        <text x={X(NMAX)} y={H - 6} textAnchor="end" className="viz-label">n = {NMAX}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        Wilkinson: growth 2^{n - 1} = {(2 ** (n - 1)).toExponential(2)}; random normal: growth {rn === null ? "…" : rn.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The backward error of elimination with partial pivoting is bounded by a modest multiple of the growth factor times
        the unit roundoff. Wilkinson&apos;s matrix (1 on the diagonal, −1 below it, 1 in the last column) doubles the last
        column at every step, so its growth is 2^(n − 1) (red line) and passes 1/u near n = 54, where every digit can be
        lost. The dots are random normal matrices of each size: their growth stays in single digits, which is why partial
        pivoting is trusted in practice despite the exponential worst case.
      </figcaption>
    </figure>
  );
}
