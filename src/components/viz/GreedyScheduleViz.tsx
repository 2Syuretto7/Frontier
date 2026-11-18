"use client";

import { useMemo, useState } from "react";

const T = 1000, H = 1, M0 = 1;

function finalM(lrs: (t: number) => number, sigma2: number) {
  let m = M0;
  for (let t = 0; t < T; t++) {
    const lr = lrs(t);
    m = (1 - lr * H) ** 2 * m + lr * lr * sigma2;
  }
  return m;
}

/** The per-step optimal rate for one noisy coordinate, its error, and the best constant and cosine schedules for comparison. */
export function greedyRun(sigma2: number) {
  let m = M0;
  const lrs: number[] = [], ms: number[] = [];
  for (let t = 0; t < T; t++) {
    const lr = (H * m) / (H * H * m + sigma2);
    m = (1 - lr * H) ** 2 * m + lr * lr * sigma2;
    lrs.push(lr);
    ms.push(m);
  }
  const grid = Array.from({ length: 81 }, (_, i) => 10 ** (-4 + i / 20));
  const bestConst = Math.min(...grid.map((g) => finalM(() => g, sigma2)));
  const bestCos = Math.min(...grid.map((g) => finalM((t) => 0.5 * g * (1 + Math.cos((Math.PI * t) / T)), sigma2)));
  return { lrs, ms, bestConst, bestCos };
}

export function GreedyScheduleViz() {
  const [sigma2, setSigma2] = useState(0.1);
  const r = useMemo(() => greedyRun(sigma2), [sigma2]);
  const W = 300, HT = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (Math.log10(t) / 3) * PW;
  const sy = (v: number) => 8 + ((0.5 - Math.max(-6, Math.min(0.5, Math.log10(v)))) / 6.5) * PH;
  const line = (a: number[]) => a.map((v, t) => `${sx(t + 1)},${sy(v)}`).join(" ");
  const knee = sigma2 / (H * H * M0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">gradient noise σ²</span>
        {[0.001, 0.1, 10].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={sigma2 === v} onClick={() => setSigma2(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${HT + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="The optimal learning rate and the resulting error against the step number, on log scales">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(r.lrs)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="4 3" points={line(r.ms)} />
        {knee >= 1 && knee <= T && <line x1={sx(knee)} y1={8} x2={sx(knee)} y2={8 + PH} stroke="var(--danger)" strokeDasharray="2 3" />}
        {[1, 10, 100, 1000].map((t) => (
          <text key={t} x={sx(t)} y={HT + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[1, 0.01, 0.0001].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`E[x²] after ${T} steps: optimal ${r.ms[T - 1].toExponential(2)}, best cosine ${r.bestCos.toExponential(2)}, best constant ${r.bestConst.toExponential(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        One coordinate with curvature 1, starting at E[x²] = 1. Blue: the learning rate that minimises E[x²] after every
        step; dashed: the resulting E[x²]; both on log scales. The rate stays near 1/h until about σ²/(h²m₀) steps (red),
        while the starting error dominates the noise, and then falls like 1/(ht). The readout compares the error after{" "}
        {T} steps with the best constant rate and the best cosine schedule found by a grid search over their peak.
      </figcaption>
    </figure>
  );
}
