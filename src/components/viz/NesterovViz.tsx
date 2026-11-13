"use client";

import { useMemo, useState } from "react";

const K = 500;
const NS = [50, 200, 1000];

function grad(x: Float64Array, g: Float64Array) {
  const n = x.length;
  for (let i = 0; i < n; i++) g[i] = 2 * x[i] - (i > 0 ? x[i - 1] : 0) - (i < n - 1 ? x[i + 1] : 0) - (i === 0 ? 1 : 0);
}

function val(x: Float64Array) {
  const n = x.length;
  let s = 0;
  for (let i = 0; i < n; i++) s += x[i] * (2 * x[i] - (i > 0 ? x[i - 1] : 0) - (i < n - 1 ? x[i + 1] : 0));
  return 0.5 * s - x[0];
}

function runs(n: number) {
  const fs = -0.5 * (n / (n + 1));
  const g = new Float64Array(n);
  const xg = new Float64Array(n);
  let x = new Float64Array(n), prev = new Float64Array(n);
  const y = new Float64Array(n);
  const gd: number[] = [val(xg) - fs], nv: number[] = [val(x) - fs];
  for (let k = 1; k <= K; k++) {
    grad(xg, g);
    for (let i = 0; i < n; i++) xg[i] -= g[i] / 4;
    gd.push(val(xg) - fs);
    const c = (k - 2) / (k + 1);
    for (let i = 0; i < n; i++) y[i] = x[i] + c * (x[i] - prev[i]);
    grad(y, g);
    const nx = new Float64Array(n);
    for (let i = 0; i < n; i++) nx[i] = y[i] - g[i] / 4;
    prev = x;
    x = nx;
    nv.push(val(x) - fs);
  }
  let r2 = 0;
  for (let i = 1; i <= n; i++) r2 += (1 - i / (n + 1)) ** 2;
  return { gd, nv, r2 };
}

/** Gradient descent and Nesterov's accelerated method on a hard smooth convex quadratic, on log-log axes: the gaps fall like 1/k and 1/k², each under its bound. */
export function NesterovViz() {
  const [j, setJ] = useState(1);
  const n = NS[j];
  const { gd, nv, r2 } = useMemo(() => runs(n), [n]);
  const W = 330, H = 190;
  const lx = (k: number) => Math.log10(k);
  const lo = -7, hi = 1;
  const X = (k: number) => 34 + (lx(k) / lx(K)) * (W - 46);
  const Y = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, Math.log10(Math.max(v, 1e-300))))) / (hi - lo)) * (H - 30);
  const ks = Array.from({ length: K }, (_, i) => i + 1);
  const line = (f: (k: number) => number) => ks.map((k) => `${X(k).toFixed(1)},${Y(f(k)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="mono" style={{ fontSize: 13 }}>dimension</span>
        {NS.map((m, i) => (
          <button key={m} type="button" className="seg" aria-pressed={j === i} onClick={() => setJ(i)}>{m}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Optimality gap against iteration on log-log axes for gradient descent and Nesterov's method">
        {[0, -2, -4, -6].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 12} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke="var(--border)" opacity={0.6} />
            <text x={30} y={Y(10 ** e) + 3} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.1} strokeDasharray="5 3" points={line((k) => (4 * r2) / (2 * k))} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.1} strokeDasharray="5 3" points={line((k) => (8 * r2) / (k + 1) ** 2)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={line((k) => gd[k])} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={line((k) => nv[k])} />
        <text x={X(1)} y={H - 4} className="viz-label">k = 1</text>
        <text x={X(K)} y={H - 4} textAnchor="end" className="viz-label">k = {K}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        gap after {K} steps: gradient descent {gd[K].toExponential(2)}; Nesterov {nv[K].toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The function is ½xᵀAx − x₁ with A tridiagonal (2 on the diagonal, −1 beside it), which is 4-smooth and convex with
        tiny curvature in some directions. Both axes are logarithmic, so a power law is a straight line. Gradient descent
        with step 1/4 sits under its grey dashed bound 2‖x₀ − x*‖²/k; Nesterov&apos;s method, the accent curve, falls about
        twice as steeply under its red dashed bound 8‖x₀ − x*‖²/(k + 1)², and is not monotone. In dimension 50 the smallest
        curvature is large enough that Nesterov soon turns geometric.
      </figcaption>
    </figure>
  );
}
