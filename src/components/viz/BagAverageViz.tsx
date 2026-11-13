"use client";

import { useMemo, useState } from "react";

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

type Tree = number | [number, Tree, Tree];

function fitTree(xs: number[], ys: number[], depth: number): Tree {
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const uniq = Array.from(new Set(xs)).sort((a, b) => a - b);
  if (depth === 0 || uniq.length < 2) return mean;
  const o = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  const sx = o.map((i) => xs[i]), sy = o.map((i) => ys[i]);
  const n = sy.length;
  let s1 = 0, s2 = 0;
  const T1 = sy.reduce((a, b) => a + b, 0), T2 = sy.reduce((a, b) => a + b * b, 0);
  let best = Infinity, bt = sx[0];
  for (let k = 1; k < n; k++) {
    s1 += sy[k - 1]; s2 += sy[k - 1] * sy[k - 1];
    if (sx[k - 1] === sx[k]) continue;
    const sse = s2 - (s1 * s1) / k + (T2 - s2) - ((T1 - s1) * (T1 - s1)) / (n - k);
    if (sse < best) { best = sse; bt = sx[k - 1]; }
  }
  const li = xs.map((_, i) => i).filter((i) => xs[i] <= bt), ri = xs.map((_, i) => i).filter((i) => xs[i] > bt);
  return [bt, fitTree(li.map((i) => xs[i]), li.map((i) => ys[i]), depth - 1), fitTree(ri.map((i) => xs[i]), ri.map((i) => ys[i]), depth - 1)];
}

function predict(t: Tree, v: number): number {
  let node = t;
  while (typeof node !== "number") node = v <= node[0] ? node[1] : node[2];
  return node;
}

const N = 50, MAXB = 50;
const GX = Array.from({ length: 241 }, (_, i) => (6 * i) / 240);

/** Bagging regression trees: thin curves are trees fitted to bootstrap resamples, the thick curve is their average, which is smoother and closer to the truth than any one tree. */
export function BagAverageViz() {
  const [B, setB] = useState(10);
  const [depth, setDepth] = useState(6);
  const data = useMemo(() => {
    const r = makeRng(808);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const xs = Array.from({ length: N }, () => 6 * r());
    return { xs, ys: xs.map((x) => Math.sin(x) + 0.4 * normal()) };
  }, []);
  const trees = useMemo(() => {
    const r = makeRng(4040 + depth);
    return Array.from({ length: MAXB }, () => {
      const idx = Array.from({ length: N }, () => Math.floor(r() * N));
      const t = fitTree(idx.map((i) => data.xs[i]), idx.map((i) => data.ys[i]), depth);
      return GX.map((g) => predict(t, g));
    });
  }, [data, depth]);
  const avg = GX.map((_, j) => trees.slice(0, B).reduce((s, t) => s + t[j], 0) / B);
  const mse = (f: number[]) => f.reduce((s, v, j) => s + (v - Math.sin(GX[j])) * (v - Math.sin(GX[j])), 0) / GX.length;
  const single = trees.slice(0, B).reduce((s, t) => s + mse(t), 0) / B;
  const W = 330, H = 180;
  const X = (x: number) => 12 + (x / 6) * (W - 24);
  const Y = (y: number) => H / 2 - Math.max(-2.2, Math.min(2.2, y)) * (H / 5);
  const line = (f: number[]) => GX.map((g, j) => `${X(g).toFixed(1)},${Y(f[j]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          trees B = {B}
          <input type="range" min={1} max={MAXB} value={B} onChange={(e) => setB(Number(e.target.value))} aria-label="number of bagged trees" style={{ width: 120 }} />
        </label>
        {[1, 3, 6].map((d) => (
          <button key={d} type="button" className="seg" aria-pressed={depth === d} onClick={() => setDepth(d)}>depth {d}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Bootstrap trees and their average">
        {trees.slice(0, Math.min(B, 12)).map((t, k) => <polyline key={k} points={line(t)} fill="none" stroke="var(--text-muted)" strokeWidth={0.7} opacity={0.6} />)}
        <polyline points={line(GX.map(Math.sin))} fill="none" stroke="var(--text)" strokeDasharray="4 3" strokeWidth={1.2} />
        <polyline points={line(avg)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        {data.xs.map((x, i) => <circle key={i} cx={X(x)} cy={Y(data.ys[i])} r={2.2} fill="var(--danger)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        error against the truth: average single tree {single.toFixed(3)}, bagged {mse(avg).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Fifty noisy points from sin x (dashed). Each thin curve is a regression tree grown on a bootstrap resample; up to
        twelve are drawn. The thick curve averages the first B. Deep trees chase the noise and differ wildly from one
        resample to the next, so averaging removes much of their error. Depth-1 stumps barely vary, so averaging them changes
        little: they are wrong for the same reason every time, and bagging cannot fix bias.
      </figcaption>
    </figure>
  );
}
