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

const D = 10, PER = 20;
const SDS = [0.3, 3, 0.3];
const OFFS = [0, 12, 60];
const COLS = ["var(--accent)", "var(--danger)", "var(--text-muted)"];

function makeData() {
  const r = makeRng(5);
  const nrm = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
  const X: number[][] = [], lab: number[] = [];
  SDS.forEach((sd, k) => {
    for (let i = 0; i < PER; i++) {
      X.push(Array.from({ length: D }, (_, d) => (d === 0 ? OFFS[k] : 0) + sd * nrm()));
      lab.push(k);
    }
  });
  return { X, lab };
}

function affinities(X: number[][], perp: number) {
  const n = X.length;
  const d2 = X.map((a) => X.map((b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)));
  const P: number[][] = [];
  for (let i = 0; i < n; i++) {
    const mn = Math.min(...d2[i].filter((_, j) => j !== i));
    let lo = -50, hi = 50, p: number[] = [];
    for (let it = 0; it < 60; it++) {
      const beta = Math.exp((lo + hi) / 2);
      const w = d2[i].map((v, j) => (j === i ? 0 : Math.exp(-beta * (v - mn))));
      const sw = w.reduce((a, b) => a + b, 0);
      p = w.map((v) => v / sw);
      const H = -p.reduce((a, v) => a + (v > 0 ? v * Math.log2(v) : 0), 0);
      if (2 ** H > perp) lo = (lo + hi) / 2; else hi = (lo + hi) / 2;
    }
    P.push(p);
  }
  return P.map((row, i) => row.map((v, j) => (v + P[j][i]) / (2 * n)));
}

function tsne(P: number[][], seed: number, iters = 500) {
  const n = P.length, r = makeRng(seed);
  let Y = Array.from({ length: n }, () => [1e-2 * (r() - 0.5), 1e-2 * (r() - 0.5)]);
  let V = Y.map(() => [0, 0]);
  for (let t = 0; t < iters; t++) {
    const ex = t < 100 ? 4 : 1, mom = t < 100 ? 0.5 : 0.8;
    const num = Y.map((a, i) => Y.map((b, j) => (i === j ? 0 : 1 / (1 + (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2))));
    const Z = num.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
    V = Y.map((yi, i) => {
      let g0 = 0, g1 = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const m = 4 * (ex * P[i][j] - num[i][j] / Z) * num[i][j];
        g0 += m * (yi[0] - Y[j][0]);
        g1 += m * (yi[1] - Y[j][1]);
      }
      return [mom * V[i][0] - 20 * g0, mom * V[i][1] - 20 * g1];
    });
    Y = Y.map((y, i) => [y[0] + V[i][0], y[1] + V[i][1]]);
  }
  return Y;
}

/** t-SNE on three clusters in ten dimensions: one ten times wider than the others, with gaps of 12 and 48 between them. */
export function TsnePerplexityViz() {
  const [perp, setPerp] = useState(3);
  const [seed, setSeed] = useState(1);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const data = useMemo(makeData, []);
  // The optimisation is chaotic, so it runs only in the browser to keep server and client output identical.
  const Y = useMemo(() => (ready ? tsne(affinities(data.X, perp), seed) : data.X.map(() => [0, 0])), [ready, data, perp, seed]);
  const cent = [0, 1, 2].map((k) => {
    const pts = Y.filter((_, i) => data.lab[i] === k);
    return [pts.reduce((a, p) => a + p[0], 0) / PER, pts.reduce((a, p) => a + p[1], 0) / PER];
  });
  const spread = [0, 1, 2].map((k) => Math.sqrt(Y.reduce((a, p, i) => a + (data.lab[i] === k ? (p[0] - cent[k][0]) ** 2 + (p[1] - cent[k][1]) ** 2 : 0), 0) / PER));
  const dist = (a: number, b: number) => Math.hypot(cent[a][0] - cent[b][0], cent[a][1] - cent[b][1]);
  const xs = Y.map((p) => p[0]), ys = Y.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(x1 - x0, y1 - y0, 1e-9);
  const W = 300, H = 200;
  const sc = (H - 20) / span;
  const PX = (x: number) => W / 2 + (x - (x0 + x1) / 2) * sc;
  const PY = (y: number) => H / 2 - (y - (y0 + y1) / 2) * sc;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="mono" style={{ fontSize: 13 }}>perplexity:</span>
        {[3, 10, 30].map((p) => (
          <button key={p} type="button" className="seg" aria-pressed={perp === p} onClick={() => setPerp(p)}>{p}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new start</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Two-dimensional t-SNE embedding of three clusters">
        <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="none" stroke="var(--border)" />
        {ready && Y.map((p, i) => (
          <circle key={i} cx={PX(p[0])} cy={PY(p[1])} r={3} fill={COLS[data.lab[i]]} opacity={0.8} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {ready ? `width ratio B/A: data 10.0, plot ${(spread[1] / spread[0]).toFixed(1)}; gap ratio (B to C)/(A to B): data 4.0, plot ${(dist(1, 2) / dist(0, 1)).toFixed(1)}` : "computing the embedding"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Cluster A (accent) and cluster C (muted) are tight; cluster B (red) is ten times wider. In the data, C is four times
        further from B than A is. At perplexity 3 each point attends only to a few neighbours, so the plot makes the three
        clusters about the same size and roughly equally spaced. Larger perplexity keeps more of the global layout, but
        sizes and gaps are still not to scale. The axes have no units, so the plot is rescaled to fit the box.
      </figcaption>
    </figure>
  );
}
