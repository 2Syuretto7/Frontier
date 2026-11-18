"use client";

import { useMemo, useState } from "react";

const D = 50, LR = 0.1, G = 1, T = 3000, EVERY = 10;

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

/** SGD on a scale-invariant loss: each gradient is orthogonal to w with norm G/‖w‖, plus weight decay wd. */
export function sphereRun(wd: number) {
  const g = gaussian(11);
  let w = new Array(D).fill(1 / Math.sqrt(D));
  const norms: number[] = [1], angles: number[] = [];
  for (let t = 1; t <= T; t++) {
    const z = Array.from({ length: D }, g);
    const ww = w.reduce((s, q) => s + q * q, 0);
    const zw = z.reduce((s, q, i) => s + q * w[i], 0);
    const zp = z.map((q, i) => q - (zw / ww) * w[i]);
    const zn = Math.sqrt(zp.reduce((s, q) => s + q * q, 0));
    const scale = G / Math.sqrt(ww) / zn;
    const next = w.map((q, i) => (1 - LR * wd) * q - LR * scale * zp[i]);
    const nn = Math.sqrt(next.reduce((s, q) => s + q * q, 0));
    const cos = next.reduce((s, q, i) => s + q * w[i], 0) / (nn * Math.sqrt(ww));
    angles.push(Math.acos(Math.min(1, Math.max(-1, cos))));
    w = next;
    if (t % EVERY === 0) norms.push(nn);
  }
  const tail = angles.slice(T - 500);
  return { norms, angleEnd: tail.reduce((s, q) => s + q, 0) / tail.length, normEnd: norms[norms.length - 1] };
}

export function ScaleInvariantViz() {
  const [wd, setWd] = useState(0.01);
  const run = useMemo(() => sphereRun(wd), [wd]);
  const W = 320, H = 180, X1 = 30, PW = W - X1 - 8, PH = H - 34, TOP = 3;
  const sx = (i: number) => X1 + (i / (run.norms.length - 1)) * PW;
  const sy = (v: number) => 8 + (1 - Math.min(v, TOP) / TOP) * PH;
  const eq = wd > 0 ? ((LR * G * G) / (wd * (2 - LR * wd))) ** 0.25 : NaN;
  const deg = (r: number) => ((r * 180) / Math.PI).toFixed(2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">weight decay λ</span>
        {[0, 0.01, 0.1].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={wd === v} onClick={() => setWd(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Weight norm during SGD on a scale-invariant loss">
        <line x1={X1} y1={sy(0)} x2={X1 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X1} y1={sy(0)} x2={X1} y2={sy(TOP)} stroke="var(--border)" />
        {wd > 0 && <line x1={X1} y1={sy(eq)} x2={X1 + PW} y2={sy(eq)} stroke="var(--danger)" strokeDasharray="4 3" />}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={run.norms.map((v, i) => `${sx(i)},${sy(v)}`).join(" ")} />
        {[0, 1, 2, 3].map((v) => (
          <text key={v} x={X1 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[0, 1500, 3000].map((t, i) => (
          <text key={t} x={X1 + (i / 2) * PW} y={H - 10} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div>{`‖w‖ after ${T} steps ${run.normEnd.toFixed(3)}${wd > 0 ? `, predicted equilibrium ${eq.toFixed(3)}` : ""}`}</div>
        <div>{`mean angle per step over the last 500 steps ${deg(run.angleEnd)}°${wd > 0 ? `, predicted arccos(1 − ηλ) = ${deg(Math.acos(1 - LR * wd))}°` : ""}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Stochastic gradient descent with η = 0.1 on a loss that ignores the scale of w, in 50 dimensions: every gradient
        is orthogonal to w and has norm 1/‖w‖. Without weight decay the norm only grows, so the angle each step turns
        through shrinks and training slows down by itself. With weight decay the norm settles where growth and decay
        balance (red), and the angle per step settles at arccos(1 − ηλ), whatever the gradient scale.
      </figcaption>
    </figure>
  );
}
