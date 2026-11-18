"use client";

import { useState } from "react";

const XS = [1, 2, 3, 4, 5, 6];

export function maxentDie(mu: number) {
  const dist = (lam: number) => {
    const w = XS.map((x) => Math.exp(lam * (x - 3.5)));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((v) => v / s);
  };
  let lo = -50, hi = 50;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const m = dist(mid).reduce((a, q, j) => a + q * XS[j], 0);
    if (m < mu) lo = mid; else hi = mid;
  }
  const lam = (lo + hi) / 2;
  return { p: dist(lam), lam };
}

/** The maximum-entropy distribution of a die with a given mean: a geometric tilt of the uniform distribution. */
export function MaxEntDieViz() {
  const [m10, setM10] = useState(45);
  const mu = m10 / 10;
  const { p, lam } = maxentDie(mu);
  const H = -p.reduce((a, q) => a + (q > 0 ? q * Math.log2(q) : 0), 0);
  const W = 330, VH = 170, X0 = 20, BW = (W - 40) / 6, PH = 130;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          mean {mu.toFixed(1)}
          <input type="range" min={11} max={59} value={m10} onChange={(e) => setM10(Number(e.target.value))} aria-label="required mean" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${VH}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Maximum-entropy probabilities of the six faces for the chosen mean">
        <line x1={X0} y1={10 + PH * (1 - 1 / 6)} x2={X0 + 6 * BW} y2={10 + PH * (1 - 1 / 6)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {p.map((q, i) => (
          <g key={i}>
            <rect x={X0 + i * BW + 4} y={10 + PH * (1 - q)} width={BW - 8} height={PH * q} fill="var(--accent)" opacity={0.75} />
            <text x={X0 + i * BW + BW / 2} y={10 + PH * (1 - q) - 3} textAnchor="middle" className="viz-label">{q.toFixed(3)}</text>
            <text x={X0 + i * BW + BW / 2} y={VH - 14} textAnchor="middle" className="viz-label">{i + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        λ = {(Math.abs(lam) < 5e-4 ? 0 : lam).toFixed(3)}; each face is e^λ = {Math.exp(lam).toFixed(3)} times the one before; entropy {H.toFixed(3)} of {Math.log2(6).toFixed(3)} bits
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Of all distributions on the faces 1 to 6 with the required mean, this one has the largest entropy. It is always of
        the form p(x) ∝ e^(λx): successive probabilities grow by a constant factor. At mean 3.5 the factor is 1 and the
        die is fair (dashed line); pushing the mean towards 1 or 6 piles the mass onto one end and the entropy falls.
      </figcaption>
    </figure>
  );
}
