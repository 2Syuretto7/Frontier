"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const PS = [0.1, 0.5, 0.9];
const F0 = 10, F1 = 11, BMAX = 12;
type Mode = "none" | "mean" | "optimal";

/** Variance of the one-sample score-function estimate (f(x) − b)(x − p) of d/dθ E f(X), X ~ Bernoulli(σ(θ)). */
export function scoreVar(p: number, b: number) {
  const g = p * (1 - p) * (F1 - F0);
  return p * (1 - p) * ((1 - p) * (F1 - b) ** 2 + p * (F0 - b) ** 2) - g * g;
}

export const baselineFor = (p: number, mode: Mode) => (mode === "none" ? 0 : mode === "mean" ? p * F1 + (1 - p) * F0 : (1 - p) * F1 + p * F0);

/** Mean and standard deviation of n simulated one-sample estimates. */
export function simulate(p: number, b: number, n: number, seed: number) {
  const rng = makeRng(seed);
  let s = 0, s2 = 0;
  for (let i = 0; i < n; i++) {
    const x = rng() < p ? 1 : 0, e = ((x ? F1 : F0) - b) * (x - p);
    s += e; s2 += e * e;
  }
  const m = s / n;
  return { m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)) };
}

export function ScoreBaselineViz() {
  const [p, setP] = useState(0.5);
  const [mode, setMode] = useState<Mode>("none");
  const [sim, setSim] = useState<{ m: number; sd: number } | null>(null);
  const b = baselineFor(p, mode);
  useEffect(() => setSim(simulate(p, b, 2000, 5)), [p, b]);
  const W = 330, H = 150, X0 = 30, PW = W - 40, PH = 120;
  const vmax = Math.max(...PS.map((q) => scoreVar(q, 0)));
  const sx = (v: number) => X0 + (v / BMAX) * PW, sy = (v: number) => 10 + (1 - v / vmax) * PH;
  const grid = Array.from({ length: 121 }, (_, i) => (BMAX * i) / 120);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PS.map((q) => (
          <button key={q} type="button" className="seg" aria-pressed={q === p} onClick={() => setP(q)}>p = {q}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        {(["none", "mean", "optimal"] as Mode[]).map((m) => (
          <button key={m} type="button" className="seg" aria-pressed={m === mode} onClick={() => setMode(m)}>
            {m === "none" ? "no baseline" : m === "mean" ? "b = E f" : "optimal b"}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Variance of the score-function estimator against the baseline">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((v) => `${sx(v)},${sy(scoreVar(p, v))}`).join(" ")} />
        <circle cx={sx(b)} cy={sy(scoreVar(p, b))} r={4.5} fill="var(--danger)" />
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={sx(0)} y={H + 12} textAnchor="middle" className="viz-label">b = 0</text>
        <text x={sx(10)} y={H + 12} textAnchor="middle" className="viz-label">10</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`b = ${b.toFixed(2)}: exact gradient ${(p * (1 - p)).toFixed(3)}, variance ${Math.max(0, scoreVar(p, b)).toFixed(3)}`}
        {sim ? `; 2000 draws give mean ${sim.m.toFixed(3)}, sd ${sim.sd.toFixed(3)}` : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The score-function estimate (f(x) − b)(x − p) of the gradient of E f(X) for X ~ Bernoulli(p), with f(0) = 10 and
        f(1) = 11. Every baseline b gives the same mean, but the variance is a parabola in b. With no baseline the large
        constant part of f swamps the signal. Subtracting E f helps a great deal; the optimal baseline, (1 − p)f(1) + p f(0),
        here removes the variance entirely.
      </figcaption>
    </figure>
  );
}
