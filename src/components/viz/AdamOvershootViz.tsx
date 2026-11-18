"use client";

import { useMemo, useState } from "react";

const B1 = 0.9, PRE = 2000, POST = 200;

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

/** The Adam ratio m/√v (no bias correction, ε = 0) for a coordinate whose gradient is silent or pure noise, then constant 1. */
export function overshootRun(b2: number, before: "silent" | "noise") {
  const g = gaussian(7);
  let m = 0, v = 0;
  const ratio: number[] = [];
  for (let t = 0; t < PRE + POST; t++) {
    const x = t < PRE ? (before === "noise" ? g() : 0) : 1;
    m = B1 * m + (1 - B1) * x;
    v = b2 * v + (1 - b2) * x * x;
    ratio.push(v > 0 ? m / Math.sqrt(v) : 0);
  }
  const pre = ratio.slice(PRE - 1000, PRE);
  const rms = Math.sqrt(pre.reduce((s, r) => s + r * r, 0) / pre.length);
  const post = ratio.slice(PRE);
  const peak = Math.max(...post);
  return { ratio, rms, peak, peakStep: post.indexOf(peak) + 1 };
}

export function AdamOvershootViz() {
  const [b2, setB2] = useState(0.999);
  const [before, setBefore] = useState<"silent" | "noise">("silent");
  const run = useMemo(() => overshootRun(b2, before), [b2, before]);
  const W = 320, H = 190, X1 = 30, PW = W - X1 - 8, PH = H - 34, SHOW = 50;
  const T0 = PRE - SHOW, SPAN = SHOW + POST, TOP = 7;
  const sx = (t: number) => X1 + ((t - T0) / SPAN) * PW;
  const sy = (r: number) => 8 + (1 - (Math.max(Math.min(r, TOP), -TOP) + TOP) / (2 * TOP)) * PH;
  const pts = run.ratio.slice(T0).map((r, i) => `${sx(T0 + i)},${sy(r)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">β₂</span>
        {[0.95, 0.99, 0.999].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={b2 === v} onClick={() => setB2(v)}>{v}</button>
        ))}
        <span className="viz-label">before the switch</span>
        {(["silent", "noise"] as const).map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={before === v} onClick={() => setBefore(v)}>{v === "silent" ? "zero gradient" : "pure noise"}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Adam's update ratio before and after the gradient switches to a constant">
        <line x1={X1} y1={sy(0)} x2={X1 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X1} y1={sy(-TOP)} x2={X1} y2={sy(TOP)} stroke="var(--border)" />
        <line x1={X1} y1={sy(1)} x2={X1 + PW} y2={sy(1)} stroke="var(--success)" strokeDasharray="4 3" />
        <line x1={sx(PRE)} y1={sy(-TOP)} x2={sx(PRE)} y2={sy(TOP)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={pts} />
        {[-6, -3, 0, 3, 6].map((v) => (
          <text key={v} x={X1 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        <text x={sx(PRE) + 3} y={H - 10} className="viz-label">switch</text>
        <text x={X1 + PW} y={H - 10} textAnchor="end" className="viz-label">{`+${POST} steps`}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${before === "noise" ? `RMS ratio before the switch ${run.rms.toFixed(2)}; ` : ""}peak ratio after the switch ${run.peak.toFixed(2)} at step ${run.peakStep}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The ratio m/√v sets the size of Adam&apos;s update in one coordinate, in units of η. For 2000 steps the gradient
        is zero or pure noise; then it becomes the constant 1, where the steady-state ratio is 1 (green). After a silent
        stretch, v starts near zero and grows slowly, so with β₂ = 0.999 the update overshoots to more than six times its
        steady size; with β₂ = 0.95 it barely overshoots. After noise, the update jumps from a noise-dominated size of
        about a quarter to 1, and now every step points the same way.
      </figcaption>
    </figure>
  );
}
