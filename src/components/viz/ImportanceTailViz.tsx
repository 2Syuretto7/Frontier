"use client";

import { useState } from "react";

const T = 3;

export function erfc(x: number) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

export const Q = (x: number) => 0.5 * erfc(x / Math.SQRT2);

/** Relative standard error of one sample when estimating P(Z > 3) by sampling from N(mu, 1). */
export function relSe(mu: number) {
  const p = Q(T);
  const m2 = Math.exp(mu * mu) * Q(T + mu);
  return Math.sqrt(Math.max(0, m2 - p * p)) / p;
}

const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** Moving the proposal into the tail: the relative error per sample falls from 27 to about 1.8, then rises again. */
export function ImportanceTailViz() {
  const [m10, setM10] = useState(30);
  const mu = m10 / 10;
  const W = 330, H = 120, X0 = 15, PW = W - 30;
  const xs = (x: number) => X0 + ((x + 3) / 10) * PW;
  const ys = (d: number) => H - 10 - d * 230;
  const grid = Array.from({ length: 201 }, (_, i) => -3 + i * 0.05);
  const curve = Array.from({ length: 61 }, (_, i) => i / 10);
  const cy = (v: number) => 135 + 50 - (Math.log10(v) / 2) * 50;
  const n = Math.ceil(relSe(mu) ** 2 / 0.01);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          proposal mean {mu.toFixed(1)}
          <input type="range" min={0} max={60} value={m10} onChange={(e) => setM10(Number(e.target.value))} aria-label="proposal mean" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} 200`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Target and proposal densities, and the relative error per sample against the proposal mean">
        <polygon fill="var(--danger)" opacity={0.35} points={[`${xs(T)},${ys(0)}`, ...grid.filter((x) => x >= T).map((x) => `${xs(x)},${ys(phi(x))}`), `${xs(7)},${ys(0)}`].join(" ")} />
        <polyline fill="none" stroke="var(--text)" points={grid.map((x) => `${xs(x)},${ys(phi(x))}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((x) => `${xs(x)},${ys(phi(x - mu))}`).join(" ")} />
        <line x1={xs(T)} y1={ys(0)} x2={xs(T)} y2={ys(0.42)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={xs(T) + 3} y={ys(0.38)} className="viz-label">3</text>
        <line x1={X0} y1={H - 10} x2={X0 + PW} y2={H - 10} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" points={curve.map((m) => `${X0 + (m / 6) * PW},${cy(relSe(m))}`).join(" ")} />
        <circle cx={X0 + (mu / 6) * PW} cy={cy(relSe(mu))} r={4} fill="var(--danger)" />
        <text x={X0} y={196} className="viz-label">relative error per sample (log scale), proposal mean 0 to 6</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        relative error per sample {relSe(mu).toFixed(2)}; samples for 10%: {n.toLocaleString("en-IN")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The black curve is the target N(0, 1), with the tail beyond 3 (probability 0.00135) shaded; the coloured curve is
        the proposal N(μ, 1). With μ = 0 almost no samples land in the tail, so the relative error per sample is about 27.
        Moving the proposal to the tail and reweighting cuts it to about 1.83 near μ = 3.15, a 220-fold saving in samples.
        Overshooting makes the weights of the few samples near 3 large, and the error climbs again.
      </figcaption>
    </figure>
  );
}
