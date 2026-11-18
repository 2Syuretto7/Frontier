"use client";

import { useState } from "react";

const KS = [1, 5, 15];
const RATIOS = [0.25, 1, 4, 16];
const XLO = -6, XHI = 5;

const logSig = (z: number) => -Math.log1p(Math.exp(-z));

/** Expected skip-gram negative-sampling objective for one (word, context) cell, per expected co-occurrence. */
export const objective = (x: number, ratio: number, k: number) => ratio * logSig(x) + k * logSig(-x);
export const optimum = (ratio: number, k: number) => Math.log(ratio) - Math.log(k);

export function SgnsOptimumViz() {
  const [k, setK] = useState(5);
  const [ratio, setRatio] = useState(4);
  const xs = Array.from({ length: 221 }, (_, i) => XLO + ((XHI - XLO) * i) / 220);
  const ys = xs.map((x) => objective(x, ratio, k));
  const ymax = Math.max(...ys), ymin = ymax - 6;
  const W = 330, H = 150, X0 = 14, PW = W - 24, PH = 125;
  const sx = (x: number) => X0 + ((x - XLO) / (XHI - XLO)) * PW;
  const sy = (y: number) => 8 + (1 - (Math.max(y, ymin) - ymin) / (ymax - ymin)) * PH;
  const xo = optimum(ratio, k);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {KS.map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={v === k} onClick={() => setK(v)}>k = {v}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        {RATIOS.map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={v === ratio} onClick={() => setRatio(v)}>{v} × chance</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Negative-sampling objective for one word-context pair against the dot product">
        <line x1={sx(0)} y1={8} x2={sx(0)} y2={8 + PH} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={xs.map((x, i) => `${sx(x)},${sy(ys[i])}`).join(" ")} />
        <line x1={sx(xo)} y1={8} x2={sx(xo)} y2={8 + PH} stroke="var(--danger)" strokeDasharray="3 3" />
        <circle cx={sx(xo)} cy={sy(objective(xo, ratio, k))} r={4} fill="var(--danger)" />
        <text x={sx(0)} y={H + 12} textAnchor="middle" className="viz-label">0</text>
        <text x={X0} y={H + 12} className="viz-label">{XLO}</text>
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">{XHI}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        best dot product = log {ratio} − log {k} = PMI − log k = {xo.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The skip-gram objective for one word and one context, as a function of the dot product x of their vectors. Real
        co-occurrences pull x up through log σ(x); k negative samples, drawn in proportion to how often the pair would meet by
        chance, push it down through log σ(−x). The balance point is the pointwise mutual information of the pair minus log k:
        pairs that meet more often than chance get positive dot products, and raising k shifts everything down.
      </figcaption>
    </figure>
  );
}
