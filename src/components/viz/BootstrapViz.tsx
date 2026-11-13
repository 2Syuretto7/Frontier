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

const B = 2000;
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Bootstrap replicates of the mean or median of one skewed sample, with the 95% percentile interval. */
export function BootstrapViz() {
  const [n, setN] = useState(30);
  const [useMed, setUseMed] = useState(false);
  const [seed, setSeed] = useState(1);
  const xs = useMemo(() => {
    const r = makeRng(seed * 977 + n);
    return Array.from({ length: n }, () => -Math.log(Math.max(r(), 1e-12)));
  }, [seed, n]);
  const stat = useMed ? median : mean;
  const reps = useMemo(() => {
    const r = makeRng(seed * 31 + 7);
    const out: number[] = [];
    for (let b = 0; b < B; b++) {
      const s = Array.from({ length: xs.length }, () => xs[Math.floor(r() * xs.length)]);
      out.push(stat(s));
    }
    return out.sort((a, b) => a - b);
  }, [xs, seed, stat]);
  const lo = reps[Math.floor(0.025 * B)], hi = reps[Math.floor(0.975 * B) - 1];
  const truth = useMed ? Math.log(2) : 1;
  const est = stat(xs);
  const m = mean(reps);
  const se = Math.sqrt(reps.reduce((a, v) => a + (v - m) * (v - m), 0) / (B - 1));
  const xmax = 2.5, nb = 50, bw = xmax / nb;
  const counts = Array(nb).fill(0);
  reps.forEach((v) => { const k = Math.floor(v / bw); if (k >= 0 && k < nb) counts[k]++; });
  const cmax = Math.max(...counts, 1);
  const W = 330, H = 150;
  const X = (x: number) => 14 + (x / xmax) * (W - 28);
  const Y = (c: number) => H - 16 - (c / cmax) * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={5} max={200} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 110 }} />
        </label>
        <button type="button" className="seg" aria-pressed={!useMed} onClick={() => setUseMed(false)}>mean</button>
        <button type="button" className="seg" aria-pressed={useMed} onClick={() => setUseMed(true)}>median</button>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new sample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of bootstrap replicates with the percentile interval">
        <rect x={X(lo)} y={12} width={Math.max(X(hi) - X(lo), 1)} height={Y(0) - 12} fill="var(--accent)" opacity={0.1} />
        {counts.map((c, i) => (
          <rect key={i} x={X(i * bw)} y={Y(c)} width={X(bw) - X(0) - 0.5} height={Y(0) - Y(c)} fill="var(--accent)" opacity={0.45} />
        ))}
        <line x1={X(0)} x2={X(xmax)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(truth)} x2={X(truth)} y1={8} y2={Y(0)} stroke="var(--text)" strokeDasharray="3 3" />
        <line x1={X(est)} x2={X(est)} y1={8} y2={Y(0)} stroke="var(--danger)" />
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(xmax)} y={H - 2} textAnchor="end" className="viz-label">{xmax}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        estimate {est.toFixed(3)}; bootstrap SE {se.toFixed(3)}; 95% interval [{lo.toFixed(3)}, {hi.toFixed(3)}]; truth {truth.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        One sample of n exponential values is drawn once. The bars are the {useMed ? "median" : "mean"} of {B} resamples,
        each drawn with replacement from that sample. Their spread estimates the standard error, and their middle 95%
        (shaded) is the percentile interval. The solid line is the sample&apos;s own estimate, the dashed line the true value.
        Try new samples: the interval usually, but not always, contains the truth.
      </figcaption>
    </figure>
  );
}
