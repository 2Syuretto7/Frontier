"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const P = [0.1, 0.2, 0.3, 0.4];
const LOGITS = P.map(Math.log);

export function perturb(r: () => number) {
  return LOGITS.map((l) => l - Math.log(-Math.log(Math.max(1e-12, r()))));
}

/** The Gumbel-max trick: add Gumbel noise to the log probabilities and take the largest. */
export function GumbelMaxViz() {
  const [rng, setRng] = useState<(() => number) | null>(null);
  const [last, setLast] = useState<number[]>(LOGITS);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  useEffect(() => setRng(() => makeRng(9)), []);
  const run = (n: number) => {
    if (!rng) return;
    const c = [...counts];
    let v = last;
    for (let i = 0; i < n; i++) {
      v = perturb(rng);
      c[v.indexOf(Math.max(...v))]++;
    }
    setLast(v);
    setCounts(c);
  };
  const total = counts.reduce((a, b) => a + b, 0);
  const win = last.indexOf(Math.max(...last));
  const W = 330, H = 200, X0 = 30, PW = W - 40, bw = PW / 4;
  const lo = -5, hi = 5;
  const sy = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, v))) / (hi - lo)) * 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => run(1)}>draw 1</button>
        <button type="button" className="seg" onClick={() => run(100)}>draw 100</button>
        <button type="button" className="seg" onClick={() => run(1000)}>draw 1000</button>
        <button type="button" className="seg" onClick={() => { setCounts([0, 0, 0, 0]); setLast(LOGITS); }}>reset</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Perturbed log probabilities for four categories, and the tally of winners against the target probabilities">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        {P.map((p, i) => (
          <g key={i}>
            <line x1={X0 + i * bw + 8} y1={sy(LOGITS[i])} x2={X0 + (i + 1) * bw - 8} y2={sy(LOGITS[i])} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <circle cx={X0 + i * bw + bw / 2} cy={sy(last[i])} r={6} fill={total > 0 && i === win ? "var(--danger)" : "var(--accent)"} />
            <rect x={X0 + i * bw + 10} y={H - 22 - (total ? counts[i] / total : 0) * 140} width={bw - 20} height={(total ? counts[i] / total : 0) * 140} fill="var(--accent)" opacity={0.6} />
            <line x1={X0 + i * bw + 6} y1={H - 22 - p * 140} x2={X0 + (i + 1) * bw - 6} y2={H - 22 - p * 140} stroke="var(--danger)" />
            <text x={X0 + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="viz-label">p = {p}</text>
          </g>
        ))}
        <line x1={X0} y1={H - 22} x2={X0 + PW} y2={H - 22} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        draws {total}; winner frequencies {counts.map((c) => (total ? c / total : 0).toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Top: dashed lines are the log probabilities; dots are the same values plus independent Gumbel noise, and the largest
        (red) is the sample. Bottom: how often each category has won, against its probability (red lines). The noise never
        needs the probabilities to sum to one, and the winner is exactly a draw from the categorical distribution.
      </figcaption>
    </figure>
  );
}
