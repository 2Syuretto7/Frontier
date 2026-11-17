"use client";

import { useState } from "react";

/** ‖e^(tA)‖₂ for A = [[−1, m], [0, −2]]: both eigenvalues are negative, yet the norm can grow by a large factor before it decays. */
export function ExpHumpViz() {
  const [m, setM] = useState(20);
  const normAt = (t: number) => {
    const p = Math.exp(-t), r = Math.exp(-2 * t), q = m * (Math.exp(-t) - Math.exp(-2 * t));
    const s = p * p + q * q + r * r, d = p * r;
    return Math.sqrt((s + Math.sqrt(Math.max(s * s - 4 * d * d, 0))) / 2);
  };
  const T = 8;
  const ts = Array.from({ length: 321 }, (_, i) => (T * i) / 320);
  const ns = ts.map(normAt);
  const peakIdx = ns.reduce((bi, v, i) => (v > ns[bi] ? i : bi), 0);
  const W = 330, H = 160;
  const X = (t: number) => 34 + (t / T) * (W - 44);
  const lo = -3, hi = 2;
  const Y = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, Math.log10(v)))) / (hi - lo)) * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          off-diagonal m = {m}
          <input type="range" min={0} max={100} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="off-diagonal entry" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Norm of the matrix exponential against time on a log scale">
        {[-3, -2, -1, 0, 1, 2].map((l) => (
          <g key={l}>
            <line x1={X(0)} x2={X(T)} y1={Y(10 ** l)} y2={Y(10 ** l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={Y(10 ** l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.4} points={ts.map((t) => `${X(t).toFixed(1)},${Y(Math.exp(-t)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={ts.map((t, i) => `${X(t).toFixed(1)},${Y(ns[i]).toFixed(1)}`).join(" ")} />
        <circle cx={X(ts[peakIdx])} cy={Y(ns[peakIdx])} r={3} fill="var(--danger)" />
        <text x={X(0)} y={H - 6} className="viz-label">t = 0</text>
        <text x={X(T)} y={H - 6} textAnchor="end" className="viz-label">t = {T}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        peak ‖e^(tA)‖ = {ns[peakIdx].toFixed(2)} at t = {ts[peakIdx].toFixed(2)}; eigenvalues −1 and −2
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is ‖e^(tA)‖ on a log scale and the dashed line e^(−t), the decay the eigenvalues promise. For m = 0
        the matrix is normal and the two agree. As m grows the eigenvectors become nearly parallel and the solution of
        x′ = Ax can first grow by about m/4 (red dot) before the eigenvalues win. Stability of a continuous-time system,
        or of a state-space layer, depends on more than its spectrum when the matrix is far from normal.
      </figcaption>
    </figure>
  );
}
