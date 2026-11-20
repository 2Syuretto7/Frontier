"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const CASES = [
  { label: "longer, no better", q: 0, l: 1 },
  { label: "better, same length", q: 0.6, l: 0 },
  { label: "better and longer", q: 0.6, l: 1 },
];
const GAMMA = 0.8, N = 4000;
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * A policy is compared with a baseline on N prompts. Each pair has a quality gap q ~ N(mean, 1) and a length gap
 * L ~ N(mean, 0.7), in hundreds of tokens. People prefer the policy with probability σ(q); the judge with σ(q + γL).
 * The length-controlled rate fits P(judge prefers policy) = σ(a + bL) by Newton's method and reports σ(a).
 */
export function rates(qm: number, lm: number, seed = 9) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const L: number[] = [], y: number[] = [];
  let human = 0;
  for (let i = 0; i < N; i++) {
    const q = qm + normal(), l = lm + 0.7 * normal();
    L.push(l);
    y.push(r() < sig(q + GAMMA * l) ? 1 : 0);
    human += sig(q);
  }
  let a = 0, b = 0;
  for (let it = 0; it < 10; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (let i = 0; i < N; i++) {
      const p = sig(a + b * L[i]), s = p * (1 - p);
      g0 += p - y[i]; g1 += (p - y[i]) * L[i];
      h00 += s; h01 += s * L[i]; h11 += s * L[i] * L[i];
    }
    const det = h00 * h11 - h01 * h01;
    a -= (h11 * g0 - h01 * g1) / det;
    b -= (-h01 * g0 + h00 * g1) / det;
  }
  return { raw: y.reduce((s, v) => s + v, 0) / N, lc: sig(a), human: human / N };
}

export function JudgeLengthViz() {
  const [ci, setCi] = useState(0);
  const res = useMemo(() => rates(CASES[ci].q, CASES[ci].l), [ci]);
  const rows: [string, number][] = [["people", res.human], ["judge, raw", res.raw], ["judge, length-controlled", res.lc]];
  const W = 330, H = 120, X0 = 150, PW = 165;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How the policy differs from the baseline">
          {CASES.map((c, i) => <button key={c.label} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Win rates by people and by a judge">
        <line x1={X0 + PW / 2} x2={X0 + PW / 2} y1={4} y2={H - 18} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {rows.map(([name, v], i) => (
          <g key={name}>
            <text x={X0 - 8} y={22 + i * 32} textAnchor="end" className="viz-label">{name}</text>
            <rect x={X0} y={10 + i * 32} width={v * PW} height={18} style={{ fill: i === 0 ? "var(--text)" : "var(--accent)", opacity: i === 1 ? 0.55 : 1 }} />
            <text x={X0 + v * PW + 4} y={23 + i * 32} className="viz-label">{(v * 100).toFixed(0)}%</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">50%</text>
      </svg>
      <figcaption className="viz-caption">
        Win rates of a policy against a baseline over 4,000 prompts. The simulated judge agrees with people on quality but also
        likes length. A longer policy that is no better wins with the raw judge; the length-controlled rate fits how the
        judge&apos;s verdict depends on the length gap and reports the win rate at equal length, which tracks the people.
      </figcaption>
    </figure>
  );
}
