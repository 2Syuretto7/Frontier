"use client";

import { useState } from "react";

const f = Math.fround;
const XS = Array.from({ length: 161 }, (_, i) => -120 + i * 1.5);

/** Float32 evaluation of softplus and its derivative, naively and stably. NaN and Infinity are kept as they come out. */
export function naive(x: number, grad: boolean) {
  const e = f(Math.exp(f(x)));
  return grad ? f(e / f(1 + e)) : f(Math.log(f(1 + e)));
}

export function stable(x: number, grad: boolean) {
  return grad ? f(0.5 * f(1 + f(Math.tanh(f(x / 2))))) : f(Math.max(x, 0) + f(Math.log1p(f(Math.exp(-Math.abs(x))))));
}

export function SoftplusGradViz() {
  const [grad, setGrad] = useState(true);
  const W = 300, H = 180, X0 = 30, PW = W - 38, PH = 150;
  const ymax = grad ? 1.2 : 130, ymin = grad ? -0.1 : -10;
  const sx = (x: number) => X0 + ((x + 120) / 240) * PW, sy = (v: number) => 8 + ((ymax - v) / (ymax - ymin)) * PH;
  const bad = XS.filter((x) => !Number.isFinite(naive(x, grad)));
  const firstBad = bad.length ? bad[0] : null;
  const good = XS.filter((x) => Number.isFinite(naive(x, grad)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!grad} onClick={() => setGrad(false)}>forward: softplus</button>
        <button type="button" className="seg" aria-pressed={grad} onClick={() => setGrad(true)}>backward: its derivative</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Naive and stable float32 softplus and its derivative">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(0)} y1={8} x2={sx(0)} y2={8 + PH} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={3} strokeOpacity={0.5} points={XS.map((x) => `${sx(x)},${sy(stable(x, grad))}`).join(" ")} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="3 2" points={good.map((x) => `${sx(x)},${sy(naive(x, grad))}`).join(" ")} />
        {bad.filter((_, i) => i % 3 === 0).map((x) => (
          <text key={x} x={sx(x)} y={sy(grad ? 0.5 : 60) + 4} textAnchor="middle" className="viz-label" style={{ fill: "var(--danger)" }}>×</text>
        ))}
        {[-100, -50, 0, 50, 100].map((x) => (
          <text key={x} x={sx(x)} y={H + 12} textAnchor="middle" className="viz-label">{x}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {firstBad !== null ? `naive float32 gives ${naive(firstBad, grad)} from x = ${firstBad} on` : "naive version is finite everywhere"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Softplus log(1 + eˣ) and its derivative eˣ/(1 + eˣ), computed in float32. The thin dashed line is the formula as
        written; the red crosses mark where it stops being a number, because eˣ overflows past about 88.7. The thick line is
        the stable version a custom autograd function can supply: max(x, 0) + log1p(e^−|x|) forward and ½(1 + tanh(x/2))
        backward, both finite everywhere.
      </figcaption>
    </figure>
  );
}
