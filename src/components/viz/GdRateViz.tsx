"use client";

import { useState } from "react";

/** Gradient descent on (μx² + Ly²)/2 as a fixed-point iteration: its contraction factor max(|1 − ημ|, |1 − ηL|) against the step size, and the resulting path. */
export function GdRateViz() {
  const [Lk, setLk] = useState(8);
  const [ek, setEk] = useState(14);
  const mu = 1, L = Lk;
  const etaMax = 2.4 / L;
  const eta = (ek / 30) * etaMax;
  const q = (e: number) => Math.max(Math.abs(1 - e * mu), Math.abs(1 - e * L));
  const best = 2 / (L + mu);
  const W = 330, H1 = 120, H2 = 150;
  const Xe = (e: number) => 30 + (e / etaMax) * (W - 46);
  const Yq = (v: number) => H1 - 16 - (Math.min(v, 1.6) / 1.6) * (H1 - 26);
  const es = Array.from({ length: 241 }, (_, i) => (etaMax * i) / 240);
  const path: [number, number][] = [[-2.6, 1.0]];
  for (let i = 0; i < 25; i++) { const [x, y] = path[path.length - 1]; path.push([x - eta * mu * x, y - eta * L * y]); }
  const R = 3;
  const Xp = (x: number) => W / 2 + (x / R) * (W / 2 - 10);
  const Yp = (y: number) => H1 + H2 / 2 - (y / ((R * H2) / W)) * (H2 / 2 - 6);
  const YR = (R * H2) / W;
  const cx = (v: number) => Math.max(-R, Math.min(R, v));
  const cy = (v: number) => Math.max(-YR, Math.min(YR, v));
  const inside = (x: number, y: number) => Math.abs(x) <= R && Math.abs(y) <= YR;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          κ = L/μ = {L}
          <input type="range" min={2} max={20} value={Lk} onChange={(e) => setLk(Number(e.target.value))} aria-label="condition number" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          η = {eta.toFixed(3)}
          <input type="range" min={1} max={30} value={ek} onChange={(e) => setEk(Number(e.target.value))} aria-label="step size" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H1 + H2}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Contraction factor against step size, and the gradient descent path on the quadratic">
        <line x1={30} x2={W - 16} y1={Yq(1)} y2={Yq(1)} stroke="var(--danger)" strokeDasharray="3 3" />
        <line x1={30} x2={W - 16} y1={Yq(0)} y2={Yq(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={es.map((e) => `${Xe(e).toFixed(1)},${Yq(q(e)).toFixed(1)}`).join(" ")} />
        <line x1={Xe(best)} x2={Xe(best)} y1={Yq(0)} y2={Yq(q(best))} stroke="var(--text-muted)" strokeDasharray="2 2" />
        <circle cx={Xe(eta)} cy={Yq(q(eta))} r={4} fill="var(--accent)" />
        <text x={32} y={12} className="viz-label">q(η)</text>
        <text x={W - 16} y={Yq(1) - 4} textAnchor="end" className="viz-label">q = 1</text>
        {[0.5, 1.5, 3, 5].filter((c) => Math.sqrt((2 * c) / mu) <= R && Math.sqrt((2 * c) / L) <= YR).map((c, i) => (
          <ellipse key={i} cx={Xp(0)} cy={Yp(0)} rx={(Math.sqrt((2 * c) / mu) / R) * (W / 2 - 10)} ry={(Math.sqrt((2 * c) / L) / YR) * (H2 / 2 - 6)} fill="none" stroke="var(--border)" />
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.4} points={path.map(([x, y]) => `${Xp(cx(x)).toFixed(1)},${Yp(cy(y)).toFixed(1)}`).join(" ")} />
        {path.map(([x, y], i) => inside(x, y) ? <circle key={i} cx={Xp(x)} cy={Yp(y)} r={2} fill="var(--accent)" /> : null)}
        <circle cx={Xp(0)} cy={Yp(0)} r={3.5} fill="none" stroke="var(--danger)" strokeWidth={1.6} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        q(η) = {q(eta).toFixed(3)}; best η = 2/(L + μ) = {best.toFixed(3)} with q = (κ − 1)/(κ + 1) = {q(best).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The upper panel plots the contraction factor of the gradient step; the dot is the current η and the dotted line the
        best one. Below, 25 steps on the elliptical contours. With q &lt; 1 the iterates converge to the minimiser at rate qⁿ,
        zig-zagging across the narrow direction when η is large; with q ≥ 1 they diverge. A larger κ pushes the best q
        towards 1.
      </figcaption>
    </figure>
  );
}
