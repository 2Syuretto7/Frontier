"use client";

import { useState } from "react";

const KS = [1, 3, 5, 7, 9, 11, 13, 15];
const CS = [64, 256, 1024];

export const standard = (k: number, c: number) => k * k * c * c;
export const separable = (k: number, c: number) => k * k * c + c * c;

export function SeparableCostViz() {
  const [ci, setCi] = useState(1);
  const c = CS[ci];
  const W = 300, H = 200, X0 = 34, PW = W - 42, PH = 172, LMIN = 3, LMAX = 9;
  const sx = (k: number) => X0 + ((k - 1) / 14) * PW, sy = (v: number) => 8 + ((LMAX - Math.log10(v)) / (LMAX - LMIN)) * PH;
  const pts = (f: (k: number, c: number) => number) => KS.map((k) => `${sx(k)},${sy(f(k, c))}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {CS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={i === ci} onClick={() => setCi(i)}>{v} channels</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Parameters of a standard and a depthwise-separable convolution against kernel size">
        <line x1={X0} y1={sy(10 ** LMIN)} x2={X0 + PW} y2={sy(10 ** LMIN)} stroke="var(--border)" />
        <line x1={X0} y1={sy(10 ** LMIN)} x2={X0} y2={sy(10 ** LMAX)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 3" points={pts(standard)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts(separable)} />
        {KS.map((k) => (
          <g key={k}>
            <circle cx={sx(k)} cy={sy(standard(k, c))} r={2.5} fill="var(--danger)" />
            <circle cx={sx(k)} cy={sy(separable(k, c))} r={2.5} fill="var(--accent)" />
          </g>
        ))}
        {[1, 3, 7, 11, 15].map((k) => (
          <text key={k} x={sx(k)} y={H + 12} textAnchor="middle" className="viz-label">{k}</text>
        ))}
        {[3, 5, 7, 9].map((v) => (
          <text key={v} x={X0 - 4} y={sy(10 ** v) + 4} textAnchor="end" className="viz-label">{`1e${v}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`7 × 7: standard ${standard(7, c).toLocaleString("en-IN")}, separable ${separable(7, c).toLocaleString("en-IN")} (${(standard(7, c) / separable(7, c)).toFixed(1)} times fewer)`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Weights of one convolution layer mapping C channels to C channels, against kernel size (log scale). The red dashed
        curve is a standard convolution, k²C². The colour curve is a depthwise convolution (one k × k filter per channel)
        followed by a 1 × 1 convolution, k²C + C². For wide layers the 1 × 1 part dominates, so growing the spatial kernel is
        almost free.
      </figcaption>
    </figure>
  );
}
