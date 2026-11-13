"use client";

import { useState } from "react";

const N = 100;
const lchoose = (n: number, k: number) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; };
const PMF = Array.from({ length: N + 1 }, (_, k) => Math.exp(lchoose(N, k) - N * Math.LN2));

/** For X ~ Binomial(100, 1/2): the family of bounds P(X ≥ a) ≤ e^(−ta) M(t), its best member, and the exact tail. */
export function ChernoffViz() {
  const [a, setA] = useState(65);
  const bound = (t: number) => -t * a + N * Math.log((1 + Math.exp(t)) / 2); // natural log of e^{-ta} M(t)
  const ts = Array.from({ length: 151 }, (_, i) => (i * 1.5) / 150);
  let best = 0, tBest = 0;
  ts.forEach((t) => { const v = bound(t); if (v < best) { best = v; tBest = t; } });
  const exact = PMF.slice(a).reduce((s, v) => s + v, 0);
  const W = 320, H = 170, lo = -12, hi = 1;
  const X = (t: number) => 34 + (t / 1.5) * (W - 44);
  const Y = (l10: number) => 10 + ((hi - Math.max(lo, Math.min(hi, l10))) / (hi - lo)) * (H - 34);
  const pts = ts.map((t) => `${X(t).toFixed(1)},${Y(bound(t) / Math.LN10).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          a = {a}
          <input type="range" min={51} max={95} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="threshold" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Chernoff bounds as a function of t on a log scale, with the exact tail">
        {[0, -4, -8, -12].map((l) => (
          <g key={l}>
            <line x1={34} x2={W - 10} y1={Y(l)} y2={Y(l)} stroke="var(--border)" />
            <text x={30} y={Y(l) + 4} textAnchor="end" className="viz-label">1e{l}</text>
          </g>
        ))}
        {[0, 0.5, 1, 1.5].map((t) => <text key={t} x={X(t)} y={H - 6} textAnchor="middle" className="viz-label">t={t}</text>)}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts} />
        <line x1={34} x2={W - 10} y1={Y(Math.log10(exact))} y2={Y(Math.log10(exact))} stroke="var(--danger)" strokeDasharray="4 3" />
        <circle cx={X(tBest)} cy={Y(best / Math.LN10)} r={4} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        exact P(X ≥ {a}) = {exact.toExponential(2)}; best bound {Math.exp(best).toExponential(2)} at t = {tBest.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        X ~ Binomial(100, 1/2). For every t &gt; 0, Markov&apos;s inequality applied to e^(tX) gives P(X ≥ a) ≤ e^(−ta)E[e^(tX)],
        the blue curve on a log scale. Choosing the best t gives the Chernoff bound. It sits above the exact tail (red dashes)
        but has the right exponential rate: both fall off exponentially in the distance from the mean.
      </figcaption>
    </figure>
  );
}
