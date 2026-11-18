"use client";

import { useMemo, useState } from "react";

const D = 20, TMAX = 1000;
const H = Array.from({ length: D }, (_, i) => 10 ** (-2 + (2 * i) / (D - 1)));
const LENGTHS = [250, 500, 1000];

/** Expected loss of noisy SGD on ½Σhᵢxᵢ² from xᵢ² = 1 under a cosine schedule of length T (then held at zero) or a constant rate. */
export function horizonLoss(sigma2: number, T: number | null, lr: number) {
  let m = H.map(() => 1);
  const out: number[] = [];
  for (let t = 0; t < TMAX; t++) {
    const eta = T === null ? lr : t < T ? 0.5 * lr * (1 + Math.cos((Math.PI * t) / T)) : 0;
    m = m.map((v, i) => (1 - eta * H[i]) ** 2 * v + eta * eta * sigma2);
    out.push(0.5 * m.reduce((s, v, i) => s + H[i] * v, 0));
  }
  return out;
}

export function CosineHorizonViz() {
  const [sigma2, setSigma2] = useState(0.01);
  const runs = useMemo(() => ({
    cos: LENGTHS.map((T) => horizonLoss(sigma2, T, 1)),
    flat: horizonLoss(sigma2, null, 0.3),
  }), [sigma2]);
  const W = 300, HT = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (t / TMAX) * PW;
  const sy = (f: number) => 8 + ((1 - Math.max(-3, Math.min(1, Math.log10(f)))) / 4) * PH;
  const line = (a: number[], n = TMAX) => a.slice(0, n).filter((_, t) => t % 5 === 4).map((f, j) => `${sx(5 * j + 5)},${sy(f)}`).join(" ");
  const cols = ["var(--danger)", "var(--text-muted)", "var(--accent)"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">gradient noise σ²</span>
        {[0.002, 0.01, 0.05].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={sigma2 === v} onClick={() => setSigma2(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${HT + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Loss curves of cosine schedules with three lengths and a constant rate">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="4 3" points={line(runs.flat)} />
        {runs.cos.map((a, k) => (
          <g key={k}>
            <polyline fill="none" stroke={cols[k]} strokeWidth={2} points={line(a, LENGTHS[k])} />
            <circle cx={sx(LENGTHS[k])} cy={sy(a[LENGTHS[k] - 1])} r={4} fill={cols[k]} />
          </g>
        ))}
        {[0, 250, 500, 750, 1000].map((t) => (
          <text key={t} x={sx(t)} y={HT + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[10, 0.1, 0.001].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`at step 250: 250-step cosine ${runs.cos[0][249].toFixed(4)}, 1000-step cosine ${runs.cos[2][249].toFixed(4)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Expected loss of noisy SGD on a quadratic with curvatures from 0.01 to 1, under cosine schedules from η = 1 to 0
        lasting 250 (red), 500 (grey) and 1000 (blue) steps, and a constant η = 0.3 (dashed). Each cosine run is best at its
        own end, where the falling rate removes the noise floor; partway through, a longer run is still at a high rate
        and is worse than a shorter run that has finished. A cosine schedule commits to its length in advance.
      </figcaption>
    </figure>
  );
}
