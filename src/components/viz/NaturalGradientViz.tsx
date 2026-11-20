"use client";

import { useState } from "react";

const STEPS = 200, ALPHA = 1, STARTS = [0.5, 0.1, 0.01, 0.001];

/** Gradient ascent on J = p (one-step task: reward 1 for action 1, 0 for action 0), p = sigmoid(theta): vanilla steps dJ/dθ = p(1 − p),
 *  natural steps F⁻¹ dJ/dθ = 1. Returns p after each step. */
export function ascent(p0: number, natural: boolean) {
  let th = Math.log(p0 / (1 - p0));
  const ps = [p0];
  for (let t = 0; t < STEPS; t++) {
    const p = 1 / (1 + Math.exp(-th));
    th += ALPHA * (natural ? 1 : p * (1 - p));
    ps.push(1 / (1 + Math.exp(-th)));
  }
  return ps;
}

export const stepsTo = (ps: number[], target = 0.9) => {
  const i = ps.findIndex((p) => p >= target);
  return i < 0 ? null : i;
};

export function NaturalGradientViz() {
  const [si, setSi] = useState(2);
  const p0 = STARTS[si];
  const van = ascent(p0, false), nat = ascent(p0, true);
  const W = 330, H = 170, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30;
  const sx = (t: number) => X0 + (t / STEPS) * PW, sy = (p: number) => Y0 + PH - p * PH;
  const path = (ps: number[]) => ps.map((p, t) => `${t ? "L" : "M"}${sx(t).toFixed(1)},${sy(p).toFixed(1)}`).join(" ");
  const sv = stepsTo(van), sn = stepsTo(nat);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">starting probability</span>
        <div className="segmented" role="group" aria-label="Starting probability of the better action">
          {STARTS.map((p, i) => <button key={p} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{p}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of the better action under vanilla and natural gradient ascent">
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={X0} x2={X0 + PW} y1={sy(p)} y2={sy(p)} stroke="var(--border)" strokeDasharray={p ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(p) + 4} textAnchor="end" className="viz-label">{p}</text>
          </g>
        ))}
        <path d={path(van)} fill="none" stroke="var(--danger)" strokeWidth={1.6} />
        <path d={path(nat)} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        {[0, 100, 200].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 14} textAnchor={t === STEPS ? "end" : t === 0 ? "start" : "middle"} className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">step</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`steps to reach 0.9: natural ${sn}, vanilla ${sv === null ? `more than ${STEPS}` : sv}`}
      </div>
      <figcaption className="viz-caption">
        A one-step task in which action 1 pays 1 and action 0 pays 0, with π(1) = σ(θ) and step size 1. The vanilla gradient
        (red) is p(1 − p), tiny when the policy starts nearly sure of the wrong action, so it creeps for many steps before it
        moves: from 0.01 it needs 123 steps to reach 0.9 and from 0.001 it does not get there within 200. The natural gradient
        (blue) divides by the Fisher information p(1 − p) and moves θ by 1 every step, so it needs 7 steps from 0.01 and 10
        from 0.001.
      </figcaption>
    </figure>
  );
}
