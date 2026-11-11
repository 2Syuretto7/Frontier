/** Small dense linear algebra for visualisations. Matrices are arrays of rows. */
export type Mat = number[][];
export type Vec = number[];

export const clone = (A: Mat): Mat => A.map((r) => [...r]);
export const T = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));
export const mul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
export const mv = (A: Mat, x: Vec): Vec => A.map((r) => r.reduce((s, a, k) => s + a * x[k], 0));
export const dot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i], 0);
export const norm = (a: Vec) => Math.sqrt(dot(a, a));
export const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
export const det2 = (A: Mat) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
export const inv2 = (A: Mat): Mat | null => {
  const d = det2(A);
  if (Math.abs(d) < 1e-12) return null;
  return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
};

/** Determinant by elimination with partial pivoting. */
export function det(A: Mat): number {
  const M = clone(A), n = M.length;
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return 0;
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; d = -d; }
    d *= M[c][c];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]; }
  }
  return d;
}

export type Step = { M: Mat; note: string; hi?: number[] };

/** Reduced row echelon form, recording each row operation. */
export function rrefSteps(A: Mat): { steps: Step[]; pivots: number[] } {
  const M = clone(A), m = M.length, n = M[0].length;
  const steps: Step[] = [{ M: clone(M), note: "The starting matrix." }];
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = r;
    while (p < m && Math.abs(M[p][c]) < 1e-12) p++;
    if (p === m) continue;
    if (p !== r) { [M[p], M[r]] = [M[r], M[p]]; steps.push({ M: clone(M), note: `Swap rows ${r + 1} and ${p + 1} to bring a non-zero entry into the pivot position.`, hi: [r, p] }); }
    const pv = M[r][c];
    if (Math.abs(pv - 1) > 1e-12) { for (let k = 0; k < n; k++) M[r][k] /= pv; steps.push({ M: clone(M), note: `Divide row ${r + 1} by ${fmt(pv)} so the pivot is 1.`, hi: [r] }); }
    for (let q = 0; q < m; q++) {
      if (q === r || Math.abs(M[q][c]) < 1e-12) continue;
      const f = M[q][c];
      for (let k = 0; k < n; k++) M[q][k] -= f * M[r][k];
      steps.push({ M: clone(M), note: `Subtract ${fmt(f)} × row ${r + 1} from row ${q + 1} to clear column ${c + 1}.`, hi: [q] });
    }
    pivots.push(c);
    r++;
  }
  return { steps, pivots };
}

/** Elimination to upper triangular form without row swaps, recording multipliers (for LU). */
export function luSteps(A: Mat): { steps: (Step & { L: Mat })[]; L: Mat; U: Mat } | null {
  const U = clone(A), n = U.length, L = eye(n);
  const steps: (Step & { L: Mat })[] = [{ M: clone(U), L: clone(L), note: "Start with A. L starts as the identity." }];
  for (let c = 0; c < n; c++) {
    if (Math.abs(U[c][c]) < 1e-12) return null;
    for (let r = c + 1; r < n; r++) {
      const f = U[r][c] / U[c][c];
      if (Math.abs(f) < 1e-12) continue;
      for (let k = c; k < n; k++) U[r][k] -= f * U[c][k];
      U[r][c] = 0;
      L[r][c] = f;
      steps.push({ M: clone(U), L: clone(L), note: `Multiplier ℓ${r + 1}${c + 1} = ${fmt(f)}: subtract ${fmt(f)} × row ${c + 1} from row ${r + 1}, and record ${fmt(f)} in L.`, hi: [r] });
    }
  }
  return { steps, L, U };
}

/** Eigen-decomposition of a symmetric matrix by the cyclic Jacobi method. Eigenvalues descending; vectors are columns. */
export function symEig(S: Mat): { values: number[]; vectors: Mat } {
  const n = S.length, A = clone(S), V = eye(n);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  return { values: idx.map((i) => A[i][i]), vectors: V.map((r) => idx.map((i) => r[i])) };
}

/** Thin SVD of an m×n matrix via the eigenvectors of AᵀA. Singular values descending. */
export function svd(A: Mat): { U: Mat; s: number[]; V: Mat } {
  const { values, vectors: V } = symEig(mul(T(A), A));
  const s = values.map((l) => Math.sqrt(Math.max(0, l)));
  const AV = mul(A, V);
  const U = A.map((_, i) => s.map((sk, k) => (sk > 1e-12 ? AV[i][k] / sk : 0)));
  return { U, s, V };
}

/** Real eigenvalues of a 2×2 matrix, or null if they are complex. */
export function eig2(A: Mat): number[] | null {
  const tr = A[0][0] + A[1][1], d = det2(A), disc = tr * tr - 4 * d;
  if (disc < -1e-12) return null;
  const r = Math.sqrt(Math.max(0, disc));
  return [(tr + r) / 2, (tr - r) / 2];
}

/** A unit eigenvector of a 2×2 matrix for eigenvalue l. */
export function eigvec2(A: Mat, l: number): Vec {
  const a = A[0][0] - l, b = A[0][1], c = A[1][0], d = A[1][1] - l;
  let v: Vec = Math.abs(a) + Math.abs(b) > Math.abs(c) + Math.abs(d) ? [-b, a] : [-d, c];
  if (Math.hypot(v[0], v[1]) < 1e-12) v = [1, 0];
  const h = Math.hypot(v[0], v[1]);
  return [v[0] / h, v[1] / h];
}

/** Formats a matrix entry: integers plainly, otherwise up to two decimals, with a true minus sign. */
export function fmt(v: number): string {
  const x = Math.abs(v) < 1e-10 ? 0 : v;
  const s = Number.isInteger(Math.round(x * 1e6) / 1e6) ? String(Math.round(x)) : String(Number(x.toFixed(2)));
  return s.replace(/^-/, "−");
}
