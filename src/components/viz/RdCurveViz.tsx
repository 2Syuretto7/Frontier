"use client";

import { useState } from "react";

export function h2(p: number) {
  return p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

export function rd(p: number, D: number) {
  return D < Math.min(p, 1 - p) ? h2(p) - h2(D) : 0;
}

/** The rate-distortion function of a biased coin under Hamming distortion, against naive time-sharing. */
export function RdCurveViz() {
  const [p100, setP100] = useState(30);
  const [d100, setD100] = useState(10);
  const p = p100 / 100;
  const pm = Math.min(p, 1 - p);
  const D = Math.min(d100 / 100, 0.5);
  const W = 330, H = 190, X0 = 36, PW = W - 50, PH = 150;
  const sx = (d: number) => X0 + (d / 0.5) * PW;
  const sy = (r: number) => 10 + (1 - r) * PH;
  const curve = Array.from({ length: 201 }, (_, i) => (i / 200) * 0.5).map((d) => `${sx(d)},${sy(rd(p, d))}`).join(" ");
  const share = D < pm ? h2(p) * (1 - D / pm) : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(1) {p.toFixed(2)}
          <input type="range" min={1} max={50} value={p100} onChange={(e) => setP100(Number(e.target.value))} aria-label="probability of a one" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          D {D.toFixed(2)}
          <input type="range" min={0} max={50} value={d100} onChange={(e) => setD100(Number(e.target.value))} aria-label="allowed distortion" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Rate against allowed distortion for a biased coin">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(1)} stroke="var(--border)" />
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X0 + PW} y={H - 8} textAnchor="end" className="viz-label">0.5</text>
        <text x={X0 + PW / 2} y={H - 8} textAnchor="middle" className="viz-label">distortion D</text>
        <line x1={sx(0)} y1={sy(h2(p))} x2={sx(pm)} y2={sy(0)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve} />
        <line x1={sx(D)} y1={sy(0)} x2={sx(D)} y2={sy(1)} stroke="var(--danger)" strokeWidth={1} opacity={0.6} />
        <circle cx={sx(D)} cy={sy(rd(p, D))} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        R(D) = {rd(p, D).toFixed(3)} bits per symbol; time-sharing needs {share.toFixed(3)}; lossless needs {h2(p).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is R(D) = h(p) − h(D), the fewest bits per symbol that allow the coin flips to be rebuilt with a fraction
        D of them wrong. The dashed line is the naive scheme of coding some symbols losslessly and guessing the rest. The
        curve lies below it because it is convex: spreading a little error over every symbol is cheaper than concentrating
        it.
      </figcaption>
    </figure>
  );
}
