"use client";

import { useState } from "react";

const FNS = [
  { label: "eˣ", f: Math.exp, d: Math.exp, dd: Math.exp },
  { label: "x⁴ − 2x²", f: (x: number) => x ** 4 - 2 * x * x, d: (x: number) => 4 * x ** 3 - 4 * x, dd: (x: number) => 12 * x * x - 4 },
  { label: "log(1 + eˣ)", f: (x: number) => Math.log1p(Math.exp(x)), d: (x: number) => 1 / (1 + Math.exp(-x)), dd: (x: number) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); } },
  { label: "sin x", f: Math.sin, d: Math.cos, dd: (x: number) => -Math.sin(x) },
];

/** A tangent line of a one-variable function: for a convex function it lies below the graph everywhere, and f″ ≥ 0 at every point. */
export function TangentBelowViz() {
  const [k, setK] = useState(1);
  const [x0, setX0] = useState(0.2);
  const { f, d, dd, label } = FNS[k];
  const lo = -1.8, hi = 1.8;
  const xs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const ys = xs.map(f);
  const ymin = Math.min(...ys) - 0.4, ymax = Math.max(...ys) + 0.4;
  const W = 300, H = 200;
  const X = (x: number) => 14 + ((x - lo) / (hi - lo)) * (W - 28);
  const Y = (y: number) => H - 14 - ((y - ymin) / (ymax - ymin)) * (H - 24);
  const tan = (x: number) => f(x0) + d(x0) * (x - x0);
  const above = xs.filter((x) => tan(x) > f(x) + 1e-9);
  const minCurv = Math.min(...xs.map(dd));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FNS.map((g, i) => (
          <button key={g.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{g.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x₀ = {x0.toFixed(1)}
          <input type="range" min={-1.6} max={1.6} step={0.1} value={x0} onChange={(e) => setX0(Number(e.target.value))} aria-label="tangent point" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Graph of a function with a tangent line">
        <defs>
          <clipPath id="tb-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#tb-clip)">
          {above.map((x, i) => (
            <line key={i} x1={X(x)} x2={X(x)} y1={Y(f(x))} y2={Y(tan(x))} stroke="var(--danger)" opacity={0.35} />
          ))}
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(" ")} />
          <line x1={X(lo)} y1={Y(tan(lo))} x2={X(hi)} y2={Y(tan(hi))} stroke="var(--text)" strokeWidth={1.3} strokeDasharray="5 3" />
        </g>
        <circle cx={X(x0)} cy={Y(f(x0))} r={3.5} fill="var(--text)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {label}: f″(x₀) = {(dd(x0) + 0).toFixed(3)}; smallest f″ on the plot = {(minCurv + 0).toFixed(3)}; tangent {above.length ? "rises above the graph (red)" : "stays below the graph"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed line is the tangent at x₀, f(x₀) + f′(x₀)(x − x₀). A differentiable function is convex exactly when
        every tangent lies on or below the graph, so the first-order Taylor approximation is a global under-estimate. For
        twice differentiable functions this is the same as f″ ≥ 0 everywhere. Try x⁴ − 2x² near 0, where f″ is negative and
        the tangent cuts above the graph; the logistic loss log(1 + eˣ) is convex with f″ = σ(1 − σ) &gt; 0.
      </figcaption>
    </figure>
  );
}
