"use client";

import { useState } from "react";

const N = 6;

function symMatrix(seed: number) {
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return (s / 2147483648) * 2 - 1; };
  const A = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) for (let j = i; j < N; j++) { const v = rnd() * 2; A[i][j] = v; A[j][i] = v; }
  return A;
}

function jacobiEigs(M: number[][]) {
  // cyclic Jacobi rotations for a small symmetric matrix
  const A = M.map((r) => r.slice());
  const n = A.length;
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
      }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => a - b);
}

/** Eigenvalues of the leading k×k blocks of a symmetric matrix interlace, a corollary of Courant–Fischer. */
export function InterlaceViz() {
  const [seed, setSeed] = useState(1);
  const A = symMatrix(seed);
  const rows = Array.from({ length: N }, (_, k) => jacobiEigs(A.slice(0, k + 1).map((r) => r.slice(0, k + 1))));
  const all = rows.flat();
  const lo = Math.min(...all) - 0.3, hi = Math.max(...all) + 0.3;
  const W = 320, H = 200;
  const X = (v: number) => 40 + ((v - lo) / (hi - lo)) * (W - 50);
  const Y = (k: number) => 20 + k * 30;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>another matrix</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Eigenvalues of nested leading blocks">
        {rows.map((ev, k) => (
          <g key={k}>
            <text x={4} y={Y(k) + 4} className="viz-label">k={k + 1}</text>
            <line x1={40} x2={W - 10} y1={Y(k)} y2={Y(k)} stroke="var(--border)" />
            {k > 0 && ev.map((v, i) => (
              <line key={`g${i}`} x1={X(v)} x2={X(v)} y1={Y(k)} y2={Y(k - 1)} stroke="var(--text-muted)" strokeDasharray="2 3" />
            ))}
            {ev.map((v, i) => <circle key={i} cx={X(v)} cy={Y(k)} r={4} fill={k === N - 1 ? "var(--accent)" : "var(--text)"} />)}
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Row k shows the k eigenvalues of the top-left k×k block of a random symmetric 6×6 matrix. Each eigenvalue of row k
        lies between two neighbouring eigenvalues of row k + 1 (follow the dotted lines down): the rows interlace. Adding a
        row and column can push the extreme eigenvalues outwards but never past the next ones. Courant–Fischer proves this
        for every symmetric matrix.
      </figcaption>
    </figure>
  );
}
