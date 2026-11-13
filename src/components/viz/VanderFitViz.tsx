"use client";

import { useEffect, useState } from "react";

const NPTS = 100, DMAX = 12;

function solveSquare(G: number[][], r: number[]): number[] {
  const n = r.length;
  const A = G.map((row, i) => [...row, r[i]]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
    [A[k], A[p]] = [A[p], A[k]];
    for (let i = k + 1; i < n; i++) {
      const l = A[i][k] / A[k][k];
      for (let j = k; j <= n; j++) A[i][j] -= l * A[k][j];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = A[i][n];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

/** Householder QR least squares: cols[j] is column j, b the right-hand side. */
function qrSolve(cols: number[][], b0: number[]): number[] {
  const n = cols.length;
  const C = cols.map((c) => c.slice());
  const b = b0.slice();
  for (let k = 0; k < n; k++) {
    const v = C[k].slice(k);
    const nx = Math.hypot(...v);
    v[0] += (v[0] >= 0 ? 1 : -1) * nx;
    const nv = Math.hypot(...v);
    for (let i = 0; i < v.length; i++) v[i] /= nv;
    for (const c of [...C.slice(k), b]) {
      let d = 0;
      for (let i = 0; i < v.length; i++) d += v[i] * c[k + i];
      for (let i = 0; i < v.length; i++) c[k + i] -= 2 * d * v[i];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= C[j][i] * x[j];
    x[i] = s / C[i][i];
  }
  return x;
}

function digits(x: number[]) {
  const e = Math.sqrt(x.reduce((s, v) => s + (v - 1) ** 2, 0) / x.length);
  return e === 0 ? 16 : Math.max(0, Math.min(16, -Math.log10(e)));
}

/** Fitting a polynomial of degree d to 100 points on [0, 1] in the monomial basis, by the normal equations and by QR. */
export function VanderFitViz() {
  const [d, setD] = useState(6);
  const [res, setRes] = useState<{ ne: number; qr: number }[] | null>(null);
  useEffect(() => {
    const t = Array.from({ length: NPTS }, (_, i) => i / (NPTS - 1));
    const out = [];
    for (let deg = 1; deg <= DMAX; deg++) {
      const cols = Array.from({ length: deg + 1 }, (_, j) => t.map((x) => x ** j));
      const b = t.map((_, i) => cols.reduce((s, c) => s + c[i], 0));
      const G = cols.map((ci) => cols.map((cj) => ci.reduce((s, v, i) => s + v * cj[i], 0)));
      const r = cols.map((c) => c.reduce((s, v, i) => s + v * b[i], 0));
      const ne = digits(solveSquare(G, r));
      const qr = digits(qrSolve(cols, b));
      out.push({ ne, qr });
    }
    setRes(out);
  }, []);
  const W = 330, H = 160;
  const X = (deg: number) => 34 + ((deg - 1) / (DMAX - 1)) * (W - 44);
  const Y = (dg: number) => 10 + ((16 - dg) / 16) * (H - 32);
  const cur = res ? res[d - 1] : null;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          degree d = {d}
          <input type="range" min={1} max={DMAX} value={d} onChange={(e) => setD(Number(e.target.value))} aria-label="polynomial degree" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Correct digits in the fitted coefficients for the normal equations and for QR, against degree">
        {[0, 4, 8, 12, 16].map((g) => (
          <g key={g}>
            <line x1={X(1)} x2={X(DMAX)} y1={Y(g)} y2={Y(g)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={Y(g) + 3} textAnchor="end" className="viz-label">{g}</text>
          </g>
        ))}
        {res && (
          <>
            <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={res.map((r, i) => `${X(i + 1).toFixed(1)},${Y(r.ne).toFixed(1)}`).join(" ")} />
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={res.map((r, i) => `${X(i + 1).toFixed(1)},${Y(r.qr).toFixed(1)}`).join(" ")} />
          </>
        )}
        <line x1={X(d)} x2={X(d)} y1={8} y2={H - 22} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={X(1)} y={H - 8} className="viz-label">d = 1</text>
        <text x={X(DMAX)} y={H - 8} textAnchor="end" className="viz-label">d = {DMAX}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        correct digits: normal equations {cur ? cur.ne.toFixed(1) : "…"}, QR {cur ? cur.qr.toFixed(1) : "…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The data are exactly 1 + t + … + t^d at 100 points in [0, 1], so the true coefficients are all 1 and the residual is
        zero. The monomial columns become nearly dependent as d grows, and κ(A) grows roughly tenfold every two degrees.
        QR (accent) loses about log₁₀ κ(A) digits; the normal equations (red) lose about twice as many, because they solve
        with AᵀA, whose condition number is κ(A)², and are out of digits by degree 12.
      </figcaption>
    </figure>
  );
}
