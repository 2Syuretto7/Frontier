"use client";

import { useState } from "react";

export const VARS = [5, 2.5, 1.2, 0.6, 0.3, 0.15], SIG2 = 0.25;
const BETAS = [0.25, 0.5, 1, 2, 4];

/** Optimum of the beta-ELBO of a linear Gaussian VAE, per data dimension of variance v: rate (nats) and distortion. */
export function optimum(beta: number) {
  const c = beta * SIG2;
  return VARS.map((v) => (v > c ? { rate: 0.5 * Math.log(v / c), dist: c } : { rate: 0, dist: v }));
}

export function CollapseViz() {
  const [bi, setBi] = useState(2);
  const beta = BETAS[bi], c = beta * SIG2;
  const opt = optimum(beta);
  const R = opt.reduce((a, o) => a + o.rate, 0), D = opt.reduce((a, o) => a + o.dist, 0), act = opt.filter((o) => o.rate > 0).length;
  const W = 330, H = 190, X0 = 34, Y0 = 22, PH = 120, bw = 34, gap = (W - X0 - 10 - VARS.length * bw) / (VARS.length - 1), YM = 5;
  const sy = (v: number) => Y0 + PH - (Math.sqrt(v) / Math.sqrt(YM)) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">β</span>
        <div className="segmented" role="group" aria-label="Weight of the KL term">
          {BETAS.map((b, i) => <button key={b} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{b}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Rate and distortion per latent dimension">
        <line x1={X0} x2={W - 10} y1={sy(c)} y2={sy(c)} stroke="var(--danger)" strokeDasharray="4 3" />
        <text x={X0 - 4} y={sy(c) + 4} textAnchor="end" className="viz-label">βσ²</text>
        {VARS.map((v, j) => {
          const x = X0 + j * (bw + gap), o = opt[j];
          return (
            <g key={j}>
              <rect x={x} y={sy(v)} width={bw} height={Y0 + PH - sy(v)} fill="none" stroke="var(--border-strong)" />
              <rect x={x} y={sy(o.dist)} width={bw} height={Y0 + PH - sy(o.dist)} fill={o.rate > 0 ? "var(--accent)" : "var(--text-muted)"} fillOpacity={0.45} />
              <text x={x + bw / 2} y={sy(v) - 4} textAnchor="middle" className="viz-label">{o.rate > 0 ? o.rate.toFixed(2) : "0"}</text>
              <text x={x + bw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 8} textAnchor="middle" className="viz-label">data variance per dimension (square-root scale)</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span>outline: data variance</span>
        <span><span style={{ color: "var(--accent)" }}>■</span> distortion, active dimension</span>
        <span><span style={{ color: "var(--text-muted)" }}>■</span> collapsed dimension</span>
        <span>numbers: KL in nats</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`active ${act} of ${VARS.length}; rate ${R.toFixed(3)} nats; distortion ${D.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        A linear VAE fitted at its optimum. A latent dimension whose data variance is below βσ² collapses: its code carries no
        information (KL zero) and the decoder treats that direction as noise, so its distortion is the whole variance. Above the
        line, a dimension&apos;s distortion is exactly βσ² and its rate is half the log of the ratio, the reverse water-filling of
        rate-distortion theory. At β = 1 one of the six dimensions collapses; at β = 4 three do.
      </figcaption>
    </figure>
  );
}
