"use client";

import { useState } from "react";

/** Hypothetical agent designs: cost per task (relative units) and success rate on a task suite. */
const AGENTS = [
  { name: "A", cost: 0.04, acc: 0.18 },
  { name: "B", cost: 0.1, acc: 0.31 },
  { name: "C", cost: 0.35, acc: 0.42 },
  { name: "D", cost: 0.6, acc: 0.38 },
  { name: "E", cost: 1.4, acc: 0.47 },
  { name: "F", cost: 2.5, acc: 0.44 },
  { name: "G", cost: 6, acc: 0.52 },
  { name: "H", cost: 18, acc: 0.53 },
];
const BUDGETS = [0.2, 1, 5, Infinity];

export function frontier(points: { cost: number; acc: number }[]) {
  const sorted = [...points].sort((a, b) => a.cost - b.cost || b.acc - a.acc);
  let best = -Infinity;
  return sorted.filter((p) => (p.acc > best ? ((best = p.acc), true) : false));
}

export function AgentParetoViz() {
  const [b, setB] = useState(3);
  const front = frontier(AGENTS);
  const ok = AGENTS.filter((a) => a.cost <= BUDGETS[b]);
  const pick = ok.reduce((x, y) => (y.acc > x.acc ? y : x), ok[0]);
  const W = 330, H = 196, X0 = 34, PW = 286, Y0 = 14, PH = 150;
  const px = (c: number) => X0 + ((Math.log10(c) + 2) / 3.5) * PW;
  const py = (a: number) => Y0 + PH - (a / 0.6) * PH;
  const onFront = new Set(front.map((p) => p.cost));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Budget per task">
          {BUDGETS.map((v, i) => <button key={i} type="button" className="seg" aria-pressed={b === i} onClick={() => setB(i)}>{v === Infinity ? "no budget" : `budget ${v}`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Success rate against cost per task for eight agent designs">
        {[0, 0.2, 0.4, 0.6].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y * 100}%</text>
          </g>
        ))}
        {BUDGETS[b] !== Infinity && <rect x={px(BUDGETS[b])} y={Y0} width={X0 + PW - px(BUDGETS[b])} height={PH} style={{ fill: "var(--bg-subtle)" }} opacity={0.8} />}
        <path d={front.map((p, i) => `${i ? "L" : "M"}${px(p.cost).toFixed(1)},${py(p.acc).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        {AGENTS.map((a) => (
          <g key={a.name}>
            <circle cx={px(a.cost)} cy={py(a.acc)} r={a === pick ? 6 : 4} style={{ fill: onFront.has(a.cost) ? "var(--accent)" : "var(--text-muted)" }} stroke={a === pick ? "var(--text)" : "none"} strokeWidth={2} />
            <text x={px(a.cost)} y={py(a.acc) - 8} textAnchor="middle" className="viz-label">{a.name}</text>
          </g>
        ))}
        {[0.01, 0.1, 1, 10].map((c) => <text key={c} x={px(c)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{c}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">cost per task, relative units (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best within budget: agent {pick.name}, {(100 * pick.acc).toFixed(0)}% success at cost {pick.cost}
      </div>
      <figcaption className="viz-caption">
        Eight hypothetical agent designs on one task suite. A leaderboard sorted by success alone puts H first, though it costs
        three times as much as G for one more point. The coloured line joins the designs no other design beats on both cost and
        success; D and F are dominated. Which agent is best depends on the budget, so cost belongs in the report.
      </figcaption>
    </figure>
  );
}
