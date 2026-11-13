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

const T975 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];
function t975(df: number) {
  if (df <= 30) return T975[df - 1];
  const z = 1.959964;
  return z + (z * z * z + z) / (4 * df);
}

/** A fitted regression line with its 95% confidence band for the mean response and the wider 95% prediction band for a new observation. */
export function PredBandViz() {
  const [n, setN] = useState(12);
  const [seed, setSeed] = useState(1);
  const pts = useMemo(() => {
    const r = makeRng(seed * 3301);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: 100 }, () => { const x = 1 + 8 * r(); return [x, 1 + 0.5 * x + normal()]; });
  }, [seed]);
  const d = pts.slice(0, n);
  const mx = d.reduce((s, p) => s + p[0], 0) / n, my = d.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0;
  d.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) * (x - mx); });
  const b1 = sxy / sxx, b0 = my - b1 * mx;
  const sse = d.reduce((s, [x, y]) => s + (y - b0 - b1 * x) * (y - b0 - b1 * x), 0);
  const s = Math.sqrt(sse / (n - 2));
  const tc = t975(n - 2);
  const xs = Array.from({ length: 61 }, (_, i) => (10 * i) / 60);
  const ci = (x: number) => tc * s * Math.sqrt(1 / n + ((x - mx) * (x - mx)) / sxx);
  const pi = (x: number) => tc * s * Math.sqrt(1 + 1 / n + ((x - mx) * (x - mx)) / sxx);
  const W = 330, H = 170;
  const X = (x: number) => 14 + (x / 10) * (W - 28);
  const Y = (y: number) => H - 12 - ((Math.max(-4, Math.min(12, y)) + 4) / 16) * (H - 22);
  const band = (f: (x: number) => number) =>
    [...xs.map((x) => `${X(x).toFixed(1)},${Y(b0 + b1 * x + f(x)).toFixed(1)}`), ...xs.slice().reverse().map((x) => `${X(x).toFixed(1)},${Y(b0 + b1 * x - f(x)).toFixed(1)}`)].join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={4} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 130 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Regression line with confidence and prediction bands">
        <polygon points={band(pi)} fill="var(--text-muted)" opacity={0.15} />
        <polygon points={band(ci)} fill="var(--accent)" opacity={0.3} />
        <line x1={X(0)} y1={Y(b0)} x2={X(10)} y2={Y(b0 + 10 * b1)} stroke="var(--accent)" strokeWidth={1.8} />
        <line x1={X(0)} y1={Y(1)} x2={X(10)} y2={Y(6)} stroke="var(--text)" strokeDasharray="4 3" />
        {d.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={2.4} fill="var(--text)" opacity={0.7} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        slope {b1.toFixed(3)} ± {(tc * s / Math.sqrt(sxx)).toFixed(3)}; s = {s.toFixed(3)}; half-widths at x = 5: mean {ci(5).toFixed(2)}, new point {pi(5).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid line is the least squares fit and the dashed line the true mean 1 + 0.5x. The inner band is the 95%
        confidence band for the mean response; it narrows like 1/√n and flares away from x̄. The outer band is the 95%
        prediction band for a new observation, which must also include the noise of that observation, so it never shrinks
        below about ±1.96σ however large n is.
      </figcaption>
    </figure>
  );
}
