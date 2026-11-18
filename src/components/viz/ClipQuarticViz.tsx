"use client";

import { useMemo, useState } from "react";

const LR = 0.1, C = 1, T = 120;

/** Gradient descent and clipped gradient descent on f(x) = x⁴/4, whose curvature 3x² grows with the gradient x³. */
export function quarticRuns(x0: number) {
  const gd: number[] = [x0], clip: number[] = [x0];
  let x = x0, diverged = -1;
  for (let t = 1; t <= T; t++) {
    x = x - LR * x ** 3;
    if (Math.abs(x) > 1e6) { diverged = t; break; }
    gd.push(x);
  }
  x = x0;
  let entry = -1;
  for (let t = 1; t <= T; t++) {
    const g = x ** 3;
    x = g === 0 ? x : x - LR * g * Math.min(1, C / Math.abs(g));
    clip.push(x);
    if (entry < 0 && Math.abs(x) ** 3 <= C) entry = t;
  }
  return { gd, clip, diverged, entry };
}

export function ClipQuarticViz() {
  const [x0, setX0] = useState(5);
  const run = useMemo(() => quarticRuns(x0), [x0]);
  const W = 320, H = 200, X1 = 38, PW = W - X1 - 8, PH = H - 34;
  const LO = -4, HI = 6;
  const sx = (t: number) => X1 + (t / T) * PW;
  const sy = (v: number) => {
    const l = Math.min(Math.max(Math.log10(Math.max(v, 1e-12)), LO), HI);
    return 8 + (1 - (l - LO) / (HI - LO)) * PH;
  };
  const f = (x: number) => x ** 4 / 4;
  const pts = (a: number[]) => a.map((x, t) => `${sx(t)},${sy(f(x))}`).join(" ");
  const gdLine = run.diverged >= 0 ? `plain: |x| passes 10⁶ at step ${run.diverged}` : `plain: loss after ${T} steps ${f(run.gd[T]).toExponential(1)}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">start x₀</span>
        {[2, 4, 5, 8].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={x0 === v} onClick={() => setX0(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Loss of plain and clipped gradient descent on x to the fourth over 4">
        <line x1={X1} y1={sy(1e-4)} x2={X1 + PW} y2={sy(1e-4)} stroke="var(--border)" />
        <line x1={X1} y1={sy(1e-4)} x2={X1} y2={sy(1e6)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={pts(run.gd)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={pts(run.clip)} />
        {[-4, 0, 3, 6].map((p) => (
          <text key={p} x={X1 - 4} y={sy(10 ** p) + 4} textAnchor="end" className="viz-label">{`1e${p}`}</text>
        ))}
        {[0, 60, 120].map((t) => (
          <text key={t} x={sx(t)} y={H - 10} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div style={{ color: "var(--danger)" }}>{gdLine}</div>
        <div style={{ color: "var(--accent)" }}>{`clipped: |x|³ ≤ 1 from step ${run.entry}; loss after ${T} steps ${f(run.clip[T]).toExponential(1)}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Loss x⁴/4 on a log scale for gradient descent with η = 0.1 (red) and the same method with gradients clipped to
        norm 1 (blue). The curvature 3x² is large exactly where the gradient x³ is large, so a step size that is safe near
        the minimum overshoots far from it: plain descent diverges once ηx₀² &gt; 2, which among the starts shown means x₀ = 5 and x₀ = 8. Clipping turns
        large gradients into steps of fixed length ηc = 0.1, walks in at a steady rate, and then behaves like plain
        descent.
      </figcaption>
    </figure>
  );
}
