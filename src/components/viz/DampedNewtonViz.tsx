"use client";

import { useState } from "react";

const FNS = [
  { label: "√(1 + x²)", f: (x: number) => Math.sqrt(1 + x * x), d: (x: number) => x / Math.sqrt(1 + x * x), dd: (x: number) => (1 + x * x) ** -1.5 },
  { label: "log cosh x", f: (x: number) => Math.log(Math.cosh(x)), d: Math.tanh, dd: (x: number) => 1 / Math.cosh(x) ** 2 },
  { label: "eˣ − 2x + x²/4", f: (x: number) => Math.exp(x) - 2 * x + x * x / 4, d: (x: number) => Math.exp(x) - 2 + x / 2, dd: (x: number) => Math.exp(x) + 0.5 },
];

/** Newton's method for minimisation in one variable: each step jumps to the minimum of the local quadratic model. Pure steps can diverge far from the minimum; backtracking keeps them safe until the fast local phase takes over. */
export function DampedNewtonViz() {
  const [k, setK] = useState(0);
  const [x0, setX0] = useState(1.5);
  const [damped, setDamped] = useState(false);
  const { f, d, dd, label } = FNS[k];
  const its: number[] = [x0];
  const ts: number[] = [];
  for (let i = 0; i < 8; i++) {
    const x = its[its.length - 1];
    if (!Number.isFinite(x) || Math.abs(x) > 1e6) break;
    const dx = -d(x) / dd(x);
    let t = 1;
    if (damped) { while (t > 1e-6 && f(x + t * dx) > f(x) + 0.25 * t * d(x) * dx) t *= 0.5; }
    ts.push(t);
    its.push(x + t * dx);
  }
  const lo = -4, hi = 4;
  const xs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const ys = xs.map(f);
  const ymin = Math.min(...ys) - 0.3, ymax = Math.min(Math.max(...ys), 8) + 0.3;
  const W = 300, H = 190;
  const X = (x: number) => 14 + ((x - lo) / (hi - lo)) * (W - 28);
  const Y = (y: number) => H - 14 - ((y - ymin) / (ymax - ymin)) * (H - 24);
  const model = (y: number) => f(x0) + d(x0) * (y - x0) + 0.5 * dd(x0) * (y - x0) ** 2;
  const fmt = (v: number) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(1) : v.toFixed(4));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FNS.map((g, i) => (
          <button key={g.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{g.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x₀ = {x0.toFixed(1)}
          <input type="range" min={-3} max={3} step={0.1} value={x0} onChange={(e) => setX0(Number(e.target.value))} aria-label="starting point" style={{ width: 100 }} />
        </label>
        <button type="button" className="seg" aria-pressed={damped} onClick={() => setDamped(!damped)}>backtracking</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A function, its quadratic model at the starting point, and Newton iterates">
        <defs>
          <clipPath id="dn-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#dn-clip)">
          <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.2} strokeDasharray="5 3" points={xs.map((x) => `${X(x).toFixed(1)},${Y(model(x)).toFixed(1)}`).join(" ")} />
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(" ")} />
          {its.slice(0, -1).map((x, i) => (Math.abs(x) <= 4 && Math.abs(its[i + 1]) <= 4 ? <line key={i} x1={X(x)} y1={Y(f(x))} x2={X(its[i + 1])} y2={Y(f(its[i + 1]))} stroke="var(--danger)" strokeWidth={1} opacity={0.7} /> : null))}
          {its.map((x, i) => (Math.abs(x) <= 4 ? <circle key={i} cx={X(x)} cy={Y(f(x))} r={i === 0 ? 3.5 : 2.5} fill={i === 0 ? "var(--text)" : "var(--danger)"} /> : null))}
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowWrap: "anywhere" }}>
        {label}: x = {its.slice(0, 6).map(fmt).join(", ")}{damped ? `; steps t = ${ts.slice(0, 5).join(", ")}` : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed parabola is the second-order model f(x₀) + f′(x₀)(y − x₀) + ½f″(x₀)(y − x₀)², and a Newton step jumps to its
        minimum, x − f′(x)/f″(x). Near the minimum the model is excellent and the error roughly squares at each step. Far
        away it can be badly wrong: for √(1 + x²) the step maps x to −x³, so any start beyond 1 diverges, and log cosh x
        diverges beyond about 1.09. Backtracking shortens the step until f decreases enough, and once close it accepts the
        full step.
      </figcaption>
    </figure>
  );
}
