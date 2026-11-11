/** Small, deterministic machine-learning helpers for the visualisations. Seeded so server and browser agree. */

export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard normal sampler built on a uniform generator (Box-Muller). */
export function makeNormal(rng: () => number) {
  return () => {
    const u = Math.max(rng(), 1e-12), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/** Solves A x = b by Gaussian elimination with partial pivoting. A is n by n. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[n] / (r[i] || 1e-12));
}

/** Least squares for features X (rows) and targets y, with optional ridge penalty on all but the first column. */
export function leastSquares(X: number[][], y: number[], ridge = 0): number[] {
  const p = X[0].length;
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < p; j++) {
      b[j] += X[i][j] * y[i];
      for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k];
    }
  }
  for (let j = 1; j < p; j++) A[j][j] += ridge;
  A[0][0] += 1e-10;
  return solve(A, b);
}

/** Fits a polynomial of the given degree. x is rescaled from [lo, hi] to [-1, 1] for stability. */
export function polyFit(xs: number[], ys: number[], deg: number, lo: number, hi: number, ridge = 1e-9) {
  const t = (x: number) => (2 * (x - lo)) / (hi - lo) - 1;
  const feats = (x: number) => Array.from({ length: deg + 1 }, (_, k) => t(x) ** k);
  const w = leastSquares(xs.map(feats), ys, ridge);
  return (x: number) => feats(x).reduce((s, f, k) => s + f * w[k], 0);
}

export function mse(f: (x: number) => number, xs: number[], ys: number[]) {
  return xs.reduce((s, x, i) => s + (f(x) - ys[i]) ** 2, 0) / xs.length;
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export type Pt = { x: number; y: number; c: 0 | 1 };

/** Logistic regression on two features by full-batch gradient descent. Returns [w0, w1, w2] for w0 + w1 x + w2 y. */
export function logisticFit(pts: Pt[], steps = 3000, lr = 0.5): [number, number, number] {
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length, my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const sx = Math.sqrt(pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) / pts.length) || 1;
  const sy = Math.sqrt(pts.reduce((s, p) => s + (p.y - my) ** 2, 0) / pts.length) || 1;
  let a = 0, b = 0, c = 0;
  for (let t = 0; t < steps; t++) {
    let ga = 0, gb = 0, gc = 0;
    for (const p of pts) {
      const u = (p.x - mx) / sx, v = (p.y - my) / sy;
      const e = sigmoid(a + b * u + c * v) - p.c;
      ga += e; gb += e * u; gc += e * v;
    }
    a -= (lr * ga) / pts.length; b -= (lr * gb) / pts.length; c -= (lr * gc) / pts.length;
  }
  return [a - (b * mx) / sx - (c * my) / sy, b / sx, c / sy];
}

/** Majority label among the k nearest points to (x, y). Ties go to class 1. */
export function knn(pts: Pt[], x: number, y: number, k: number): 0 | 1 {
  const d = pts.map((p) => [(p.x - x) ** 2 + (p.y - y) ** 2, p.c] as const).sort((a, b) => a[0] - b[0]);
  let ones = 0;
  for (let i = 0; i < k && i < d.length; i++) ones += d[i][1];
  return ones * 2 >= Math.min(k, d.length) ? 1 : 0;
}

export type Tree = { leaf: true; p: number; n: number } | { leaf: false; axis: "x" | "y"; t: number; lo: Tree; hi: Tree; n: number };

const gini = (ones: number, n: number) => (n === 0 ? 0 : 2 * (ones / n) * (1 - ones / n));

/** Greedy decision tree with Gini splits on axis-aligned thresholds, to the given depth.
 *  With rng, each split considers one randomly chosen feature, as a random forest does. */
export function growTree(pts: Pt[], depth: number, minLeaf = 1, rng?: () => number): Tree {
  const ones = pts.reduce((s, p) => s + p.c, 0);
  const n = pts.length;
  if (depth === 0 || ones === 0 || ones === n || n < 2 * minLeaf) return { leaf: true, p: n ? ones / n : 0.5, n };
  let best: { score: number; axis: "x" | "y"; t: number } | null = null;
  const axes: ("x" | "y")[] = rng ? [rng() < 0.5 ? "x" : "y"] : ["x", "y"];
  for (const axis of axes) {
    const s = [...pts].sort((a, b) => a[axis] - b[axis]);
    let left = 0;
    for (let i = 0; i < n - 1; i++) {
      left += s[i].c;
      if (s[i][axis] === s[i + 1][axis] || i + 1 < minLeaf || n - i - 1 < minLeaf) continue;
      const nl = i + 1, nr = n - nl;
      const score = (nl * gini(left, nl) + nr * gini(ones - left, nr)) / n;
      if (!best || score < best.score - 1e-12) best = { score, axis, t: (s[i][axis] + s[i + 1][axis]) / 2 };
    }
  }
  if (!best || (!rng && best.score >= gini(ones, n) - 1e-12)) return { leaf: true, p: ones / n, n };
  const { axis, t } = best;
  return { leaf: false, axis, t, n, lo: growTree(pts.filter((p) => p[axis] <= t), depth - 1, minLeaf, rng), hi: growTree(pts.filter((p) => p[axis] > t), depth - 1, minLeaf, rng) };
}

