"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

const T = 300;
const normal = makeNormal(makeRng(17));
/** A synthetic loss curve: exponential decay, noise, a sharp spike at step 150 and a slower bump from step 240. */
export const LOSS = Array.from({ length: T }, (_, t) => {
  let v = 2 + 3 * Math.exp(-t / 70) + 0.08 * normal();
  if (t >= 150 && t < 156) v += 2.2 * Math.exp(-(t - 150) / 1.5);
  if (t >= 240 && t < 270) v += 0.5 * Math.sin(((t - 240) / 30) * Math.PI);
  return v;
});

export function ema(xs: number[], beta: number) {
  let m = 0;
  return xs.map((x, i) => {
    m = beta * m + (1 - beta) * x;
    return m / (1 - beta ** (i + 1));
  });
}

/** Steps whose loss exceeds the mean of the previous window by z standard deviations. */
export function spikes(xs: number[], window: number, z: number) {
  const out: number[] = [];
  for (let i = window; i < xs.length; i++) {
    const prev = xs.slice(i - window, i), mu = prev.reduce((s, v) => s + v, 0) / window;
    const sd = Math.sqrt(prev.reduce((s, v) => s + (v - mu) ** 2, 0) / window);
    if (xs[i] > mu + z * sd) out.push(i);
  }
  return out;
}

export function LossSpikeViz() {
  const [beta, setBeta] = useState(0.9);
  const [z, setZ] = useState(4);
  const sm = ema(LOSS, beta), found = spikes(LOSS, 20, z);
  const W = 300, H = 150, X0 = 26, PW = W - 32, PH = 130, YMAX = 6, YMIN = 1.5;
  const sx = (t: number) => X0 + (t / (T - 1)) * PW, sy = (v: number) => 8 + ((YMAX - Math.min(v, YMAX)) / (YMAX - YMIN)) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">EMA β</span>
        {[0.9, 0.98].map((b) => (
          <button key={b} type="button" className="seg" aria-pressed={beta === b} onClick={() => setBeta(b)}>{b}</button>
        ))}
        <span className="viz-label">spike z</span>
        {[3, 4, 6].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={z === v} onClick={() => setZ(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Training loss, its moving average and detected spikes">
        <polyline fill="none" stroke="var(--text-muted)" strokeOpacity={0.6} strokeWidth={1} points={LOSS.map((v, t) => `${sx(t)},${sy(v)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={sm.map((v, t) => `${sx(t)},${sy(v)}`).join(" ")} />
        {found.map((t) => (
          <circle key={t} cx={sx(t)} cy={sy(LOSS[t])} r={3.5} fill="none" stroke="var(--danger)" strokeWidth={1.5} />
        ))}
        {[2, 4, 6].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[0, 100, 200, 299].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t + 1}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`flagged steps: ${found.length ? found.map((t) => t + 1).join(", ") : "none"}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A noisy loss curve (grey) with a bias-corrected exponential moving average (blue) and a detector that flags a step
        when its loss is more than z standard deviations above the previous 20 steps (red circles). The sharp spike at step
        151 is caught at any threshold; the slow bump from step 241 is flagged at most once, at z = 3, because each step is
        only slightly above the last, and it shows clearly only in the moving average. A larger β smooths more but lags further behind the raw curve.
      </figcaption>
    </figure>
  );
}
