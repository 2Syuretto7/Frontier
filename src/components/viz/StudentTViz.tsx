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
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const tpdf = (x: number, k: number) => Math.exp(lgamma((k + 1) / 2) - lgamma(k / 2) - 0.5 * Math.log(k * Math.PI) - ((k + 1) / 2) * Math.log(1 + (x * x) / k));
const npdf = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
const REPS = 6000;

/** The statistic (X̄ − μ)/(S/√n) for normal samples follows Student's t with n − 1 degrees of freedom, whose tails are heavier than the normal's. */
export function StudentTViz() {
  const [n, setN] = useState(4);
  const ts = useMemo(() => {
    const r = makeRng(11 + n);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: REPS }, () => {
      const xs = Array.from({ length: n }, normal);
      const m = xs.reduce((a, b) => a + b, 0) / n;
      const s = Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (n - 1));
      return m / (s / Math.sqrt(n));
    });
  }, [n]);
  const lo = -5, hi = 5, nb = 50, bw = (hi - lo) / nb;
  const counts = Array(nb).fill(0);
  ts.forEach((t) => { const b = Math.floor((t - lo) / bw); if (b >= 0 && b < nb) counts[b]++; });
  const dens = counts.map((c) => c / (REPS * bw));
  const tail = ts.filter((t) => Math.abs(t) > 1.96).length / REPS;
  const W = 330, H = 150, ymax = 0.45;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const Y = (y: number) => H - 14 - (Math.min(y, ymax) / ymax) * (H - 24);
  const xs = Array.from({ length: 201 }, (_, i) => lo + ((hi - lo) * i) / 200);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          sample size n = {n}
          <input type="range" min={2} max={30} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of simulated t statistics with the normal and t densities">
        {dens.map((d, i) => (
          <rect key={i} x={X(lo + i * bw)} y={Y(d)} width={X(lo + (i + 1) * bw) - X(lo + i * bw) - 0.5} height={Y(0) - Y(d)} fill="var(--accent)" opacity={0.35} />
        ))}
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} strokeDasharray="4 3" points={xs.map((x) => `${X(x).toFixed(1)},${Y(npdf(x)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(tpdf(x, n - 1)).toFixed(1)}`).join(" ")} />
        {[-1.96, 1.96].map((c) => <line key={c} x1={X(c)} x2={X(c)} y1={10} y2={H - 14} stroke="var(--danger)" strokeDasharray="2 2" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        fraction with |T| &gt; 1.96: {tail.toFixed(3)} (normal: 0.050)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The bars are {REPS} simulated values of T = X̄/(S/√n) for standard normal samples of size n. The solid curve is
        Student&apos;s t density with n − 1 degrees of freedom and the dashed curve the standard normal. For small n the
        estimated S is often too small, which makes T large, so the tails are heavier and ±1.96 cuts off far more than 5%.
      </figcaption>
    </figure>
  );
}
