"use client";

import { useState } from "react";

const npdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) * ((x - m) / s)) / (s * Math.sqrt(2 * Math.PI));
const GX = Array.from({ length: 241 }, (_, i) => -6 + (12 * i) / 240);

/** A two-component Gaussian mixture: the weighted components, their sum, and the posterior probability that a point came from the first component. */
export function MixtureViz() {
  const [pi, setPi] = useState(30);
  const [sep, setSep] = useState(40);
  const [sd, setSd] = useState(10);
  const p = pi / 100, d = sep / 10, s = sd / 10;
  const m0 = -d / 2, m1 = d / 2;
  const c0 = GX.map((x) => p * npdf(x, m0, s)), c1 = GX.map((x) => (1 - p) * npdf(x, m1, s));
  const mix = GX.map((_, i) => c0[i] + c1[i]);
  const resp = GX.map((_, i) => c0[i] / (mix[i] || 1e-300));
  const W = 330, H = 150, H2 = 80;
  const X = (x: number) => 12 + ((x + 6) / 12) * (W - 24);
  const ymax = Math.max(...mix) * 1.1;
  const Y = (v: number) => H - 14 - (v / ymax) * (H - 22);
  const RY = (v: number) => H2 - 14 - v * (H2 - 24);
  const line = (f: number[], Yf: (v: number) => number) => GX.map((x, i) => `${X(x).toFixed(1)},${Yf(f[i]).toFixed(1)}`).join(" ");
  const cross = GX.findIndex((_, i) => i > 0 && (resp[i - 1] - 0.5) * (resp[i] - 0.5) <= 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          π₁ = {p.toFixed(2)}
          <input type="range" min={5} max={95} value={pi} onChange={(e) => setPi(Number(e.target.value))} aria-label="weight of the first component" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          gap = {d.toFixed(1)}
          <input type="range" min={0} max={80} value={sep} onChange={(e) => setSep(Number(e.target.value))} aria-label="distance between the means" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          σ = {s.toFixed(1)}
          <input type="range" min={3} max={25} value={sd} onChange={(e) => setSd(Number(e.target.value))} aria-label="component standard deviation" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Mixture density and its weighted components">
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.2} strokeDasharray="4 3" points={line(c0, Y)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="4 3" points={line(c1, Y)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={line(mix, Y)} />
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Responsibility of the first component">
        <line x1={12} x2={W - 12} y1={RY(0.5)} y2={RY(0.5)} stroke="var(--border)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={line(resp, RY)} />
        <text x={14} y={10} className="viz-label">P(z = 1 | x)</text>
        <line x1={12} x2={W - 12} y1={RY(0)} y2={RY(0)} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        responsibility crosses ½ at x ≈ {cross > 0 ? GX[cross].toFixed(2) : "nowhere"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curves are the two components, each scaled by its weight; the solid curve is their sum, the mixture
        density. The lower plot is the responsibility of the first component, the posterior probability that a point at x
        came from it. With equal variances it is a logistic curve in x, and its midpoint moves away from the lighter
        component as the weights become unequal. When the gap is small relative to σ the mixture has one hump, and the data
        alone say little about which component produced which point.
      </figcaption>
    </figure>
  );
}
