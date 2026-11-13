"use client";

import { useEffect, useState } from "react";

type Mat = number[][];
const N = 5, K = 40;
const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const mul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));

function qr(A: Mat): { Q: Mat; R: Mat } {
  const n = A.length;
  const R = A.map((r) => r.slice());
  let Q = eye(n);
  for (let k = 0; k < n - 1; k++) {
    const x = R.slice(k).map((r) => r[k]);
    const nx = Math.sqrt(x.reduce((s, v) => s + v * v, 0));
    if (nx === 0) continue;
    const v = x.slice();
    v[0] += (x[0] >= 0 ? 1 : -1) * nx;
    const nv = Math.sqrt(v.reduce((s, t) => s + t * t, 0));
    for (let i = 0; i < v.length; i++) v[i] /= nv;
    for (let j = 0; j < n; j++) {
      let d = 0;
      for (let i = 0; i < v.length; i++) d += v[i] * R[k + i][j];
      for (let i = 0; i < v.length; i++) R[k + i][j] -= 2 * d * v[i];
    }
    Q = Q.map((row) => {
      let d = 0;
      for (let i = 0; i < v.length; i++) d += row[k + i] * v[i];
      const out = row.slice();
      for (let i = 0; i < v.length; i++) out[k + i] -= 2 * d * v[i];
      return out;
    });
  }
  return { Q, R };
}

function wilkinson(a: number, b: number, c: number) {
  const d = (a - c) / 2;
  const s = d >= 0 ? 1 : -1;
  return c - (s * b * b) / (Math.abs(d) + Math.sqrt(d * d + b * b));
}

function run(shifted: boolean): Mat[] {
  let A: Mat = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? N - i : Math.abs(i - j) === 1 ? 1 : 0)));
  const out = [A];
  let m = N;
  for (let it = 0; it < K; it++) {
    if (!shifted) {
      const { Q, R } = qr(A);
      A = mul(R, Q);
    } else {
      while (m > 1 && Math.abs(A[m - 1][m - 2]) < 1e-15 * (Math.abs(A[m - 1][m - 1]) + Math.abs(A[m - 2][m - 2]))) m--;
      if (m > 1) {
        const mu = wilkinson(A[m - 2][m - 2], A[m - 1][m - 2], A[m - 1][m - 1]);
        const B = A.slice(0, m).map((r, i) => r.slice(0, m).map((v, j) => v - (i === j ? mu : 0)));
        const { Q, R } = qr(B);
        const C = mul(R, Q);
        A = A.map((r, i) => r.map((v, j) => (i < m && j < m ? C[i][j] + (i === j ? mu : 0) : v)));
      }
    }
    out.push(A);
  }
  return out;
}

/** The QR algorithm on a 5 × 5 symmetric tridiagonal matrix: magnitudes of the entries of Aₖ, without shifts and with Wilkinson shifts and deflation. */
export function QrIterViz() {
  const [shifted, setShifted] = useState(false);
  const [k, setK] = useState(10);
  const [data, setData] = useState<{ plain: Mat[]; shift: Mat[] } | null>(null);
  useEffect(() => setData({ plain: run(false), shift: run(true) }), []);
  const A = data ? (shifted ? data.shift : data.plain)[k] : null;
  const cell = 26, gx = 10, gy = 8;
  const W = 330, H = 150;
  const shade = (v: number) => {
    const l = Math.log10(Math.max(Math.abs(v), 1e-17));
    return Math.max(0, Math.min(1, (l + 16) / 17));
  };
  const lastSub = A ? Math.abs(A[N - 1][N - 2]) : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="seg" aria-pressed={!shifted} onClick={() => setShifted(false)}>no shift</button>
        <button type="button" className="seg" aria-pressed={shifted} onClick={() => setShifted(true)}>Wilkinson shift</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          k = {k}
          <input type="range" min={0} max={K} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="iteration" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Heat map of the entries of the k-th QR iterate">
        {A &&
          A.map((row, i) =>
            row.map((v, j) => (
              <g key={`${i}-${j}`}>
                <rect x={gx + j * cell} y={gy + i * cell} width={cell - 2} height={cell - 2} fill={i === j ? "var(--text-muted)" : "var(--accent)"} opacity={0.08 + 0.85 * shade(v)} />
              </g>
            )),
          )}
        {A && (
          <g>
            <text x={160} y={24} className="viz-label">diagonal of Aₖ:</text>
            {A.map((r, i) => (
              <text key={i} x={160} y={42 + i * 16} className="viz-label">{r[i].toFixed(6)}</text>
            ))}
            <text x={250} y={24} className="viz-label">|a₅₄|</text>
            <text x={250} y={42} className="viz-label">{lastSub === 0 ? "0" : lastSub.toExponential(1)}</text>
          </g>
        )}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Each square is an entry of Aₖ, darker for larger magnitude on a log scale from 10⁻¹⁶ to 10; the matrix starts
        tridiagonal with diagonal 5, 4, 3, 2, 1 and 1 next to the diagonal. Every step factors Aₖ = QR and sets Aₖ₊₁ = RQ,
        which is similar to Aₖ. Without shifts each subdiagonal entry shrinks by the ratio of neighbouring eigenvalues per
        step, so the off-diagonal fades slowly and the diagonal settles on the eigenvalues in decreasing order. With the
        Wilkinson shift the last subdiagonal entry collapses to roundoff in two or three steps; the last eigenvalue is then
        deflated and the work continues on the smaller block.
      </figcaption>
    </figure>
  );
}
