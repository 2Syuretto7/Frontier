"use client";

import { useState } from "react";

const npdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) * ((x - m) / s)) / (s * Math.sqrt(2 * Math.PI));
const GX = Array.from({ length: 241 }, (_, i) => -3 + (7 * i) / 240);
const XOBS = 2, NOISE = 1;
const PM = XOBS / (1 + NOISE), PS = Math.sqrt(NOISE / (1 + NOISE));
const LOGEV = -0.5 * Math.log(2 * Math.PI * (1 + NOISE)) - (XOBS * XOBS) / (2 * (1 + NOISE));

/** The evidence lower bound for a Gaussian model with one observation: the gap between log p(x) and the ELBO of a Gaussian q is exactly KL(q ‖ posterior). */
export function ElboGapViz() {
  const [mi, setMi] = useState(0);
  const [si, setSi] = useState(100);
  const m = mi / 100, s = si / 100;
  const expLik = -0.5 * Math.log(2 * Math.PI * NOISE) - ((XOBS - m) * (XOBS - m) + s * s) / (2 * NOISE);
  const klPrior = 0.5 * (m * m + s * s - 1) - Math.log(s);
  const elbo = expLik - klPrior;
  const W = 330, H = 150;
  const X = (z: number) => 12 + ((z + 3) / 7) * (W - 24);
  const Y = (v: number) => H - 14 - (Math.min(v, 1.4) / 1.4) * (H - 22);
  const line = (f: (z: number) => number) => GX.map((z) => `${X(z).toFixed(1)},${Y(f(z)).toFixed(1)}`).join(" ");
  const BW = 330, BH = 70;
  const lo = -6, hi = -1.5;
  const BX = (v: number) => 20 + ((Math.max(lo, v) - lo) / (hi - lo)) * (BW - 40);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          q mean m = {m.toFixed(2)}
          <input type="range" min={-150} max={250} value={mi} onChange={(e) => setMi(Number(e.target.value))} aria-label="mean of q" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          q sd s = {s.toFixed(2)}
          <input type="range" min={20} max={200} value={si} onChange={(e) => setSi(Number(e.target.value))} aria-label="standard deviation of q" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Prior, posterior and the approximating distribution q">
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.2} points={line((z) => npdf(z, 0, 1))} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={line((z) => npdf(z, PM, PS))} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line((z) => npdf(z, m, s))} />
        <line x1={X(XOBS)} x2={X(XOBS)} y1={8} y2={Y(0)} stroke="var(--danger)" strokeDasharray="2 3" />
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(XOBS) + 4} y={16} className="viz-label">x = 2</text>
      </svg>
      <svg viewBox={`0 0 ${BW} ${BH}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Log evidence, the ELBO and the gap between them">
        <rect x={BX(lo)} y={14} width={BX(elbo) - BX(lo)} height={16} fill="var(--accent)" opacity={0.7} />
        <rect x={BX(elbo)} y={14} width={Math.max(0, BX(LOGEV) - BX(elbo))} height={16} fill="var(--danger)" opacity={0.5} />
        <line x1={BX(LOGEV)} x2={BX(LOGEV)} y1={8} y2={36} stroke="var(--text)" strokeWidth={1.5} />
        <text x={BX(LOGEV)} y={50} textAnchor="middle" className="viz-label">log p(x) = {LOGEV.toFixed(3)}</text>
        <text x={20} y={64} className="viz-label">ELBO {elbo.toFixed(3)}, gap = KL(q ‖ posterior) {(LOGEV - elbo).toFixed(3)}</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The model is z ~ N(0, 1) (dashed) and x | z ~ N(z, 1), with x = 2 observed; the exact posterior (dark curve) is
        N(1, ½). The coloured curve is a Gaussian q you control. The bar shows log p(x), which does not depend on q, split
        into the ELBO and the gap. The gap is the KL divergence from q to the posterior, so it is never negative and it
        vanishes only when q equals the posterior, at m = 1 and s ≈ 0.71.
      </figcaption>
    </figure>
  );
}
