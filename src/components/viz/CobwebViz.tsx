"use client";

import { useState } from "react";

type Map = "sqrt" | "babylon" | "cos";
const F: Record<Map, (x: number) => number> = {
  sqrt: (x) => Math.sqrt(2 + Math.max(-2, x)),
  babylon: (x) => (x + 2 / x) / 2,
  cos: (x) => Math.cos(x),
};
const LABEL: Record<Map, string> = { sqrt: "√(2 + x)", babylon: "(x + 2/x)/2", cos: "cos x" };
const RANGE: Record<Map, [number, number]> = { sqrt: [0, 3], babylon: [0.5, 3.5], cos: [0, 1.6] };

/** Cobweb diagram of xₙ₊₁ = f(xₙ): monotone and bounded iterates climb or descend a staircase to the fixed point. */
export function CobwebViz() {
  const [map, setMap] = useState<Map>("sqrt");
  const [s, setS] = useState(0);
  const [lo, hi] = RANGE[map];
  const x0 = lo + 0.05 + (s / 40) * (hi - lo - 0.1);
  const xs = [x0];
  for (let i = 0; i < 12; i++) xs.push(F[map](xs[i]));
  const W = 260;
  const P = (v: number) => 20 + ((v - lo) / (hi - lo)) * (W - 30);
  const Q = (v: number) => W - 20 - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (W - 30);
  const curve: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const v = lo + ((hi - lo) * i) / 100;
    curve.push(`${P(v).toFixed(1)},${Q(F[map](v)).toFixed(1)}`);
  }
  const web: string[] = [`${P(xs[0]).toFixed(1)},${Q(lo).toFixed(1)}`];
  for (let i = 0; i < 12; i++) {
    web.push(`${P(xs[i]).toFixed(1)},${Q(xs[i + 1]).toFixed(1)}`);
    web.push(`${P(xs[i + 1]).toFixed(1)},${Q(xs[i + 1]).toFixed(1)}`);
  }
  const diffs = xs.slice(1).map((v, i) => v - xs[i]);
  const mono = diffs.every((d) => d >= -1e-12) ? "increasing" : diffs.every((d) => d <= 1e-12) ? "decreasing" : diffs.slice(1).every((d) => d <= 1e-12) || diffs.slice(1).every((d) => d >= -1e-12) ? "monotone after the first step" : "alternating";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(F) as Map[]).map((m) => (
          <button key={m} type="button" className="seg" aria-pressed={map === m} onClick={() => { setMap(m); setS(0); }}>{LABEL[m]}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          x₀ = {x0.toFixed(2)}
          <input type="range" min={0} max={40} value={s} onChange={(e) => setS(Number(e.target.value))} aria-label="starting value" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Cobweb diagram of the iteration">
        <line x1={P(lo)} y1={Q(lo)} x2={P(hi)} y2={Q(hi)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={curve.join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.3} points={web.join(" ")} />
        <circle cx={P(x0)} cy={Q(lo)} r={3} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        x₁₂ = {xs[12].toFixed(6)}; iterates are {mono}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is y = f(x) and the diagonal is y = x. From xₙ go up to the curve to read xₙ₊₁, then across to the diagonal
        to use it as the next input. For √(2 + x) the staircase is monotone and bounded by 2, so it converges, and the limit
        must solve L = √(2 + L). Newton&apos;s map for √2 overshoots once and then decreases. cos x spirals: not monotone, yet
        convergent, which needs a different argument.
      </figcaption>
    </figure>
  );
}
