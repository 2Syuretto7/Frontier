"use client";

import { useState } from "react";

type V = [number, number];
const HS = [0.05, 0.1, 0.2, 0.4, 0.8];
const T = 4 * Math.PI;
const f = (x: V): V => [x[1], -x[0]];
const add = (x: V, y: V, h: number): V => [x[0] + h * y[0], x[1] + h * y[1]];

const STEPS: Record<string, (x: V, h: number) => V> = {
  Euler: (x, h) => add(x, f(x), h),
  Heun: (x, h) => { const k1 = f(x), k2 = f(add(x, k1, h)); return add(x, [k1[0] + k2[0], k1[1] + k2[1]], h / 2); },
  RK4: (x, h) => {
    const k1 = f(x), k2 = f(add(x, k1, h / 2)), k3 = f(add(x, k2, h / 2)), k4 = f(add(x, k3, h));
    return add(x, [k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0], k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]], h / 6);
  },
};
const COLOURS: Record<string, string> = { Euler: "var(--danger)", Heun: "var(--text-muted)", RK4: "var(--accent)" };

/** The harmonic oscillator x″ = −x integrated over two periods by Euler, Heun and RK4: Euler spirals outwards, RK4 stays on the circle. */
export function OdeSpiralViz() {
  const [hi, setHi] = useState(2);
  const h = HS[hi];
  const n = Math.round(T / h);
  const paths = Object.keys(STEPS).map((name) => {
    let x: V = [1, 0];
    const pts: V[] = [x];
    for (let i = 0; i < n; i++) { x = STEPS[name](x, T / n); pts.push(x); }
    return { name, pts, r: Math.hypot(x[0], x[1]) };
  });
  const W = 330, H = 230, R = 3.2;
  const PX = (x: number) => W / 2 + (Math.max(-R, Math.min(R, x)) / R) * 100;
  const PY = (y: number) => 112 - (Math.max(-R, Math.min(R, y)) / R) * 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="mono" style={{ fontSize: 13 }}>step h</span>
        {HS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={i === hi} onClick={() => setHi(i)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Numerical trajectories of the harmonic oscillator in the phase plane">
        <circle cx={PX(0)} cy={PY(0)} r={100 / R} fill="none" stroke="var(--border)" strokeDasharray="4 3" />
        <line x1={PX(-R)} x2={PX(R)} y1={PY(0)} y2={PY(0)} stroke="var(--border)" strokeWidth={0.5} />
        <line x1={PX(0)} x2={PX(0)} y1={PY(-R)} y2={PY(R)} stroke="var(--border)" strokeWidth={0.5} />
        {paths.map((p) => (
          <polyline key={p.name} fill="none" stroke={COLOURS[p.name]} strokeWidth={1.5} points={p.pts.map((x) => `${PX(x[0]).toFixed(1)},${PY(x[1]).toFixed(1)}`).join(" ")} />
        ))}
        {paths.map((p, i) => (
          <text key={p.name} x={8} y={H - 34 + 14 * i} className="viz-label" fill={COLOURS[p.name]}>{p.name}: radius {p.r.toFixed(4)}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {n} steps over two periods; function evaluations: Euler {n}, Heun {2 * n}, RK4 {4 * n}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The exact solution of x′ = y, y′ = −x goes round the dashed unit circle. Euler multiplies the radius by √(1 + h²)
        at every step, so it spirals outwards; Heun&apos;s factor is √(1 + h⁴/4), much closer to 1; RK4&apos;s is 1 − h⁶/144
        to leading order, which slowly shrinks the orbit only at large h. Even with four times as many function evaluations
        per step, RK4 is far more accurate for the same work.
      </figcaption>
    </figure>
  );
}
