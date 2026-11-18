"use client";

import { useMemo, useState } from "react";

const C = 4, N = 64, STEPS = 3000, LR = 0.05, EVERY = 30;

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

/** Adam on a linear softmax classifier over separable clusters, with z-loss weight alpha. Tracks mean log Z, max |logit| and cross-entropy. */
export function zlossRun(alpha: number) {
  const g = gaussian(3);
  const centres = Array.from({ length: C }, () => [3 * g(), 3 * g()]);
  const y = Array.from({ length: N }, (_, n) => n % C);
  const X = y.map((c) => [centres[c][0] + 0.5 * g(), centres[c][1] + 0.5 * g(), 1]);
  const W = Array.from({ length: 3 }, () => new Array(C).fill(0));
  const m = W.map((r) => r.map(() => 0)), v = W.map((r) => r.map(() => 0));
  const lseTrace: number[] = [], maxTrace: number[] = [];
  let ce = 0;
  for (let t = 1; t <= STEPS; t++) {
    const grad = W.map((r) => r.map(() => 0));
    let lseSum = 0, maxAbs = 0;
    ce = 0;
    for (let n = 0; n < N; n++) {
      const z = Array.from({ length: C }, (_, c) => X[n][0] * W[0][c] + X[n][1] * W[1][c] + X[n][2] * W[2][c]);
      const mx = Math.max(...z);
      const lse = mx + Math.log(z.reduce((s, q) => s + Math.exp(q - mx), 0));
      lseSum += lse;
      ce += lse - z[y[n]];
      for (const q of z) maxAbs = Math.max(maxAbs, Math.abs(q));
      for (let c = 0; c < C; c++) {
        const p = Math.exp(z[c] - lse);
        const gz = (p - (c === y[n] ? 1 : 0) + 2 * alpha * lse * p) / N;
        for (let i = 0; i < 3; i++) grad[i][c] += X[n][i] * gz;
      }
    }
    ce /= N;
    if ((t - 1) % EVERY === 0) { lseTrace.push(lseSum / N); maxTrace.push(maxAbs); }
    for (let i = 0; i < 3; i++) for (let c = 0; c < C; c++) {
      m[i][c] = 0.9 * m[i][c] + 0.1 * grad[i][c];
      v[i][c] = 0.999 * v[i][c] + 0.001 * grad[i][c] ** 2;
      W[i][c] -= (LR * (m[i][c] / (1 - 0.9 ** t))) / (Math.sqrt(v[i][c] / (1 - 0.999 ** t)) + 1e-8);
    }
  }
  return { lseTrace, maxTrace, ce, lseEnd: lseTrace[lseTrace.length - 1], maxEnd: maxTrace[maxTrace.length - 1] };
}

export function ZLossViz() {
  const [alpha, setAlpha] = useState(0);
  const run = useMemo(() => zlossRun(alpha), [alpha]);
  const W = 320, H = 190, X1 = 30, PW = W - X1 - 8, PH = H - 34, TOP = 120;
  const sx = (i: number) => X1 + (i / (run.lseTrace.length - 1)) * PW;
  const sy = (v: number) => 8 + (1 - Math.min(Math.max(v, 0), TOP) / TOP) * PH;
  const pts = (a: number[]) => a.map((v, i) => `${sx(i)},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">z-loss weight α</span>
        {[0, 1e-4, 1e-2].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={alpha === v} onClick={() => setAlpha(v)}>{v === 0 ? "0" : v.toExponential(0)}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Mean log-partition and largest logit during training, with and without z-loss">
        <line x1={X1} y1={sy(0)} x2={X1 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X1} y1={sy(0)} x2={X1} y2={sy(TOP)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} points={pts(run.maxTrace)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={pts(run.lseTrace)} />
        {[0, 60, 120].map((v) => (
          <text key={v} x={X1 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[0, 1500, 3000].map((t, i) => (
          <text key={t} x={X1 + (i / 2) * PW} y={H - 10} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div style={{ color: "var(--accent)" }}>{`mean log Z after ${STEPS} steps: ${run.lseEnd.toFixed(2)}`}</div>
        <div style={{ color: "var(--text-muted)" }}>{`largest |logit|: ${run.maxEnd.toFixed(1)}; cross-entropy: ${run.ce.toFixed(3)}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A linear softmax classifier trained with Adam on four well-separated clusters. Without z-loss, the mean log Z
        (blue) climbs steadily: on separable data the cross-entropy keeps rewarding larger margins, and nothing fixes
        the common level of the logits. A z-loss weight of 10⁻⁴ lets log Z rise a little and then pulls it back towards
        zero; 10⁻² pins it at zero from the start, at the price of a higher cross-entropy here. The largest |logit|
        (grey), usually a strongly negative wrong-class logit, still grows: z-loss controls the level of the logits, not
        their spread.
      </figcaption>
    </figure>
  );
}
