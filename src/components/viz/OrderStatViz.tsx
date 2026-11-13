"use client";

import { useState } from "react";

function logChoose(n: number, k: number) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i);
  return s;
}

/** The density of the k-th smallest of n independent uniforms, a Beta(k, n − k + 1) distribution with mean k/(n + 1). */
export function OrderStatViz() {
  const [n, setN] = useState(9);
  const [k, setK] = useState(5);
  const kk = Math.min(k, n);
  // density n C(n-1, k-1) x^(k-1) (1-x)^(n-k)
  const logc = Math.log(n) + logChoose(n - 1, kk - 1);
  const dens = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.exp(logc + (kk - 1) * Math.log(x) + (n - kk) * Math.log(1 - x)));
  const xs = Array.from({ length: 401 }, (_, i) => i / 400);
  const ys = xs.map(dens);
  const ymax = Math.max(...ys, 1) * 1.1;
  const mean = kk / (n + 1);
  const W = 330, H = 160;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 16 - (y / ymax) * (H - 26);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={1} max={40} value={n} onChange={(e) => { const v = Number(e.target.value); setN(v); if (k > v) setK(v); }} aria-label="sample size" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          k = {kk}
          <input type="range" min={1} max={n} value={kk} onChange={(e) => setK(Number(e.target.value))} aria-label="rank k" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Density of the k-th order statistic of n uniforms">
        <polygon points={[`${X(0)},${Y(0)}`, ...xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`), `${X(1)},${Y(0)}`].join(" ")} fill="var(--accent)" opacity={0.2} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(" ")} />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(mean)} x2={X(mean)} y1={10} y2={Y(0)} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        mean k/(n + 1) = {mean.toFixed(4)}; variance = {(mean * (1 - mean) / (n + 2)).toFixed(5)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The k-th smallest of n uniform draws on [0, 1] lies below x exactly when at least k of the draws do, which gives its
        density n·C(n − 1, k − 1)·x^(k − 1)(1 − x)^(n − k). The n points split [0, 1] into n + 1 gaps of equal expected length,
        so its mean (dashed line) is k/(n + 1). Raise n with k near n/2 and the median concentrates around 1/2; set k = n for
        the maximum, which piles up near 1.
      </figcaption>
    </figure>
  );
}
