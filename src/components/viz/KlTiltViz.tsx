"use client";

import { useState } from "react";

const REF = [0.35, 0.3, 0.2, 0.1, 0.05], R = [0, 0.2, 0.5, 0.8, 1], BETAS = [0.01, 0.03, 0.1, 0.3, 1, 3];

/** The optimal policy of max E[r] − β KL(π || ref): ref(a) exp(r(a)/β), normalised. */
export function tilt(beta: number) {
  const m = Math.max(...R), w = REF.map((p, a) => p * Math.exp((R[a] - m) / beta)), z = w.reduce((s, x) => s + x, 0);
  return w.map((x) => x / z);
}

export const expected = (pi: number[]) => pi.reduce((s, p, a) => s + p * R[a], 0);
export const klRef = (pi: number[]) => pi.reduce((s, p, a) => s + (p > 0 ? p * Math.log(p / REF[a]) : 0), 0);

export function KlTiltViz() {
  const [bi, setBi] = useState(3);
  const beta = BETAS[bi], pi = tilt(beta);
  const W = 330, H = 170, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30;
  const sy = (p: number) => Y0 + PH - p * PH, gw = PW / REF.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">β</span>
        <div className="segmented" role="group" aria-label="Strength of the KL penalty">
          {BETAS.map((b, i) => <button key={b} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{b}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Reference and KL-regularised optimal policies over five actions">
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={X0} x2={X0 + PW} y1={sy(p)} y2={sy(p)} stroke="var(--border)" strokeDasharray={p ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(p) + 4} textAnchor="end" className="viz-label">{p}</text>
          </g>
        ))}
        {REF.map((p, a) => (
          <g key={a}>
            <rect x={X0 + a * gw + 6} y={sy(p)} width={gw / 2 - 8} height={Y0 + PH - sy(p)} fill="var(--text-muted)" />
            <rect x={X0 + a * gw + gw / 2 + 2} y={sy(pi[a])} width={gw / 2 - 8} height={Y0 + PH - sy(pi[a])} fill="var(--accent)" />
            <text x={X0 + a * gw + gw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{`r = ${R[a]}`}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">action, with its reward</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`expected reward ${expected(pi).toFixed(3)}, KL from reference ${klRef(pi).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Five actions with rewards from 0 to 1. Grey bars are the reference policy, which rarely picks the best action; blue
        bars are the policy that maximises expected reward minus β times its KL divergence from the reference. That policy
        reweights the reference by exp(r/β). With a strong penalty (β = 3) it barely moves, earning 0.322 against the
        reference&apos;s 0.29; with a weak one (β = 0.01) it puts almost all its mass on the best action, at a KL cost of about 3,
        the log of 1/0.05. In between it trades reward for staying close.
      </figcaption>
    </figure>
  );
}
