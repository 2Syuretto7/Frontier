"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 100000, PRIOR = 0.05;
export const TECHS = [
  { name: "training data search", tpr: 0.7, fpr: 0.05 },
  { name: "feature inspection", tpr: 0.6, fpr: 0.1 },
  { name: "behavioural attack", tpr: 0.5, fpr: 0.08 },
];

/**
 * Simulates N audited models, a fraction PRIOR of which have a hidden objective. Each technique flags a model with probability tpr
 * if it has one and fpr if not. When shared is true, a hidden coin per model makes the techniques succeed or fail together: an
 * objective is equally likely to be obvious (every tpr raised by 0.25) or subtle (lowered by 0.25), and a clean model is quirky with
 * probability 1/4 (every fpr multiplied by 4) or else plain (never flagged), leaving each technique's own rates unchanged. Returns the posterior that assumes independence and
 * the actual fraction with an objective among models flagged by every chosen technique.
 */
export function auditEvidence(chosen: boolean[], shared: boolean, seed = 3) {
  const r = rand(seed);
  let flagged = 0, hit = 0;
  for (let n = 0; n < N; n++) {
    const h = r() < PRIOR, z = r() < 0.5, q = r() < 0.25;
    let all = true;
    TECHS.forEach((t, i) => {
      const p = h ? (shared ? t.tpr + (z ? 0.25 : -0.25) : t.tpr) : shared ? (q ? 4 * t.fpr : 0) : t.fpr;
      const f = r() < p;
      if (chosen[i] && !f) all = false;
    });
    if (all) { flagged++; if (h) hit++; }
  }
  let odds = PRIOR / (1 - PRIOR);
  TECHS.forEach((t, i) => { if (chosen[i]) odds *= t.tpr / t.fpr; });
  return { naive: odds / (1 + odds), actual: flagged ? hit / flagged : 0, flagged };
}

export function AuditEvidenceViz() {
  const [chosen, setChosen] = useState([true, true, false]);
  const [shared, setShared] = useState(1);
  const res = useMemo(() => auditEvidence(chosen, shared === 1), [chosen, shared]);
  const W = 330, H = 104, X0 = 104, PW = 180;
  const rows = [
    { name: "if independent", v: res.naive },
    { name: "simulated", v: res.actual },
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Techniques that flagged the model">
          {TECHS.map((t, i) => (
            <button key={t.name} type="button" className="seg" aria-pressed={chosen[i]} onClick={() => setChosen(chosen.map((c, j) => (j === i ? !c : c)))}>{t.name}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Whether the techniques fail independently">
          {["independent failures", "shared failures"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={shared === i} onClick={() => setShared(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of a hidden objective given that the chosen techniques all flagged the model">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0 + v * PW} x2={X0 + v * PW} y1={6} y2={74} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 + v * PW} y={86} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        {rows.map((row, i) => (
          <g key={row.name}>
            <text x={X0 - 8} y={26 + i * 34} textAnchor="end" className="viz-label">{row.name}</text>
            <rect x={X0} y={12 + i * 34} width={row.v * PW} height={20} style={{ fill: i === 0 ? "var(--text-muted)" : "var(--accent)" }} />
            <text x={X0 + row.v * PW + 4} y={26 + i * 34} className="viz-label">{row.v.toFixed(2)}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">chance of a hidden objective, given all flags</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {res.flagged} of {N} simulated models flagged by every chosen technique
      </div>
      <figcaption className="viz-caption">
        A simulation of one hundred thousand audits in which one model in twenty has a hidden objective; each technique&apos;s hit and
        false alarm rates are illustrative. Multiplying likelihood ratios is right when the techniques fail independently. When they tend
        to succeed or fail on the same models, agreement is weaker evidence than the product suggests, and the posterior that assumes
        independence is too confident.
      </figcaption>
    </figure>
  );
}
