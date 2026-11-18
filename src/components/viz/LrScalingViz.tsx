"use client";

import { useState } from "react";

const H_DIAG = [1.0, 0.05];
const LRS = Array.from({ length: 195 }, (_, i) => 0.01 * (i + 1));
const BS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const TARGET = 0.01;
const BASE = 4;

/** Learning rate that reaches expected loss TARGET in the fewest steps for noisy-gradient SGD on ½Σhᵢxᵢ² from x = (1, 1). */
export function bestLr(B: number, sigma2: number) {
  let best = Infinity, arg: number | null = null;
  for (const lr of LRS) {
    let m = [1, 1];
    for (let k = 1; k <= Math.min(best - 1, 5000); k++) {
      m = m.map((v, i) => (1 - lr * H_DIAG[i]) ** 2 * v + (lr * lr * sigma2) / B);
      if (0.5 * (H_DIAG[0] * m[0] + H_DIAG[1] * m[1]) <= TARGET) {
        best = k;
        arg = lr;
        break;
      }
    }
  }
  return arg;
}

export function LrScalingViz() {
  const [sigma2, setSigma2] = useState(1);
  const pts = BS.map((B) => ({ B, lr: bestLr(B, sigma2) })).filter((p): p is { B: number; lr: number } => p.lr !== null);
  const base = pts.find((p) => p.B === BASE)?.lr ?? pts[0].lr;
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const lx0 = Math.log10(2), lx1 = Math.log10(1024), ly0 = -2.5, ly1 = 1;
  const sx = (B: number) => X0 + ((Math.log10(B) - lx0) / (lx1 - lx0)) * PW;
  const sy = (lr: number) => 8 + (1 - (Math.min(ly1, Math.max(ly0, Math.log10(lr))) - ly0) / (ly1 - ly0)) * PH;
  const curve = Array.from({ length: 41 }, (_, i) => 2 * 512 ** (i / 40));
  const last = pts[pts.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">gradient noise σ²</span>
        {[0.25, 1, 4].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={sigma2 === v} onClick={() => setSigma2(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Best learning rate against batch size, with the linear and square-root rules extrapolated from a small batch">
        <line x1={X0} y1={sy(2)} x2={X0 + PW} y2={sy(2)} stroke="var(--danger)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="5 3" points={curve.map((B) => `${sx(B)},${sy((base * B) / BASE)}`).join(" ")} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="2 3" points={curve.map((B) => `${sx(B)},${sy(base * Math.sqrt(B / BASE))}`).join(" ")} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={pts.map((p) => `${sx(p.B)},${sy(p.lr)}`).join(" ")} />
        {pts.map((p) => (
          <circle key={p.B} cx={sx(p.B)} cy={sy(p.lr)} r={3.5} fill="var(--text)" />
        ))}
        {[2, 8, 32, 128, 512].map((B) => (
          <text key={B} x={sx(B)} y={H + 12} textAnchor="middle" className="viz-label">{B}</text>
        ))}
        {[0.01, 0.1, 1].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`best η at B = ${BASE}: ${base.toFixed(2)}; at B = ${last.B}: ${last.lr.toFixed(2)}; linear rule says ${((base * last.B) / BASE).toFixed(1)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The learning rate that reaches a fixed expected loss fastest on a noisy quadratic, tuned separately at each batch size
        (dots), against the linear rule (dashed blue) and the square-root rule (dotted grey) extrapolated from B = 4. For
        small batches the best rate grows in proportion to B, as the linear rule says; then it bends and levels off below the
        stability limit 2/h_max (red), where no rescaling can follow. More noise moves the bend to larger batches.
      </figcaption>
    </figure>
  );
}
