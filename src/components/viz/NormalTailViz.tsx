"use client";

import { useState } from "react";

const phi = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
// upper tail by Simpson's rule on [t, t + 12]
function upper(t: number) {
  const n = 600, h = 12 / n;
  let s = phi(t) + phi(t + 12);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * phi(t + i * h);
  return (s * h) / 3;
}

/** Two-sided normal tail P(|Z| > t) against Chebyshev's 1/t² and the Mills-ratio bound 2φ(t)/t. */
export function NormalTailViz() {
  const [k, setK] = useState(20);
  const t = k / 10;
  const W = 320, H = 150;
  const X = (x: number) => 20 + ((x + 4) / 8) * (W - 40);
  const Y = (y: number) => H - 22 - (y / 0.42) * (H - 34);
  const curve = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05).map((x) => `${X(x).toFixed(1)},${Y(phi(x)).toFixed(1)}`);
  const shade = (a: number, b: number) => {
    const pts = [`${X(a).toFixed(1)},${Y(0).toFixed(1)}`];
    for (let i = 0; i <= 40; i++) { const x = a + ((b - a) * i) / 40; pts.push(`${X(x).toFixed(1)},${Y(phi(x)).toFixed(1)}`); }
    pts.push(`${X(b).toFixed(1)},${Y(0).toFixed(1)}`);
    return pts.join(" ");
  };
  const exact = 2 * upper(t);
  const cheb = Math.min(1, 1 / (t * t));
  const mills = Math.min(1, (2 * phi(t)) / t);
  const fmt = (v: number) => (v < 1e-3 ? v.toExponential(2) : v.toFixed(4));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          t = {t.toFixed(1)}
          <input type="range" min={5} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of standard deviations" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Standard normal density with both tails beyond t shaded">
        <line x1={20} x2={W - 20} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polygon points={shade(t, 4)} fill="var(--danger)" opacity={0.5} />
        <polygon points={shade(-4, -t)} fill="var(--danger)" opacity={0.5} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve.join(" ")} />
        {[-3, -2, -1, 0, 1, 2, 3].map((x) => <text key={x} x={X(x)} y={H - 6} textAnchor="middle" className="viz-label">{x}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        P(|Z| &gt; t) = {fmt(exact)}; Mills bound {fmt(mills)}; Chebyshev bound {fmt(cheb)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded area is the chance that a normal variable lands more than t standard deviations from its mean: about
        0.32 at t = 1, 0.046 at t = 2 and 0.0027 at t = 3. Chebyshev&apos;s bound 1/t² holds for every distribution with that
        variance and is very loose here. The bound 2φ(t)/t, special to the normal, is nearly exact for large t: normal tails
        die off like e^(−t²/2).
      </figcaption>
    </figure>
  );
}
