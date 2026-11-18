"use client";

import { useState } from "react";

/** With optimal step size, the loss decrease per step relative to the full-batch decrease, 1/(1 + B_noise/B). */
export const gain = (B: number, bNoise: number) => 1 / (1 + bNoise / B);
/** Progress per example processed, relative to its best value (reached as B → 0): gain · B_noise / B = 1/(1 + B/B_noise). */
export const perExample = (B: number, bNoise: number) => 1 / (1 + B / bNoise);

const LB0 = 0, LB1 = 5;

export function BatchGainViz() {
  const [bn, setBn] = useState(100);
  const W = 300, H = 150, X0 = 30, PW = W - 38, PH = 126;
  const sx = (B: number) => X0 + ((Math.log10(B) - LB0) / (LB1 - LB0)) * PW, sy = (v: number) => 8 + (1 - v) * PH;
  const Bs = Array.from({ length: 101 }, (_, i) => 10 ** (LB0 + (i / 100) * (LB1 - LB0)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">noise scale B_noise</span>
        {[10, 100, 1000].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={bn === v} onClick={() => setBn(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Progress per step and per example against batch size">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(bn)} y1={8} x2={sx(bn)} y2={8 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={Bs.map((B) => `${sx(B)},${sy(gain(B, bn))}`).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 3" points={Bs.map((B) => `${sx(B)},${sy(perExample(B, bn))}`).join(" ")} />
        {[1, 10, 100, 1000, 10000, 100000].map((B) => (
          <text key={B} x={sx(B)} y={H + 12} textAnchor="middle" className="viz-label">{B >= 1000 ? `${B / 1000}k` : B}</text>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`at B = B_noise = ${bn}: half the full-batch progress per step, half the best progress per example`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Progress per step (solid) and per example processed (dashed), each relative to its best possible value, as the
        batch grows, with the step size tuned for each batch. Below the noise scale, doubling the batch nearly doubles the
        progress per step, so examples are used almost perfectly; above it, each step is already close to a full-batch
        step and extra examples are mostly wasted. The crossover sits at B = B_noise, the ratio of the gradient noise to
        the squared gradient.
      </figcaption>
    </figure>
  );
}
