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

function lgamma(x: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const gammaPdf = (x: number, k: number, th: number) => (x <= 0 ? 0 : Math.exp((k - 1) * Math.log(x) - x / th - lgamma(k) - k * Math.log(th)));
const NS = [10, 20, 50, 100, 200, 500, 1000, 5000];

/** Method of moments for a gamma sample: match the sample mean and variance to kθ and kθ², and compare the fitted density with the truth. */
export function MomFitViz() {
  const [j, setJ] = useState(2);
  const [seed, setSeed] = useState(1);
  const n = NS[j];
  const xs = useMemo(() => {
    const r = makeRng(seed * 7919);
    return Array.from({ length: 5000 }, () => -3 * (Math.log(Math.max(r(), 1e-12)) + Math.log(Math.max(r(), 1e-12))));
  }, [seed]);
  const sample = xs.slice(0, n);
  const m = sample.reduce((a, b) => a + b, 0) / n;
  const v = sample.reduce((a, x) => a + (x - m) * (x - m), 0) / n;
  const kh = (m * m) / v, th = v / m;
  const hi = 25, nb = 25, bw = hi / nb;
  const counts = Array(nb).fill(0);
  sample.forEach((x) => { const b = Math.floor(x / bw); if (b < nb) counts[b]++; });
  const W = 330, H = 150, ymax = 0.2;
  const X = (x: number) => 14 + (x / hi) * (W - 28);
  const Y = (y: number) => H - 14 - (Math.min(y, ymax) / ymax) * (H - 24);
  const grid = Array.from({ length: 201 }, (_, i) => (hi * i) / 200);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={0} max={NS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="sample size" style={{ width: 120 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new sample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of a gamma sample with the true and fitted densities">
        {counts.map((c, i) => (
          <rect key={i} x={X(i * bw)} y={Y(c / (n * bw))} width={X(bw) - X(0) - 0.6} height={Y(0) - Y(c / (n * bw))} fill="var(--accent)" opacity={0.3} />
        ))}
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} strokeDasharray="4 3" points={grid.map((x) => `${X(x).toFixed(1)},${Y(gammaPdf(x, 2, 3)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={grid.map((x) => `${X(x).toFixed(1)},${Y(gammaPdf(x, kh, th)).toFixed(1)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        x̄ = {m.toFixed(3)}, v = {v.toFixed(3)} → k̂ = {kh.toFixed(3)}, θ̂ = {th.toFixed(3)} (true k = 2, θ = 3)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The bars are a sample from a gamma distribution with shape 2 and scale 3, whose mean is kθ and variance kθ². Solving
        x̄ = kθ and v = kθ² gives k̂ = x̄²/v and θ̂ = v/x̄. The solid curve is the fitted density and the dashed curve the
        true one. With small n the estimates wander, and k̂ tends to come out too large; both settle as n grows.
      </figcaption>
    </figure>
  );
}
