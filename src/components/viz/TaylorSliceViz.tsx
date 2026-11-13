"use client";

import { useState } from "react";

// f(x, y) = sin(x)·e^y around a = (0.5, 0.2)
const A: [number, number] = [0.5, 0.2];
const f = (x: number, y: number) => Math.sin(x) * Math.exp(y);
const F0 = f(...A);
const G = [Math.cos(A[0]) * Math.exp(A[1]), Math.sin(A[0]) * Math.exp(A[1])];
const H = [
  [-Math.sin(A[0]) * Math.exp(A[1]), Math.cos(A[0]) * Math.exp(A[1])],
  [Math.cos(A[0]) * Math.exp(A[1]), Math.sin(A[0]) * Math.exp(A[1])],
];
const W = 320, Hh = 200, T = 2;
const tx = (t: number) => 30 + ((t + T) / (2 * T)) * (W - 40);
const vy = (v: number) => Hh / 2 - v * 32;

/** A function of two variables along a line through a, against its first- and second-order Taylor polynomials. */
export function TaylorSliceViz() {
  const [deg, setDeg] = useState(40);
  const [order, setOrder] = useState<1 | 2>(2);
  const th = (deg * Math.PI) / 180;
  const u = [Math.cos(th), Math.sin(th)];
  const slope = G[0] * u[0] + G[1] * u[1];
  const curv = u[0] * (H[0][0] * u[0] + H[0][1] * u[1]) + u[1] * (H[1][0] * u[0] + H[1][1] * u[1]);
  const g = (t: number) => f(A[0] + t * u[0], A[1] + t * u[1]);
  const p = (t: number) => F0 + slope * t + (order === 2 ? 0.5 * curv * t * t : 0);
  const pts = (fn: (t: number) => number) => {
    const out: string[] = [];
    for (let k = 0; k <= 80; k++) {
      const t = -T + (2 * T * k) / 80;
      const v = Math.max(-3, Math.min(3, fn(t)));
      out.push(`${tx(t).toFixed(1)},${vy(v).toFixed(1)}`);
    }
    return out.join(" ");
  };
  const errAt = (t: number) => Math.abs(g(t) - p(t));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="seg" aria-pressed={order === 1} onClick={() => setOrder(1)}>first order</button>
        <button type="button" className="seg" aria-pressed={order === 2} onClick={() => setOrder(2)}>second order</button>
      </div>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "8px auto" }} role="img" aria-label="The function along a line and its Taylor polynomial">
        <line x1={tx(-T)} y1={vy(0)} x2={tx(T)} y2={vy(0)} stroke="var(--border)" />
        <line x1={tx(0)} y1={6} x2={tx(0)} y2={Hh - 6} stroke="var(--border)" strokeDasharray="3 3" />
        <polyline points={pts(g)} fill="none" stroke="var(--text)" strokeWidth={2} />
        <polyline points={pts(p)} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" />
        <circle cx={tx(0)} cy={vy(F0)} r={4} fill="var(--accent)" />
        <text x={tx(T) - 2} y={vy(0) - 6} textAnchor="end" className="viz-label">t</text>
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">direction {deg}°</span>
        <input type="range" min={0} max={180} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        ∇f·u = {slope.toFixed(3)}, uᵀHu = {curv.toFixed(3)}; error at t = 0.5: {errAt(0.5).toExponential(1)}, at t = 0.25: {errAt(0.25).toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is f(a + tu) for f(x, y) = sin x · e^y, a = (0.5, 0.2) and the unit direction u; the dashed curve is
        its Taylor polynomial of {order === 1 ? "first order, f(a) + t ∇f·u" : "second order, f(a) + t ∇f·u + ½t² uᵀHu"}. Halving
        t divides the error by about {order === 1 ? "4 (it is of order t²)" : "8 (it is of order t³)"}. Every direction uses the
        same gradient and Hessian.
      </figcaption>
    </figure>
  );
}
