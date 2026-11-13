"use client";

import { useMemo, useState } from "react";

/** Total variation distance to uniform for the random walk on a cycle, plain or lazy, on a log scale. */
export function MixingCurveViz() {
  const [k, setK] = useState(8);
  const [isLazy, setLazy] = useState(true);
  const N = Math.max(20, Math.min(800, 2 * k * k));
  const curve = useMemo(() => {
    let d = new Array(k).fill(0);
    d[0] = 1;
    const out: number[] = [];
    for (let n = 0; n <= N; n++) {
      out.push(0.5 * d.reduce((s, v) => s + Math.abs(v - 1 / k), 0));
      const nd = new Array(k).fill(0);
      for (let i = 0; i < k; i++) {
        const stay = isLazy ? 0.5 : 0, move = isLazy ? 0.25 : 0.5;
        nd[i] += stay * d[i];
        nd[(i + 1) % k] += move * d[i];
        nd[(i + k - 1) % k] += move * d[i];
      }
      d = nd;
    }
    return out;
  }, [k, isLazy, N]);
  const lam = isLazy ? 0.5 + 0.5 * Math.cos((2 * Math.PI) / k) : k % 2 === 0 ? 1 : Math.abs(Math.cos(Math.PI / k));
  const tmix = curve.findIndex((v) => v <= 0.25);
  const W = 320, H = 180, L = 36;
  const X = (n: number) => L + (n / N) * (W - L - 8);
  const Y = (v: number) => 8 + (-Math.log10(Math.max(v, 1e-4)) / 4) * (H - 30);
  const pts = curve.map((v, n) => `${X(n).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={!isLazy} onClick={() => setLazy(false)}>plain walk</button>
        <button type="button" className="seg" aria-pressed={isLazy} onClick={() => setLazy(true)}>lazy walk</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          cycle length {k}
          <input type="range" min={3} max={20} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="cycle length" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Distance to stationarity against the number of steps">
        {[0, -1, -2, -3, -4].map((e) => (
          <g key={e}>
            <line x1={L} x2={W - 8} y1={Y(Math.pow(10, e))} y2={Y(Math.pow(10, e))} stroke="var(--border)" />
            <text x={L - 4} y={Y(Math.pow(10, e)) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        <line x1={L} x2={W - 8} y1={Y(0.25)} y2={Y(0.25)} stroke="var(--danger)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts} />
        <text x={L} y={H - 4} className="viz-label">0</text>
        <text x={W - 8} y={H - 4} textAnchor="end" className="viz-label">n = {N}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        second largest |eigenvalue| {lam.toFixed(3)}; steps to reach distance 1/4: {tmix >= 0 ? tmix : "never"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The walk starts at one vertex of a cycle and the curve is its total variation distance from the uniform
        distribution. On an even cycle the plain walk alternates between even and odd vertices and never converges; the lazy
        walk, which stays put half the time, always does. The slope of the straight part is log of the second largest
        eigenvalue in absolute value, and the time to reach 1/4 grows like the square of the cycle length.
      </figcaption>
    </figure>
  );
}
