"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 20000, P = 0.05, TOP = 20;

/**
 * A neuron computes ReLU(w · x) on sparse features, each active with probability 0.05 and then uniform on [0, 1]. Feature 1 has
 * weight 2; k minor features have weight w. Returns how often feature 1 is active among the top-20 inputs, among all inputs on which
 * the neuron fires, and feature 1's share of the neuron's total squared activation.
 */
export function maxActivating(k: number, w: number, seed = 13) {
  const r = rand(seed + k);
  const acts: { a: number; has: boolean; c1: number }[] = [];
  for (let n = 0; n < N; n++) {
    const x1 = r() < P ? r() : 0;
    let s = 2 * x1;
    for (let j = 0; j < k; j++) if (r() < P) s += w * r();
    acts.push({ a: Math.max(0, s), has: x1 > 0, c1: 2 * x1 });
  }
  const firing = acts.filter((x) => x.a > 0);
  const top = [...acts].sort((p, q) => q.a - p.a).slice(0, TOP);
  const sq = firing.reduce((t, x) => t + x.a * x.a, 0);
  const sq1 = firing.reduce((t, x) => t + x.a * x.c1, 0);
  return {
    topPurity: top.filter((x) => x.has).length / TOP,
    firingPurity: firing.filter((x) => x.has).length / firing.length,
    share: sq1 / sq,
  };
}

const KS = [0, 10, 40];
const WS = [0.3, 0.6];

export function MaxActivatingViz() {
  const [k, setK] = useState(1);
  const [w, setW] = useState(1);
  const res = useMemo(() => maxActivating(KS[k], WS[w]), [k, w]);
  const rows = [
    { name: "top 20 inputs", v: res.topPurity },
    { name: "all firing inputs", v: res.firingPurity },
    { name: "activation share", v: res.share },
  ];
  const W = 330, H = 150, X0 = 116, PW = 180;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Number of minor features">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{v} minor</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Weight of each minor feature">
          {WS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={w === i} onClick={() => setW(i)}>minor weight {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="How much of the neuron is explained by its main feature, by three measures">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0 + v * PW} x2={X0 + v * PW} y1={6} y2={112} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 + v * PW} y={124} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        {rows.map((r, i) => (
          <g key={r.name}>
            <text x={X0 - 8} y={26 + i * 34} textAnchor="end" className="viz-label">{r.name}</text>
            <rect x={X0} y={12 + i * 34} width={r.v * PW} height={20} style={{ fill: i === 0 ? "var(--accent)" : "var(--text-muted)" }} />
            <text x={X0 + r.v * PW + 4} y={26 + i * 34} className="viz-label">{r.v.toFixed(2)}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">fraction attributable to feature 1</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        top inputs show feature 1 {(100 * res.topPurity).toFixed(0)}% of the time; it supplies {(100 * res.share).toFixed(0)}% of the activation
      </div>
      <figcaption className="viz-caption">
        Twenty thousand simulated inputs to one neuron that responds strongly to feature 1 and weakly to many minor features. Its top
        twenty activating inputs all contain feature 1, which suggests a clean, single-purpose neuron. But most of the time the neuron
        fires, feature 1 is absent, and the minor features together supply much of its activation. Reading only the top examples hides
        the polysemanticity.
      </figcaption>
    </figure>
  );
}
