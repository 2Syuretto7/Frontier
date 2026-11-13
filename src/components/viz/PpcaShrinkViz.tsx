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

const N = 60;
const NOISES = [0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0];

/** Probabilistic PCA in two dimensions: the fitted covariance ellipse, the PCA projections of the points, and the posterior means of the latent variable, which shrink towards the centre as the noise grows. */
export function PpcaShrinkViz() {
  const [j, setJ] = useState(3);
  const noise = NOISES[j];
  const fit = useMemo(() => {
    const r = makeRng(3131);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const wt = [1.4, 0.7];
    const pts = Array.from({ length: N }, () => { const z = normal(); return [wt[0] * z + noise * normal(), wt[1] * z + noise * normal()]; });
    const mx = pts.reduce((s, p) => s + p[0], 0) / N, my = pts.reduce((s, p) => s + p[1], 0) / N;
    const c = pts.map((p) => [p[0] - mx, p[1] - my]);
    const a = c.reduce((s, p) => s + p[0] * p[0], 0) / N, b = c.reduce((s, p) => s + p[0] * p[1], 0) / N, d = c.reduce((s, p) => s + p[1] * p[1], 0) / N;
    const tr = a + d, disc = Math.sqrt((a - d) * (a - d) + 4 * b * b);
    const l1 = (tr + disc) / 2, l2 = (tr - disc) / 2;
    const ang = Math.atan2(l1 - a, b || 1e-12);
    const u = [Math.cos(ang), Math.sin(ang)];
    const s2 = l2;
    const wn = Math.sqrt(Math.max(l1 - s2, 0));
    const shrink = (wn * wn) / (wn * wn + s2);
    return { c, u, s2, wn, shrink, l1, l2, ang };
  }, [noise]);
  const W = 300, H = 240;
  const X = (v: number) => W / 2 + v * 42, Y = (v: number) => H / 2 - v * 42;
  const ell = Array.from({ length: 73 }, (_, i) => {
    const t = (2 * Math.PI * i) / 72;
    const p = 2 * Math.sqrt(fit.l1) * Math.cos(t), q = 2 * Math.sqrt(fit.l2) * Math.sin(t);
    const ca = Math.cos(fit.ang), sa = Math.sin(fit.ang);
    return `${X(p * ca - q * sa).toFixed(1)},${Y(p * sa + q * ca).toFixed(1)}`;
  }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          noise sd = {noise}
          <input type="range" min={0} max={NOISES.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="noise standard deviation" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Data, the PPCA covariance ellipse, PCA projections and shrunken posterior means">
        <polyline points={ell} fill="var(--accent)" fillOpacity={0.08} stroke="var(--accent)" strokeWidth={1} />
        <line x1={X(-4 * fit.u[0])} y1={Y(-4 * fit.u[1])} x2={X(4 * fit.u[0])} y2={Y(4 * fit.u[1])} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {fit.c.map((p, i) => {
          const t = p[0] * fit.u[0] + p[1] * fit.u[1];
          const ts = t * fit.shrink;
          return (
            <g key={i}>
              <circle cx={X(p[0])} cy={Y(p[1])} r={2.2} fill="var(--text)" opacity={0.7} />
              <circle cx={X(t * fit.u[0])} cy={Y(t * fit.u[1])} r={2} fill="none" stroke="var(--text-muted)" />
              <circle cx={X(ts * fit.u[0])} cy={Y(ts * fit.u[1])} r={2.2} fill="var(--danger)" />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        σ̂² = {fit.s2.toFixed(3)}; ‖W‖² = {(fit.wn * fit.wn).toFixed(3)}; posterior mean = {fit.shrink.toFixed(3)} × PCA projection
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Sixty points generated from a one-dimensional latent variable plus noise. The ellipse is the fitted model covariance
        WWᵀ + σ²I at two standard deviations, and the dashed line is the principal direction. Hollow circles are the
        ordinary PCA projections; filled circles are the PPCA posterior means of the latent variable mapped back onto the
        line, pulled towards the centre by the factor ‖W‖²/(‖W‖² + σ²). With little noise the two agree; as noise grows, the
        model trusts each point less and shrinks harder, the same compromise between prior and data as in Bayesian
        regression.
      </figcaption>
    </figure>
  );
}
