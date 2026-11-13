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

const REPS = 4000;

/** Many samples of size n from a standard normal: dividing the sum of squared deviations by n underestimates the variance 1 by the factor (n − 1)/n; dividing by n − 1 does not. */
export function BesselViz() {
  const [n, setN] = useState(4);
  const res = useMemo(() => {
    const r = makeRng(7 + n);
    const normal = () => {
      const u = Math.max(r(), 1e-12), v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    let sumN = 0, sumN1 = 0;
    const first: number[] = [];
    const ssd: number[] = [];
    for (let k = 0; k < REPS; k++) {
      const xs = Array.from({ length: n }, normal);
      const m = xs.reduce((a, b) => a + b, 0) / n;
      const ss = xs.reduce((a, x) => a + (x - m) * (x - m), 0);
      sumN += ss / n;
      sumN1 += ss / (n - 1);
      if (k === 0) first.push(...xs);
      if (k < 400) ssd.push(ss / (n - 1));
    }
    return { biased: sumN / REPS, unbiased: sumN1 / REPS, first, ssd };
  }, [n]);
  const W = 330, H = 150;
  const X = (v: number) => 20 + (v / 1.4) * (W - 40);
  const bar = (label: string, v: number, row: number, color: string) => (
    <g>
      <text x={20} y={22 + row * 34} className="viz-label">{label}</text>
      <rect x={X(0)} y={28 + row * 34} width={X(v) - X(0)} height={12} fill={color} opacity={0.7} />
      <text x={X(v) + 4} y={38 + row * 34} className="viz-label">{v.toFixed(3)}</text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          sample size n = {n}
          <input type="range" min={2} max={30} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Average of the two variance estimators over many samples, against the true variance">
        <line x1={X(1)} x2={X(1)} y1={10} y2={H - 30} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={X(1)} y={H - 18} textAnchor="middle" className="viz-label">σ² = 1</text>
        <line x1={X((n - 1) / n)} x2={X((n - 1) / n)} y1={20} y2={H - 30} stroke="var(--danger)" strokeDasharray="2 2" opacity={0.7} />
        {bar("divide by n", res.biased, 0, "var(--danger)")}
        {bar("divide by n − 1", res.unbiased, 1, "var(--accent)")}
        <text x={X((n - 1) / n)} y={H - 4} textAnchor="middle" className="viz-label">(n − 1)/n = {((n - 1) / n).toFixed(3)}</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar is the average of an estimator over {REPS} simulated samples of size n from a normal distribution with
        variance 1. Deviations are measured from the sample mean, which sits closer to the data than the true mean does, so
        the sum of squares comes out too small on average, by exactly one σ². Dividing by n − 1 corrects this; dividing by n
        gives about (n − 1)/n, a bias that matters for small n and fades as n grows.
      </figcaption>
    </figure>
  );
}
