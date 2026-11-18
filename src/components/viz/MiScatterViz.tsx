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

const N = 4000, SHOW = 500, BINS = 10;

function binnedMi(x: number[], y: number[]) {
  const lo = (a: number[]) => Math.min(...a), hi = (a: number[]) => Math.max(...a);
  const [x0, x1, y0, y1] = [lo(x), hi(x), lo(y), hi(y)];
  const C = Array.from({ length: BINS }, () => Array(BINS).fill(0));
  for (let i = 0; i < x.length; i++) {
    const a = Math.min(BINS - 1, Math.floor(((x[i] - x0) / (x1 - x0 || 1)) * BINS));
    const b = Math.min(BINS - 1, Math.floor(((y[i] - y0) / (y1 - y0 || 1)) * BINS));
    C[a][b]++;
  }
  const px = C.map((r) => r.reduce((s, v) => s + v, 0) / x.length);
  const py = C[0].map((_, j) => C.reduce((s, r) => s + r[j], 0) / x.length);
  let mi = 0;
  C.forEach((r, a) => r.forEach((c, b) => { if (c > 0) { const p = c / x.length; mi += p * Math.log2(p / (px[a] * py[b])); } }));
  return mi;
}

function simulate(mode: number, k: number) {
  const r = makeRng(17);
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
  const x: number[] = [], y: number[] = [];
  for (let i = 0; i < N; i++) {
    const u = normal(), v = normal();
    x.push(u);
    y.push(mode === 0 ? k * u + Math.sqrt(1 - k * k) * v : u * u + (1 - k) * 2 * v);
  }
  const mx = x.reduce((s, v) => s + v, 0) / N, my = y.reduce((s, v) => s + v, 0) / N;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < N; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return { x, y, corr: sxy / Math.sqrt(sxx * syy), mi: binnedMi(x, y) };
}

/** Correlation against mutual information: a linear Gaussian relation, where MI is −½log₂(1 − ρ²), and a parabola, which has no correlation but plenty of MI. */
export function MiScatterViz() {
  const [mode, setMode] = useState(0);
  const [k, setK] = useState(0.8);
  const [res, setRes] = useState<ReturnType<typeof simulate> | null>(null);
  useEffect(() => setRes(simulate(mode, k)), [mode, k]);
  const W = 330, H = 200;
  const X = (v: number) => W / 2 + Math.max(-3.5, Math.min(3.5, v)) * 40;
  const ymin = mode === 0 ? -3.5 : -2, ymax = mode === 0 ? 3.5 : 9;
  const Y = (v: number) => 190 - ((Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin)) * 180;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={mode === 0} onClick={() => setMode(0)}>linear</button>
        <button type="button" className="seg" aria-pressed={mode === 1} onClick={() => setMode(1)}>parabola</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          {mode === 0 ? `ρ = ${k.toFixed(2)}` : `signal = ${k.toFixed(2)}`}
          <input type="range" min={0} max={0.99} step={0.01} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="strength of the relation" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter plot of samples of X and Y">
        <rect x={X(-3.5)} y={Y(ymax)} width={X(3.5) - X(-3.5)} height={Y(ymin) - Y(ymax)} fill="none" stroke="var(--border)" />
        {res && res.x.slice(0, SHOW).map((v, i) => (
          <circle key={i} cx={X(v)} cy={Y(res.y[i])} r={1.6} fill="var(--accent)" opacity={0.5} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res
          ? `correlation ${(res.corr + 0).toFixed(2)}; binned MI ${res.mi.toFixed(2)} bits${mode === 0 ? `; exact −½log₂(1 − ρ²) = ${(-0.5 * Math.log2(1 - k * k)).toFixed(2)}` : ""}`
          : "sampling…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Mutual information measures any dependence, correlation only linear dependence. In the linear Gaussian case the two
        tell the same story, and the binned estimate from {N} samples tracks the exact value, slightly high at ρ = 0 and
        increasingly low as the dependence strengthens, because ten bins cannot resolve a thin ridge. On the parabola, Y depends strongly on X but the
        correlation is near 0, since positive and negative X give the same Y; the mutual information sees the dependence.
      </figcaption>
    </figure>
  );
}
