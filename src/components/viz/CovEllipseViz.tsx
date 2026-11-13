"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function zs() {
  const r = makeRng(7);
  return Array.from({ length: 250 }, () => {
    const u1 = r(), u2 = r(), rad = Math.sqrt(-2 * Math.log(1 - u1));
    return [rad * Math.cos(2 * Math.PI * u2), rad * Math.sin(2 * Math.PI * u2)];
  });
}

/** Samples x = L z with Σ = L Lᵀ, and the ellipses of Mahalanobis distance 1 and 2, whose axes are the eigenvectors of Σ. */
export function CovEllipseViz() {
  const z = useMemo(zs, []);
  const [s1, setS1] = useState(15), [s2, setS2] = useState(8), [rk, setRk] = useState(60);
  const a = s1 / 10, b = s2 / 10, rho = rk / 100;
  const S = [[a * a, rho * a * b], [rho * a * b, b * b]];
  // Cholesky
  const l11 = a, l21 = rho * b, l22 = b * Math.sqrt(Math.max(0, 1 - rho * rho));
  // eigen-decomposition of 2x2 symmetric
  const tr = S[0][0] + S[1][1], det = S[0][0] * S[1][1] - S[0][1] * S[0][1];
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const lam1 = tr / 2 + disc, lam2 = Math.max(0, tr / 2 - disc);
  const ang = Math.abs(S[0][1]) < 1e-12 ? (S[0][0] >= S[1][1] ? 0 : Math.PI / 2) : Math.atan2(lam1 - S[0][0], S[0][1]);
  const W = 300, H = 260, k = 30;
  const X = (x: number) => W / 2 + x * k, Y = (y: number) => H / 2 - y * k;
  const ellipse = (c: number) => Array.from({ length: 73 }, (_, i) => (2 * Math.PI * i) / 72).map((t) => {
    const u = c * Math.sqrt(lam1) * Math.cos(t), v = c * Math.sqrt(lam2) * Math.sin(t);
    return `${X(u * Math.cos(ang) - v * Math.sin(ang)).toFixed(1)},${Y(u * Math.sin(ang) + v * Math.cos(ang)).toFixed(1)}`;
  }).join(" ");
  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label}
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider(`σ₁ = ${a.toFixed(1)}`, s1, setS1, 3, 25)}
        {slider(`σ₂ = ${b.toFixed(1)}`, s2, setS2, 3, 25)}
        {slider(`ρ = ${rho.toFixed(2)}`, rk, setRk, -99, 99)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Samples with a given covariance and their Mahalanobis ellipses">
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="var(--border)" />
        <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="var(--border)" />
        {z.map(([p, q], i) => <circle key={i} cx={X(l11 * p)} cy={Y(l21 * p + l22 * q)} r={1.8} fill="var(--accent)" opacity={0.5} />)}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={ellipse(1)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.2} strokeDasharray="4 3" points={ellipse(2)} />
        <line x1={X(0)} y1={Y(0)} x2={X(Math.sqrt(lam1) * Math.cos(ang))} y2={Y(Math.sqrt(lam1) * Math.sin(ang))} stroke="var(--text)" strokeWidth={2} />
        <line x1={X(0)} y1={Y(0)} x2={X(-Math.sqrt(lam2) * Math.sin(ang))} y2={Y(Math.sqrt(lam2) * Math.cos(ang))} stroke="var(--text)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        Σ = [[{S[0][0].toFixed(2)}, {S[0][1].toFixed(2)}], [{S[1][0].toFixed(2)}, {S[1][1].toFixed(2)}]]; eigenvalues {lam1.toFixed(2)}, {lam2.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The points are L z for fixed standard normal pairs z, where Σ = L Lᵀ is the Cholesky factorisation. The solid ellipse
        is the set at Mahalanobis distance 1 from the mean, the dashed one distance 2. Its axes are the eigenvectors of Σ,
        with half-lengths √λ: the directions and spreads that principal component analysis finds. As |ρ| → 1 the smaller
        eigenvalue goes to 0 and the cloud collapses onto a line.
      </figcaption>
    </figure>
  );
}
