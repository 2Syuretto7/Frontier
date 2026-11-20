"use client";

import { useState } from "react";

/** Start-state value of the short corridor when every state goes right with probability p: (2p − 4)/(p(1 − p)). */
export function corridorJ(p: number) {
  return (2 * p - 4) / (p * (1 - p));
}

const YMIN = -100, YMAX = 0;

export function ShortCorridorViz() {
  const [pi, setPi] = useState(50);
  const p = pi / 100;
  const W = 330, H = 200, X0 = 38, Y0 = 52, PW = W - 50, PH = H - Y0 - 30;
  const sx = (q: number) => X0 + q * PW, sy = (v: number) => Y0 + PH - ((Math.max(YMIN, v) - YMIN) / (YMAX - YMIN)) * PH;
  const pts: string[] = [];
  for (let i = 1; i < 200; i++) {
    const q = i / 200;
    if (corridorJ(q) < YMIN) continue;
    pts.push(`${pts.length ? "L" : "M"}${sx(q).toFixed(1)},${sy(corridorJ(q)).toFixed(1)}`);
  }
  const cell = 52, cx = (i: number) => 18 + i * (cell + 10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="corr-p">P(right) = {p.toFixed(2)}</label>
        <input id="corr-p" type="range" min={5} max={95} step={1} value={pi} onChange={(e) => setPi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The short corridor and the start value as a function of the probability of going right">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={cx(i)} y={6} width={cell} height={28} rx={4} fill={i === 3 ? "var(--accent-soft)" : "var(--bg)"} stroke="var(--border)" />
            <text x={cx(i) + cell / 2} y={24} textAnchor="middle" className="viz-label">{i === 0 ? "start" : i === 3 ? "goal" : i === 1 ? "reversed" : ""}</text>
          </g>
        ))}
        {[-100, -50, 0].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v === YMIN ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v === 0 ? "0" : `−${-v}`}</text>
          </g>
        ))}
        <path d={pts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        {[0.05, 0.95].map((q) => <circle key={q} cx={sx(q)} cy={sy(corridorJ(q))} r={3.5} fill="var(--danger)" />)}
        <circle cx={sx(p)} cy={sy(corridorJ(p))} r={4.5} fill="var(--text)" />
        {[0, 0.5, 1].map((q) => <text key={q} x={sx(q)} y={Y0 + PH + 14} textAnchor={q === 1 ? "end" : q === 0 ? "start" : "middle"} className="viz-label">{q}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">probability of choosing right</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`value of the start state: ${corridorJ(p).toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        Every step costs 1. In the start state and the third state, right moves right and left moves left (left from the
        start stays put); in the second state the two actions are swapped. The agent cannot tell the states apart, so a
        policy is just the probability of choosing right. Always choosing right or always left never finishes. ε-greedy with
        ε = 0.1 can only reach the red points, with values −82.1 and −44.2. The best stochastic policy chooses right a little
        more than half the time and needs under 12 steps on average; a parametrised policy can learn it by gradient ascent.
      </figcaption>
    </figure>
  );
}
