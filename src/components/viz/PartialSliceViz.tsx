"use client";

import { useState } from "react";

const FUNCS: { label: string; f: (x: number, y: number) => number; fx: (x: number, y: number) => number; fy: (x: number, y: number) => number }[] = [
  { label: "x²y + 3y²", f: (x, y) => x * x * y + 3 * y * y, fx: (x, y) => 2 * x * y, fy: (x, y) => x * x + 6 * y },
  { label: "sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y), fx: (x, y) => Math.cos(x) * Math.cos(y), fy: (x, y) => -Math.sin(x) * Math.sin(y) },
  { label: "x² − y²", f: (x, y) => x * x - y * y, fx: (x) => 2 * x, fy: (_, y) => -2 * y },
];
const W = 240, H = 160, LO = -2, HI = 2;

function Slice({ g, at, slope, name }: { g: (t: number) => number; at: number; slope: number; name: string }) {
  const ts = Array.from({ length: 101 }, (_, k) => LO + ((HI - LO) * k) / 100);
  const vs = ts.map(g);
  const lo = Math.min(...vs) - 0.5, hi = Math.max(...vs) + 0.5;
  const X = (t: number) => 20 + ((t - LO) / (HI - LO)) * (W - 30);
  const Y = (v: number) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 30);
  const v0 = g(at);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 300 }} role="img" aria-label={`Slice in the ${name} direction`}>
      <line x1={20} y1={H - 20} x2={W - 10} y2={H - 20} stroke="var(--border)" />
      <polyline points={ts.map((t, k) => `${X(t).toFixed(1)},${Y(vs[k]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeWidth={1.8} />
      <line x1={X(at - 0.8)} y1={Y(v0 - 0.8 * slope)} x2={X(at + 0.8)} y2={Y(v0 + 0.8 * slope)} stroke="var(--danger)" strokeWidth={2} />
      <circle cx={X(at)} cy={Y(v0)} r={4.5} fill="var(--accent)" />
      <text x={W / 2} y={H - 4} textAnchor="middle" className="viz-label">{name}</text>
    </svg>
  );
}

/** Freeze one variable and you have a function of the other; its slope is a partial derivative. */
export function PartialSliceViz() {
  const [fi, setFi] = useState(0);
  const [a, setA] = useState(1);
  const [b, setB] = useState(0.5);
  const F = FUNCS[fi];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {FUNCS.map((G, i) => (
          <button key={G.label} type="button" className="seg" aria-pressed={fi === i} onClick={() => setFi(i)}>f = {G.label}</button>
        ))}
      </div>
      {[["a", a, setA], ["b", b, setB]].map(([n, v, set]) => (
        <label key={n as string} className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono">{n as string} = {(v as number).toFixed(2)}</span>
          <input type="range" min={-1.5} max={1.5} step={0.05} value={v as number} onChange={(e) => (set as (x: number) => void)(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        <div style={{ flex: "1 1 220px", textAlign: "center" }}>
          <Slice g={(x) => F.f(x, b)} at={a} slope={F.fx(a, b)} name="x ↦ f(x, b)" />
          <div className="mono" style={{ fontSize: 13 }}>∂f/∂x(a, b) = {F.fx(a, b).toFixed(3)}</div>
        </div>
        <div style={{ flex: "1 1 220px", textAlign: "center" }}>
          <Slice g={(y) => F.f(a, y)} at={b} slope={F.fy(a, b)} name="y ↦ f(a, y)" />
          <div className="mono" style={{ fontSize: 13 }}>∂f/∂y(a, b) = {F.fy(a, b).toFixed(3)}</div>
        </div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each panel freezes one variable at the point (a, b) = ({a.toFixed(2)}, {b.toFixed(2)}) and plots f against the other.
        The red lines are tangent lines; their slopes are the two partial derivatives.
      </figcaption>
    </figure>
  );
}
