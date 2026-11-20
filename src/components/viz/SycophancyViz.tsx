"use client";

import { useState } from "react";

const CATCH = [0.2, 0.5, 0.8];
const P0 = 0.2, BETA = 0.5, BMAX = 1.5;

/**
 * A user states a wrong belief. The tuned policy either agrees or corrects. Raters reward agreement by b, and reward a
 * correction by 1 only when they notice the user was wrong, with probability nu. The KL-regularised optimum tilts the
 * reference policy, which agrees with probability P0, by exp(reward / β).
 */
export function agreeProb(b: number, nu: number) {
  const a = P0 * Math.exp(b / BETA), c = (1 - P0) * Math.exp(nu / BETA);
  return a / (a + c);
}

export function SycophancyViz() {
  const [ci, setCi] = useState(0);
  const nu = CATCH[ci];
  const W = 330, H = 180, X0 = 40, PW = 280, Y0 = 10, PH = 130;
  const px = (b: number) => X0 + (b / BMAX) * PW, py = (v: number) => Y0 + PH - v * PH;
  const bs = Array.from({ length: 76 }, (_, i) => (i * BMAX) / 75);
  const line = (n: number) => bs.map((b, i) => `${i ? "L" : "M"}${px(b).toFixed(1)},${py(agreeProb(b, n)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">raters notice the user is wrong</span>
        <div className="segmented" role="group" aria-label="How often raters notice the error">
          {CATCH.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{v * 100}%</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Chance the tuned model agrees with a wrong user">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v * 100}%</text>
          </g>
        ))}
        {[0, 0.5, 1, 1.5].map((b) => <text key={b} x={px(b)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{b}</text>)}
        {CATCH.map((n, i) => i !== ci && <path key={n} d={line(n)} fill="none" stroke="var(--border)" strokeWidth={1.5} />)}
        <path d={line(nu)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={X0} x2={X0 + PW} y1={py(P0)} y2={py(P0)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <text x={X0 + PW} y={py(P0) - 4} textAnchor="end" className="viz-label">before tuning</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">reward raters give for agreeing with them</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        agrees with a wrong user: {(agreeProb(0, nu) * 100).toFixed(0)}% with no agreement bonus, {(agreeProb(1, nu) * 100).toFixed(0)}% with a bonus of 1
      </div>
      <figcaption className="viz-caption">
        When a user states something false, the model can agree or correct them. If raters reward agreement, and notice the
        error only some of the time, the policy that maximises their reward minus a KL penalty agrees more often than the
        model did before tuning. The fix is in the signal: raters who check, rewards for correction that do not depend on
        noticing, and evaluations that measure agreement with false claims directly.
      </figcaption>
    </figure>
  );
}
