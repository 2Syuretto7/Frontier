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

const NS = [1, 2, 5, 10, 20, 50, 200];
const REPS = 6000;
const chi1 = (x: number) => (x <= 0 ? 0 : Math.exp(-x / 2) / Math.sqrt(2 * Math.PI * x));

/** The likelihood ratio statistic for testing λ = 1 on exponential data, simulated under the null, against its chi-squared(1) limit. */
export function WilksViz() {
  const [j, setJ] = useState(1);
  const n = NS[j];
  const stats = useMemo(() => {
    const r = makeRng(5 + 13 * n);
    return Array.from({ length: REPS }, () => {
      let s = 0;
      for (let i = 0; i < n; i++) s -= Math.log(Math.max(r(), 1e-12));
      const m = s / n;
      return 2 * n * (m - 1 - Math.log(m));
    });
  }, [n]);
  const hi = 8, nb = 32, bw = hi / nb;
  const counts = Array(nb).fill(0);
  stats.forEach((v) => { const b = Math.floor(v / bw); if (b < nb) counts[b]++; });
  const rej = stats.filter((v) => v > 3.841).length / REPS;
  const W = 330, H = 150, ymax = 1.2;
  const X = (x: number) => 14 + (x / hi) * (W - 28);
  const Y = (y: number) => H - 14 - (Math.min(y, ymax) / ymax) * (H - 24);
  const xs = Array.from({ length: 200 }, (_, i) => (hi * (i + 1)) / 200);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          sample size n = {n}
          <input type="range" min={0} max={NS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="sample size" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the likelihood ratio statistic with the chi-squared density">
        {counts.map((c, i) => (
          <rect key={i} x={X(i * bw)} y={Y(c / (REPS * bw))} width={X(bw) - X(0) - 0.5} height={Y(0) - Y(c / (REPS * bw))} fill="var(--accent)" opacity={0.35} />
        ))}
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(chi1(x)).toFixed(1)}`).join(" ")} />
        <line x1={X(3.841)} x2={X(3.841)} y1={10} y2={Y(0)} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(3.841) + 3} y={20} className="viz-label">3.84</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        fraction above 3.841: {rej.toFixed(3)} (limit 0.050)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The bars are {REPS} values of −2 log Λ = 2n(X̄ − 1 − log X̄), the likelihood ratio statistic for λ = 1, computed
        from exponential samples for which λ = 1 really holds. The curve is the chi-squared density with one degree of
        freedom. Already for n around 10 the fit is close, and the fraction beyond the 95% point 3.841 (dashed line) is near
        5%, as Wilks&apos; theorem promises.
      </figcaption>
    </figure>
  );
}
