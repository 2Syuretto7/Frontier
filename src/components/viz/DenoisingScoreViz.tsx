"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MUS = [-2, 2], V0 = 0.09;
/** Score of the data mixture 0.5 N(-2, 0.3^2) + 0.5 N(2, 0.3^2) after adding N(0, sigma^2) noise. */
export function noisyScore(x: number, s: number) {
  const v = V0 + s * s;
  const d = MUS.map((m) => Math.exp(-((x - m) ** 2) / (2 * v)));
  return (d[0] * (-(x - MUS[0]) / v) + d[1] * (-(x - MUS[1]) / v)) / (d[0] + d[1]);
}

/** Denoising pairs (noisy point, target -eps/sigma) and binned averages of the targets. */
export function pairs(s: number, n: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const pts = Array.from({ length: n }, () => { const x = MUS[r() < 0.5 ? 0 : 1] + 0.3 * nrm(), e = nrm(); return [x + s * e, -e / s] as [number, number]; });
  const bins: { x: number; m: number; n: number }[] = [];
  for (let b = -4; b < 4; b += 0.5) {
    const inb = pts.filter((p) => p[0] >= b && p[0] < b + 0.5);
    if (inb.length >= 30) bins.push({ x: b + 0.25, m: inb.reduce((a, p) => a + p[1], 0) / inb.length, n: inb.length });
  }
  const err = Math.max(...bins.map((b) => Math.abs(b.m - noisyScore(b.x, s)) / (1 + Math.abs(noisyScore(b.x, s)))));
  return { pts, bins, err };
}

const SIGS = [0.2, 0.5, 1];

export function DenoisingScoreViz() {
  const [si, setSi] = useState(1);
  const s = SIGS[si];
  const { pts, bins } = useMemo(() => pairs(s, 4000, 3 + si), [s, si]);
  const W = 330, H = 200, X0 = 30, PW = W - 40, Y0 = 8, PH = H - Y0 - 30, YM = 12;
  const sx = (x: number) => X0 + ((x + 4) / 8) * PW, sy = (y: number) => Y0 + PH / 2 - (Math.max(-YM, Math.min(YM, y)) / YM) * (PH / 2);
  const grid = Array.from({ length: 321 }, (_, i) => -4 + (i * 8) / 320);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">noise σ</span>
        <div className="segmented" role="group" aria-label="Noise level">
          {SIGS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Denoising targets and the noisy score">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        {[-10, -5, 5, 10].map((t) => <text key={t} x={X0 - 4} y={sy(t) + 4} textAnchor="end" className="viz-label">{t}</text>)}
        {pts.slice(0, 900).map((p, i) => <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={1.2} fill="var(--text-muted)" fillOpacity={0.35} />)}
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(noisyScore(x, s)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {bins.map((b, i) => <circle key={`b${i}`} cx={sx(b.x)} cy={sy(b.m)} r={3.5} fill="var(--success)" stroke="var(--bg)" />)}
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={sx(t)} y={H - 8} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> target −ε/σ at the noisy point</span>
        <span><span style={{ color: "var(--success)" }}>●</span> average target per bin</span>
        <span><span style={{ color: "var(--accent)" }}>●</span> exact score of the noisy data</span>
      </div>
      <figcaption className="viz-caption">
        Data sit in two narrow bumps at ±2. Each grey dot takes a data point, adds noise σε and records the denoising target
        −ε/σ at the noisy location: the direction back to the clean point it came from, scaled by 1/σ². Targets at the same
        location disagree, because they came from different clean points, and more so for small σ, but their average (green)
        lies on the score of the noise-blurred data, which is what a network trained by least squares on these targets
        learns. With small σ no noisy points land between the bumps, so the score there is never trained.
      </figcaption>
    </figure>
  );
}
