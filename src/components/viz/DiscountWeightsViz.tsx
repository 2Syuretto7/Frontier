"use client";

import { useState } from "react";

const GAMMAS = [0.5, 0.8, 0.9, 0.93, 0.95, 0.99], K = 60, DELAY = 10;

/** Discounted value of 1 per step for ever, and of 0 for DELAY steps followed by 2 per step for ever. */
export const streams = (g: number) => ({ steady: 1 / (1 - g), delayed: (2 * g ** DELAY) / (1 - g) });

/** Steps needed for the remaining discount weight to fall below 1% of the total. */
export const horizon99 = (g: number) => Math.ceil(Math.log(0.01) / Math.log(g));

export function DiscountWeightsViz() {
  const [gi, setGi] = useState(2);
  const g = GAMMAS[gi], v = streams(g);
  const W = 330, H = 160, X0 = 30, Y0 = 8, PW = W - 40, PH = H - Y0 - 32, bw = PW / K;
  const sx = (k: number) => X0 + k * bw;
  const sy = (w: number) => Y0 + PH - w * PH;
  const eff = 1 / (1 - g);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="disc-g">discount γ = {g}</label>
        <input id="disc-g" type="range" min={0} max={GAMMAS.length - 1} step={1} value={gi} onChange={(e) => setGi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Weight of the reward k steps ahead">
        {Array.from({ length: K }, (_, k) => (
          <rect key={k} x={sx(k) + 0.5} y={sy(g ** k)} width={Math.max(0.5, bw - 1)} height={Math.max(0, Y0 + PH - sy(g ** k))} fill={k < DELAY ? "var(--text-muted)" : "var(--accent)"} />
        ))}
        {eff <= K && <line x1={sx(eff)} x2={sx(eff)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeDasharray="3 3" />}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 10, 20, 30, 40, 50, 60].map((k) => <text key={k} x={sx(k)} y={Y0 + PH + 14} textAnchor={k === K ? "end" : "middle"} className="viz-label">{k}</text>)}
        {[0, 0.5, 1].map((w) => <text key={w} x={X0 - 4} y={sy(w) + 4} textAnchor="end" className="viz-label">{w}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">steps ahead k (weight γᵏ)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`1/(1−γ) = ${eff.toFixed(0)}; 99% of the weight within ${horizon99(g)} steps`}
        <br />
        {`1 every step: ${v.steady.toFixed(2)}; 2 every step after ${DELAY}: ${v.delayed.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        The bars are the weights γᵏ that the discounted return gives to the reward k steps ahead, and the dashed red line
        marks the effective horizon 1/(1 − γ) when it is under 60. The grey bars cover the first 10 steps. A stream paying 1 every
        step is compared with one paying nothing for 10 steps and then 2 every step: the patient stream wins only when
        2γ¹⁰ &gt; 1, that is, when γ is above about 0.933.
      </figcaption>
    </figure>
  );
}
