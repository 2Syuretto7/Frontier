"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NMAX = 15, STEPS = 300, PROMPTS = 32, G = 8, LR = 0.3;
const COSTS = [0, 0.02, 0.05];
const QS = Array.from({ length: 20 }, (_, i) => 0.05 + (0.45 * i) / 19);

const success = (q: number, n: number) => 1 - (1 - q) ** (n + 1);
const softmax = (t: number[]) => { const m = Math.max(...t); const e = t.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };

/**
 * A toy of reasoning RL. Before answering, the policy chooses how many times n to re-check its work; each attempt
 * independently finds the right answer with a prompt-dependent probability q, so it succeeds with 1 − (1 − q)^(n + 1).
 * Reward is 1 for a correct answer minus cost·n. Training is REINFORCE with the group mean as baseline. Returns the mean
 * number of checks and the expected accuracy over training.
 */
export function train(cost: number, seed = 2) {
  const r = rand(seed);
  const th = Array.from({ length: NMAX + 1 }, (_, n) => -0.3 * n);
  const len: number[] = [], acc: number[] = [];
  const record = () => {
    const pi = softmax(th);
    len.push(pi.reduce((s, p, n) => s + p * n, 0));
    acc.push(QS.reduce((s, q) => s + pi.reduce((t, p, n) => t + p * success(q, n), 0), 0) / QS.length);
  };
  record();
  for (let step = 0; step < STEPS; step++) {
    const pi = softmax(th);
    const g = new Array(NMAX + 1).fill(0);
    for (let k = 0; k < PROMPTS; k++) {
      const q = 0.05 + 0.45 * r();
      const ns: number[] = [], rs: number[] = [];
      for (let i = 0; i < G; i++) {
        let u = r(), n = 0;
        while (n < NMAX && u > pi[n]) { u -= pi[n]; n++; }
        ns.push(n);
        rs.push((r() < success(q, n) ? 1 : 0) - cost * n);
      }
      const mean = rs.reduce((a, b) => a + b, 0) / G;
      ns.forEach((n, i) => { const A = rs[i] - mean; for (let j = 0; j <= NMAX; j++) g[j] += A * ((j === n ? 1 : 0) - pi[j]); });
    }
    for (let j = 0; j <= NMAX; j++) th[j] += (LR * g[j]) / (PROMPTS * G) * 10;
    record();
  }
  return { len, acc };
}

export function ThinkingLengthViz() {
  const [ci, setCi] = useState(0);
  const { len, acc } = useMemo(() => train(COSTS[ci]), [ci]);
  const W = 330, H = 190, X0 = 40, PW = 260, Y0 = 10, PH = 140;
  const px = (s: number) => X0 + (s / STEPS) * PW;
  const pyL = (v: number) => Y0 + PH - (v / NMAX) * PH;
  const pyA = (v: number) => Y0 + PH - v * PH;
  const path = (a: number[], f: (v: number) => number) => a.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${f(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">cost per check</span>
        <div className="segmented" role="group" aria-label="Cost per check">
          {COSTS.map((c, i) => <button key={c} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Response length and accuracy over RL training">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={pyA(v)} y2={pyA(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={pyA(v) + 3} textAnchor="end" className="viz-label">{v * 100}%</text>
            <text x={X0 + PW + 4} y={pyA(v) + 3} className="viz-label">{v * NMAX}</text>
          </g>
        ))}
        <path d={path(acc, pyA)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={path(len, pyL)} fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="5 3" />
        <text x={X0 + 6} y={Y0 + PH - 6} className="viz-label">solid: accuracy (left); dashed: checks (right)</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">RL steps (0 to {STEPS})</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        start: {len[0].toFixed(1)} checks, {(acc[0] * 100).toFixed(0)}% correct; end: {len[STEPS].toFixed(1)} checks, {(acc[STEPS] * 100).toFixed(0)}% correct
      </div>
      <figcaption className="viz-caption">
        Nobody tells the policy to think longer. Reward depends only on the final answer, but answers preceded by more checking
        are right more often, so the group baseline credits longer attempts and their share grows. Response length rises with
        accuracy, as it did when DeepSeek-R1-Zero was trained. A cost per check stops the growth where the expected gain of one
        more check no longer pays for it. Even without a cost, growth slows once still longer attempts are rarely sampled.
      </figcaption>
    </figure>
  );
}
