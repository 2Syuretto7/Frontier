"use client";

import { useMemo, useState } from "react";

const T = 400;

/** Gradient size 1, except 10 for steps 40 to 79; per-step rates η/√acc for AdaGrad and bias-corrected RMSProp with η = 1. */
export function burstRates(beta: number) {
  let G = 0, v = 0;
  const ada: number[] = [], rms: number[] = [];
  for (let t = 1; t <= T; t++) {
    const g = t >= 40 && t < 80 ? 10 : 1;
    G += g * g;
    v = beta * v + (1 - beta) * g * g;
    ada.push(1 / Math.sqrt(G));
    rms.push(1 / Math.sqrt(v / (1 - beta ** t)));
  }
  return { ada, rms };
}

export function BurstRateViz() {
  const [beta, setBeta] = useState(0.9);
  const r = useMemo(() => burstRates(beta), [beta]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (e: number) => 8 + (-Math.max(-3, Math.log10(e)) / 3) * PH;
  const line = (a: number[]) => a.map((e, i) => `${sx(i + 1)},${sy(e)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">RMSProp β</span>
        {[0.9, 0.99, 0.999].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={beta === v} onClick={() => setBeta(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Per-step learning rate of AdaGrad and RMSProp through a burst of large gradients">
        <rect x={sx(40)} y={8} width={sx(80) - sx(40)} height={PH} fill="var(--accent-soft)" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={line(r.ada)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(r.rms)} />
        {[0, 100, 200, 300, 400].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[1, 0.1, 0.01, 0.001].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`rate at step ${T}: AdaGrad ${r.ada[T - 1].toFixed(3)}, RMSProp ${r.rms[T - 1].toFixed(3)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The rate η/√(accumulated g²) with η = 1 when the gradient has size 1 except for a burst of size 10 (shaded). AdaGrad
        (red) adds every square for ever, so its rate never comes back: by step 400 it is about a tenth of its value just before the burst. RMSProp
        (blue, bias-corrected) averages over roughly 1/(1 − β) steps: it drops during the burst and then recovers on that
        timescale. With β = 0.999 the memory outlasts the plot.
      </figcaption>
    </figure>
  );
}
