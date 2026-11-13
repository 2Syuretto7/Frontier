"use client";

import { useState } from "react";

// Fixed point of x = T(x, θ) = 0.5 cos x + θ, iterated from x0 = 0.
const W = 320, H = 170, KMAX = 30;
function run(theta: number, K: number) {
  let x = 0, d = 0;
  const xs = [x], ds = [d];
  for (let k = 0; k < K; k++) {
    d = -0.5 * Math.sin(x) * d + 1; // forward-mode derivative of the unrolled iteration
    x = 0.5 * Math.cos(x) + theta;
    xs.push(x);
    ds.push(d);
  }
  return { xs, ds };
}
const qx = (k: number) => 30 + (k / KMAX) * (W - 40);

/** Differentiating a fixed-point iteration by unrolling it, against the implicit-function formula. */
export function UnrollVsImplicitViz() {
  const [theta, setTheta] = useState(1);
  const [K, setK] = useState(4);
  const { xs, ds } = run(theta, KMAX);
  // converged fixed point and implicit derivative
  const xstar = xs[KMAX];
  const implicit = 1 / (1 + 0.5 * Math.sin(xstar));
  const lo = 0, hi = 1.4;
  const qy = (v: number) => H - 20 - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (H - 30);
  const pts = ds.slice(0, K + 1).map((d, k) => `${qx(k).toFixed(1)},${qy(d).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Derivative estimate from unrolling against the number of iterations">
        <line x1={qx(0)} y1={H - 20} x2={qx(KMAX)} y2={H - 20} stroke="var(--border)" />
        <line x1={qx(0)} y1={qy(implicit)} x2={qx(KMAX)} y2={qy(implicit)} stroke="var(--accent)" strokeDasharray="6 4" strokeWidth={2} />
        <polyline points={pts} fill="none" stroke="var(--danger)" strokeWidth={2} />
        {ds.slice(0, K + 1).map((d, k) => <circle key={k} cx={qx(k)} cy={qy(d)} r={2.5} fill="var(--danger)" />)}
        <text x={qx(KMAX)} y={H - 6} textAnchor="end" className="viz-label">iterations K</text>
        <text x={qx(0)} y={12} className="viz-label">dx/dθ</text>
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono" style={{ minWidth: 70 }}>K = {K}</span>
        <input type="range" min={1} max={KMAX} step={1} value={K} onChange={(e) => setK(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono" style={{ minWidth: 70 }}>θ = {theta.toFixed(1)}</span>
        <input type="range" min={-1} max={2} step={0.1} value={theta} onChange={(e) => setTheta(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        x_K = {xs[K].toFixed(4)}, unrolled dx_K/dθ = {ds[K].toFixed(4)}, implicit dx*/dθ = {implicit.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The iteration x ← 0.5 cos x + θ converges to a fixed point x*(θ). <span style={{ color: "var(--danger)" }}>Unrolling</span>{" "}
        differentiates through all K steps and must store each of them for reverse mode; its estimate approaches the answer as K
        grows. The <span style={{ color: "var(--accent)" }}>implicit formula</span> 1/(1 + 0.5 sin x*) needs only the final x*,
        whatever solver found it.
      </figcaption>
    </figure>
  );
}
