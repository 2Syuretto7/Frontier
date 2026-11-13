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

const N = 40, REPS = 120, TRUE_W = [1, 1];
const RHOS = [0, 0.3, 0.6, 0.8, 0.9, 0.95, 0.99];

/** Least squares with two features of correlation ρ: the loss surface becomes a long valley and the fitted weights scatter along it. */
export function CollinearViz() {
  const [j, setJ] = useState(3);
  const rho = RHOS[j];
  const sim = useMemo(() => {
    const r = makeRng(17 + j * 31);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const x1 = Array.from({ length: N }, normal);
    const x2 = x1.map((v) => rho * v + Math.sqrt(1 - rho * rho) * normal());
    let a = 0, b = 0, d = 0;
    for (let i = 0; i < N; i++) { a += x1[i] * x1[i]; b += x1[i] * x2[i]; d += x2[i] * x2[i]; }
    const det = a * d - b * b;
    const fits: number[][] = [];
    for (let k = 0; k < REPS; k++) {
      let u = 0, v = 0;
      for (let i = 0; i < N; i++) {
        const y = TRUE_W[0] * x1[i] + TRUE_W[1] * x2[i] + normal();
        u += x1[i] * y; v += x2[i] * y;
      }
      fits.push([(d * u - b * v) / det, (a * v - b * u) / det]);
    }
    const tr = a + d, disc = Math.sqrt((a - d) * (a - d) + 4 * b * b);
    const l1 = (tr + disc) / 2, l2 = (tr - disc) / 2;
    const ang = Math.atan2(l1 - a, b || 1e-12);
    return { fits, H: [a, b, d], l1, l2, ang };
  }, [j, rho]);
  const W = 300, H = 260;
  const X = (v: number) => W / 2 + (v - 1) * 55;
  const Y = (v: number) => H / 2 - (v - 1) * 55;
  const ell = (c: number) =>
    Array.from({ length: 73 }, (_, i) => {
      const th = (2 * Math.PI * i) / 72;
      const p = Math.sqrt(c / sim.l1) * Math.cos(th), q = Math.sqrt(c / sim.l2) * Math.sin(th);
      const ca = Math.cos(sim.ang), sa = Math.sin(sim.ang);
      return `${X(1 + p * ca - q * sa).toFixed(1)},${Y(1 + p * sa + q * ca).toFixed(1)}`;
    }).join(" ");
  const sd = (k: number) => {
    const m = sim.fits.reduce((s, f) => s + f[k], 0) / REPS;
    return Math.sqrt(sim.fits.reduce((s, f) => s + (f[k] - m) * (f[k] - m), 0) / REPS);
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          correlation ρ = {rho.toFixed(2)}
          <input type="range" min={0} max={RHOS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="feature correlation" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Loss contours and scattered least-squares estimates in weight space">
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={0} y2={H} stroke="var(--border)" />
        {[2, 8, 20].map((c) => <polyline key={c} points={ell(c)} fill="none" stroke="var(--text-muted)" strokeWidth={0.9} />)}
        {sim.fits.map((f, i) => <circle key={i} cx={X(f[0])} cy={Y(f[1])} r={1.8} fill="var(--accent)" opacity={0.6} />)}
        <circle cx={X(1)} cy={Y(1)} r={4} fill="var(--danger)" />
        <text x={X(0) + 4} y={Y(0) - 4} className="viz-label">0</text>
        <text x={W - 6} y={Y(0) - 4} textAnchor="end" className="viz-label">w₁</text>
        <text x={X(0) + 4} y={12} className="viz-label">w₂</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        κ(XᵀX) = {(sim.l1 / sim.l2).toFixed(1)}; sd of ŵ₁ = {sd(0).toFixed(3)}, ŵ₂ = {sd(1).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Two standardised features with correlation ρ, 40 rows, true weights (1, 1) marked in the centre. The grey ellipses
        are contours of the residual sum of squares; each dot is the least-squares fit for a fresh draw of the noise. As ρ
        grows, XᵀX approaches a singular matrix: the valley stretches along w₁ + w₂ = 2, the condition number climbs, and the
        fits spread out along it. The sum of the two weights stays well determined while their difference does not.
      </figcaption>
    </figure>
  );
}
