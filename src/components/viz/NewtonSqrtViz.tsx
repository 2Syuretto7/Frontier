"use client";

import { useEffect, useState } from "react";

type Mat = number[][];
const N = 4, ITERS = 30;
const mul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const add = (A: Mat, B: Mat, a = 0.5): Mat => A.map((r, i) => r.map((v, j) => a * (v + B[i][j])));

function inv(A: Mat): Mat | null {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < 1e-300 || !Number.isFinite(M[p][k])) return null;
    [M[k], M[p]] = [M[p], M[k]];
    const d = M[k][k];
    M[k] = M[k].map((v) => v / d);
    for (let i = 0; i < n; i++) if (i !== k) { const l = M[i][k]; M[i] = M[i].map((v, j) => v - l * M[k][j]); }
  }
  return M.map((r) => r.slice(n));
}

function rotation(): Mat {
  let Q: Mat = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : 0)));
  const angles = [0.7, 1.1, 0.4, 2.0, 0.9, 1.6];
  let a = 0;
  for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) {
    const c = Math.cos(angles[a]), s = Math.sin(angles[a]); a++;
    const G: Mat = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : 0)));
    G[p][p] = c; G[q][q] = c; G[p][q] = -s; G[q][p] = s;
    Q = mul(Q, G);
  }
  return Q;
}

function run(logk: number) {
  const Q = rotation();
  const lam = Array.from({ length: N }, (_, i) => 10 ** (-(logk * i) / (N - 1)));
  const build = (f: (l: number) => number): Mat => Q.map((qi) => Q.map((qj) => qi.reduce((s, v, k) => s + v * f(lam[k]) * qj[k], 0)));
  const A = build((l) => l), S = build((l) => Math.sqrt(l));
  const nS = Math.sqrt(S.flat().reduce((s, v) => s + v * v, 0));
  const err = (X: Mat) => Math.sqrt(X.flat().reduce((s, v, i) => s + (v - S.flat()[i]) ** 2, 0)) / nS;
  const newton: number[] = [], db: number[] = [];
  let X: Mat | null = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : 0)));
  let Y: Mat = A, Z: Mat = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : 0)));
  for (let k = 0; k <= ITERS; k++) {
    newton.push(X ? Math.min(err(X), 1e3) : 1e3);
    db.push(err(Y));
    if (X) { const Xi = inv(X); X = Xi ? add(X, mul(Xi, A)) : null; if (X && !X.flat().every(Number.isFinite)) X = null; }
    const Zi = inv(Z), Yi = inv(Y);
    if (Zi && Yi) { const Yn = add(Y, Zi), Zn = add(Z, Yi); Y = Yn; Z = Zn; }
  }
  return { newton, db };
}

/** Error of plain Newton X ← (X + X⁻¹A)/2 and of the Denman–Beavers coupled iteration for the square root of a 4 × 4 SPD matrix. */
export function NewtonSqrtViz() {
  const [lk, setLk] = useState(4);
  const [res, setRes] = useState<{ newton: number[]; db: number[] } | null>(null);
  useEffect(() => setRes(run(lk)), [lk]);
  const W = 330, H = 160;
  const X0 = (k: number) => 34 + (k / ITERS) * (W - 44);
  const Y0 = (e: number) => 10 + ((3 - Math.max(-16, Math.min(3, Math.log10(Math.max(e, 1e-16))))) / 19) * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          κ(A) = 10^{lk.toFixed(1)}
          <input type="range" min={0.5} max={8} step={0.5} value={lk} onChange={(e) => setLk(Number(e.target.value))} aria-label="log condition number" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error of two square-root iterations against iteration count">
        {[0, -4, -8, -12, -16].map((l) => (
          <g key={l}>
            <line x1={X0(0)} x2={X0(ITERS)} y1={Y0(10 ** l)} y2={Y0(10 ** l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={Y0(10 ** l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
          </g>
        ))}
        {res && (
          <>
            <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={res.newton.map((e, k) => `${X0(k).toFixed(1)},${Y0(e).toFixed(1)}`).join(" ")} />
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={res.db.map((e, k) => `${X0(k).toFixed(1)},${Y0(e).toFixed(1)}`).join(" ")} />
          </>
        )}
        <text x={X0(0)} y={H - 6} className="viz-label">k = 0</text>
        <text x={X0(ITERS)} y={H - 6} textAnchor="end" className="viz-label">k = {ITERS}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res ? `best Newton error ${Math.min(...res.newton).toExponential(1)}, final ${res.newton[ITERS].toExponential(1)}; Denman–Beavers final ${res.db[ITERS].toExponential(1)}` : "computing…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both iterations converge quadratically in exact arithmetic to the same square root. Plain Newton (red) assumes its
        iterate commutes with A; rounding breaks that, and the resulting errors are amplified at each step by factors as
        large as about √κ/2, so once κ exceeds 9 the iteration converges for a while and then drifts away and explodes. The
        coupled Denman–Beavers iteration (accent) carries an approximation to A⁻¹ᐟ² alongside A¹ᐟ², which keeps the errors
        from growing, and it settles at a small error for every κ shown, about 10⁻¹⁰ even at κ = 10⁸.
      </figcaption>
    </figure>
  );
}
