"use client";

import { useMemo, useState } from "react";

const C = 3, T = 1500;

/** Online linear losses g_t·x on [−1, 1] with g_t = C when t ≡ 1 (mod 3) and −1 otherwise; β₁ = 0, rates 0.5/√t. */
export function reddiPath(b2: number, amsgrad: boolean) {
  let x = 0, v = 0, vmax = 0;
  const xs: number[] = [];
  for (let t = 1; t <= T; t++) {
    const g = t % 3 === 1 ? C : -1;
    v = b2 * v + (1 - b2) * g * g;
    vmax = Math.max(vmax, v);
    x = Math.min(1, Math.max(-1, x - ((0.5 / Math.sqrt(t)) * g) / Math.sqrt(amsgrad ? vmax : v)));
    xs.push(x);
  }
  return xs;
}

/** Net movement per period of three steps, in units of the rate, once v has settled into its cycle. */
export function drift(b2: number) {
  const v3 = ((1 - b2) * (b2 * b2 * C * C + b2 + 1)) / (1 - b2 ** 3);
  const v1 = b2 * v3 + (1 - b2) * C * C, v2 = b2 * v1 + (1 - b2);
  return -C / Math.sqrt(v1) + 1 / Math.sqrt(v2) + 1 / Math.sqrt(v3);
}

export function AmsgradViz() {
  const [b2, setB2] = useState(0.1);
  const runs = useMemo(() => ({ adam: reddiPath(b2, false), ams: reddiPath(b2, true) }), [b2]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (x: number) => 8 + ((1 - x) / 2) * PH;
  const line = (a: number[]) => a.filter((_, t) => t % 3 === 2).map((x, j) => `${sx(3 * j + 3)},${sy(x)}`).join(" ");
  const d = drift(b2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">β₂</span>
        {[0.1, 0.4, 0.6, 0.9].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={b2 === v} onClick={() => setB2(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Iterates of Adam and AMSGrad on an online problem whose best point is −1">
        <line x1={X0} y1={sy(-1)} x2={X0 + PW} y2={sy(-1)} stroke="var(--success)" strokeDasharray="4 3" />
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={line(runs.adam)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(runs.ams)} />
        {[0, 500, 1000, 1500].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[-1, 0, 1].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`Adam drift per period ${d.toFixed(3)} (${d > 0 ? "towards +1, wrong" : "towards −1, right"}); final x: Adam ${runs.adam[T - 1].toFixed(2)}, AMSGrad ${runs.ams[T - 1].toFixed(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Losses 3x, −x, −x repeating on [−1, 1], so the best fixed point is −1 (green). Adam with β₁ = 0 (red) and AMSGrad
        (blue), both with rates 0.5/√t, plotted at the end of each period. With short memory, Adam divides the rare large
        gradient by its own size and the two small ones by theirs, so the frequent wrong-signed steps win and the iterate
        heads to +1. AMSGrad divides by the largest v seen and goes to −1 for every β₂; Adam recovers once β₂ passes about
        0.47.
      </figcaption>
    </figure>
  );
}
