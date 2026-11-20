"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const K = 10, BETA = 0.1, LR = 0.02, PAIRS = 400, ROUNDS = [1, 5, 20];
const REWARD = Array.from({ length: K }, (_, k) => k / 3);
const REF = (() => { const w = Array.from({ length: K }, (_, k) => 0.5 ** k); const s = w.reduce((a, b) => a + b, 0); return w.map((v) => v / s); })();
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const softmax = (t: number[]) => { const m = Math.max(...t); const e = t.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
const draw = (p: number[], u: number) => { let c = 0; for (let k = 0; k < p.length; k++) { c += p[k]; if (u < c) return k; } return p.length - 1; };

/** Tabular DPO. Offline: one fixed set of pairs sampled from the reference, revisited each round. Online: each round samples
 *  fresh pairs from the current policy. Labels come from Bradley–Terry on REWARD. Returns the policy after each round. */
export function run(online: boolean, rounds: number, seed = 4) {
  const r = rand(seed);
  const th = REF.map(Math.log);
  const sample = (p: number[]) => {
    const out: [number, number][] = [];
    for (let i = 0; i < PAIRS; i++) {
      const a = draw(p, r()), b = draw(p, r());
      if (a === b) continue;
      out.push(r() < sig(REWARD[a] - REWARD[b]) ? [a, b] : [b, a]);
    }
    return out;
  };
  const fixed = sample(REF);
  for (let k = 0; k < rounds; k++) {
    const data = online ? sample(softmax(th)) : fixed;
    for (let ep = 0; ep < 2; ep++) for (const [w, l] of data) {
      const h = (th[w] - Math.log(REF[w])) - (th[l] - Math.log(REF[l]));
      const g = BETA * sig(-BETA * h);
      th[w] += LR * g * 10; th[l] -= LR * g * 10;
    }
  }
  const pi = softmax(th);
  return { pi, reward: pi.reduce((a, p, i) => a + p * REWARD[i], 0) };
}

export function OnlineDpoViz() {
  const [online, setOnline] = useState(false);
  const [ri, setRi] = useState(2);
  const { pi, reward } = useMemo(() => run(online, ROUNDS[ri]), [online, ri]);
  const refReward = REF.reduce((a, p, i) => a + p * REWARD[i], 0);
  const W = 330, H = 170, X0 = 30, PW = 290, Y0 = 10, PH = 120;
  const bw = PW / K;
  const py = (v: number) => Y0 + PH - Math.min(v, 1) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Where the pairs come from">
          <button type="button" className="seg" aria-pressed={!online} onClick={() => setOnline(false)}>offline pairs</button>
          <button type="button" className="seg" aria-pressed={online} onClick={() => setOnline(true)}>online pairs</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="viz-label">rounds</span>
          <div className="segmented" role="group" aria-label="Rounds">
            {ROUNDS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ri === i} onClick={() => setRi(i)}>{v}</button>)}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Policy over ten responses after DPO">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {pi.map((p, k) => (
          <g key={k}>
            <rect x={X0 + k * bw + 3} width={bw - 6} y={py(p)} height={Math.min(p, 1) * PH} style={{ fill: "var(--accent)" }} />
            <rect x={X0 + k * bw + 3} width={bw - 6} y={py(REF[k])} height={REF[k] * PH} style={{ fill: "none", stroke: "var(--text-muted)" }} strokeDasharray="3 2" />
          </g>
        ))}
        <text x={X0} y={H - 18} className="viz-label">responses, reward rising to the right</text>
        <text x={X0} y={H - 4} className="viz-label">filled: policy; dashed: reference</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        expected reward {reward.toFixed(2)} (reference {refReward.toFixed(2)}, best possible {REWARD[K - 1].toFixed(2)})
      </div>
      <figcaption className="viz-caption">
        Ten responses whose reward rises to the right; the reference rarely writes the good ones. Offline DPO trains on 400 pairs
        drawn once from the reference, so the best responses almost never appear in a comparison and gain probability only
        slowly, however long training runs. Online DPO draws new pairs from the current policy each round, so as the policy
        improves it compares better responses and keeps climbing.
      </figcaption>
    </figure>
  );
}