export function treeProb(tr: Tree, x: number, y: number): number {
  let node = tr;
  while (!node.leaf) node = (node.axis === "x" ? x : y) <= node.t ? node.lo : node.hi;
  return node.p;
}

/** Two noisy interleaved classes in the unit square, for classification demos. */
export function moons(seed: number, n: number, noise = 0.12): Pt[] {
  const r = makeRng(seed), g = makeNormal(r);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const c = (i % 2) as 0 | 1;
    const a = Math.PI * r();
    const x = c ? 1 - Math.cos(a) : Math.cos(a);
    const y = c ? 0.5 - Math.sin(a) : Math.sin(a);
    pts.push({ x: (x + 1.1) / 3.2 + noise * g() * 0.3, y: (y + 0.7) / 1.9 + noise * g() * 0.3, c });
  }
  return pts;
}

/** Two Gaussian blobs in the unit square. */
export function blobs(seed: number, n: number, spread = 0.12, sep = 0.35): Pt[] {
  const r = makeRng(seed), g = makeNormal(r);
  return Array.from({ length: n }, (_, i) => {
    const c = (i % 2) as 0 | 1;
    const cx = 0.5 + (c ? sep : -sep) / 2, cy = 0.5 + (c ? sep : -sep) / 2;
    return { x: cx + spread * g(), y: cy + spread * g(), c };
  });
}

/** Number of leaves in a tree. */
export function leaves(tr: Tree): number {
  return tr.leaf ? 1 : leaves(tr.lo) + leaves(tr.hi);
}

/** Fraction of points a classifier labels correctly. */
export function accuracy(pts: Pt[], f: (x: number, y: number) => 0 | 1): number {
  return pts.filter((p) => f(p.x, p.y) === p.c).length / pts.length;
}

/** Points from y = sin(2πx) plus Gaussian noise, with x uniform on [0, 1]. */
export function sineData(seed: number, n: number, noise = 0.3) {
  const r = makeRng(seed), g = makeNormal(r);
  const xs = Array.from({ length: n }, () => r());
  return { xs, ys: xs.map((x) => Math.sin(2 * Math.PI * x) + noise * g()) };
}

export type P2 = { x: number; y: number };

/** Points scattered around the given centres in the unit square. */
export function clusters(seed: number, centres: P2[], per: number, spread: number): P2[] {
  const r = makeRng(seed), g = makeNormal(r);
  return centres.flatMap((c) => Array.from({ length: per }, () => ({ x: c.x + spread * g(), y: c.y + spread * g() })));
}

const d2 = (a: P2, b: P2) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Lloyd's algorithm from k random data points. Returns the centres after each step, and the final assignment. */
export function kmeans(pts: P2[], k: number, seed: number, maxSteps = 30) {
  const r = makeRng(seed);
  const idx: number[] = [];
  while (idx.length < Math.min(k, pts.length)) {
    const i = Math.floor(r() * pts.length);
    if (!idx.includes(i)) idx.push(i);
  }
  let cs = idx.map((i) => ({ ...pts[i] }));
  const history = [cs];
  const assign = (cs: P2[]) => pts.map((p) => cs.reduce((b, c, j) => (d2(p, c) < d2(p, cs[b]) ? j : b), 0));
  for (let s = 0; s < maxSteps; s++) {
    const a = assign(cs);
    const next = cs.map((c, j) => {
      const mine = pts.filter((_, i) => a[i] === j);
      return mine.length ? { x: mine.reduce((t, p) => t + p.x, 0) / mine.length, y: mine.reduce((t, p) => t + p.y, 0) / mine.length } : c;
    });
    const moved = next.some((c, j) => d2(c, cs[j]) > 1e-14);
    cs = next;
    if (!moved) break;
    history.push(cs);
  }
  const labels = assign(cs);
  const inertia = pts.reduce((t, p, i) => t + d2(p, cs[labels[i]]), 0);
  return { history, labels, inertia, assign };
}

/** Sum of squared distances from each point to its assigned centre. */
export function inertiaOf(pts: P2[], cs: P2[]) {
  return pts.reduce((t, p) => t + Math.min(...cs.map((c) => d2(p, c))), 0);
}
