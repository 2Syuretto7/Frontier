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

const NS = [2, 3, 5, 10, 20, 50, 100, 300, 1000];
const REPS = 5000;
const npdf = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

/** The standardised maximum likelihood estimate √n(λ̂ − λ)/λ of an exponential rate, against the standard normal it approaches. */
export function MleLimitViz() {
  const [j, setJ] = useState(2);
  const n = NS[j];
  const zs = useMemo(() => {
    const r = makeRng(97 + n);
    return Array.from({ length: REPS }, () => {
      let s = 0;
      for (let i = 0; i < n; i++) s -= Math.log(Math.max(r(), 1e-12));
      const lh = n / s;
      return Math.sqrt(n) * (lh - 1);
    });
  }, [n]);
  const lo = -4, hi = 6, nb = 50, bw = (hi - lo) / nb;
  const counts = Array(nb).fill(0);
  zs.forEach((z) => { const b = Math.floor((z - lo) / bw); if (b >= 0 && b < nb) counts[b]++; });
  const mean = zs.reduce((a, b) => a + b, 0) / REPS;
  const W = 330, H = 150, ymax = 0.6;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const Y = (y: number) => H - 14 - (Math.min(y, ymax) / ymax) * (H - 24);
  const xs = Array.from({ length: 201 }, (_, i) => lo + ((hi - lo) * i) / 200);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          sample size n = {n}
          <input type="range" min={0} max={NS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="sample size" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the standardised MLE with the standard normal density">
        {counts.map((c, i) => (
          <rect key={i} x={X(lo + i * bw)} y={Y(c / (REPS * bw))} width={X(lo + (i + 1) * bw) - X(lo + i * bw) - 0.5} height={Y(0) - Y(c / (REPS * bw))} fill="var(--accent)" opacity={0.35} />
        ))}
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(npdf(x)).toFixed(1)}`).join(" ")} />
        <line x1={X(0)} x2={X(0)} y1={10} y2={Y(0)} stroke="var(--border)" strokeDasharray="3 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        mean of √n(λ̂ − λ)/λ over {REPS} samples: {mean.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar collects simulated values of √n(λ̂ − λ)/λ, where λ̂ = 1/X̄ is the maximum likelihood estimate of an
        exponential rate. The curve is the standard normal, the limit the theory predicts since 1/I(λ) = λ². For small n the
        histogram is skewed right with a positive mean, because 1/X̄ overshoots when X̄ is small; by n = 100 it is close to
        the curve.
      </figcaption>
    </figure>
  );
}
