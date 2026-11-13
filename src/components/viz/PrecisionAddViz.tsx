"use client";

import { useState } from "react";

const npdf = (x: number, m: number, v: number) => Math.exp(-((x - m) * (x - m)) / (2 * v)) / Math.sqrt(2 * Math.PI * v);

/** Normal prior and normal likelihood for a mean with known σ = 1: precisions add, and the posterior mean is the precision-weighted average. */
export function PrecisionAddViz() {
  const [sd10, setSd10] = useState(10);
  const [n, setN] = useState(4);
  const [xb10, setXb10] = useState(20);
  const m0 = 0, v0 = Math.pow(sd10 / 10, 2);
  const xbar = xb10 / 10;
  const p0 = 1 / v0, pd = n;
  const p1 = p0 + pd;
  const m1 = (p0 * m0 + pd * xbar) / p1;
  const xs = Array.from({ length: 241 }, (_, i) => -3 + (7 * i) / 240);
  const curves: [number[], string, string?][] = [
    [xs.map((x) => npdf(x, m0, v0)), "var(--text-muted)", "4 3"],
    [xs.map((x) => (n > 0 ? npdf(x, xbar, 1 / n) : 0)), "var(--danger)", "2 2"],
    [xs.map((x) => npdf(x, m1, 1 / p1)), "var(--accent)"],
  ];
  const ymax = Math.max(...curves.flatMap((c) => c[0])) * 1.08;
  const W = 330, H = 140;
  const X = (x: number) => 14 + ((x + 3) / 7) * (W - 28);
  const Y = (y: number) => H - 14 - (y / ymax) * (H - 24);
  const BW = W - 28;
  const bar = (label: string, v: number, y: number, fill: string) => (
    <g>
      <rect x={14} y={y} width={(BW * v) / Math.max(p1, 1e-9)} height={10} fill={fill} opacity={0.6} />
      <text x={16} y={y + 22} className="viz-label">{label} {v.toFixed(2)}</text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          prior sd = {(sd10 / 10).toFixed(1)}
          <input type="range" min={2} max={40} value={sd10} onChange={(e) => setSd10(Number(e.target.value))} aria-label="prior standard deviation" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={0} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of observations" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x̄ = {xbar.toFixed(1)}
          <input type="range" min={-20} max={35} value={xb10} onChange={(e) => setXb10(Number(e.target.value))} aria-label="sample mean" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Prior, likelihood and posterior densities for a normal mean">
        {curves.map(([ys, stroke, dash], k) => (
          <polyline key={k} fill="none" stroke={stroke} strokeWidth={k === 2 ? 1.9 : 1.4} strokeDasharray={dash} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(" ")} />
        ))}
        <line x1={X(-3)} x2={X(4)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(-3)} y={H - 2} className="viz-label">−3</text>
        <text x={X(4)} y={H - 2} textAnchor="end" className="viz-label">4</text>
      </svg>
      <svg viewBox={`0 0 ${W} 90`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Precisions of prior, data and posterior">
        {bar("prior precision", p0, 4, "var(--text-muted)")}
        {bar("data precision n/σ²", pd, 32, "var(--danger)")}
        {bar("posterior precision", p1, 60, "var(--accent)")}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        posterior mean = ({p0.toFixed(2)}·0 + {pd}·{xbar.toFixed(1)})/{p1.toFixed(2)} = {m1.toFixed(3)}; sd {Math.sqrt(1 / p1).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The prior N(0, sd²) is dashed, the likelihood of n observations with mean x̄ dotted (danger), and the posterior
        solid. Precisions, reciprocal variances, simply add, as the bars show. The posterior mean is the average of the
        prior mean and x̄ weighted by their precisions, so a vague prior or many observations lets the data dominate.
      </figcaption>
    </figure>
  );
}
