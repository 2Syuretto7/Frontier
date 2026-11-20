"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const E = 8, K = 2, T = 256, STEPS = 160;
const MU = Array.from({ length: E }, (_, i) => 0.9 - 0.25 * i);

/** Route STEPS batches of T tokens top-K among E experts, with an optional bias update of size gamma after each batch. */
export function simulate(gamma: number) {
  const r = rand(29);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const bias = new Array<number>(E).fill(0);
  const ratio: number[] = [];
  let counts = new Array<number>(E).fill(0);
  for (let s = 0; s < STEPS; s++) {
    counts = new Array<number>(E).fill(0);
    for (let t = 0; t < T; t++) {
      const sc = MU.map((m) => 1 / (1 + Math.exp(-(m + 0.8 * normal()))));
      const adj = sc.map((v, i) => v + bias[i]);
      const idx = [...adj.keys()].sort((a, b) => adj[b] - adj[a]).slice(0, K);
      idx.forEach((i) => counts[i]++);
    }
    const mean = (T * K) / E;
    ratio.push(Math.max(...counts) / mean);
    for (let i = 0; i < E; i++) bias[i] += counts[i] < mean ? gamma : counts[i] > mean ? -gamma : 0;
  }
  return { ratio, counts, bias: bias.slice() };
}

const GAMMAS = [0, 0.001, 0.005, 0.02];

export function LoadBalanceViz() {
  const [g, setG] = useState(0.005);
  const runs = useMemo(() => GAMMAS.map((v) => simulate(v)), []);
  const run = runs[GAMMAS.indexOf(g)];
  const W = 330, H = 170, X0 = 28, PW = 170, Y0 = 10, PH = 120, RMAX = 3.5;
  const px = (s: number) => X0 + (s / (STEPS - 1)) * PW;
  const py = (v: number) => Y0 + PH - ((Math.min(v, RMAX) - 1) / (RMAX - 1)) * PH;
  const BX = X0 + PW + 22, BW = (W - BX - 4) / E, mean = (T * K) / E;
  const bmax = Math.max(...runs[0].counts);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Bias step size">
          {GAMMAS.map((v) => (
            <button key={v} className="seg" aria-pressed={g === v} onClick={() => setG(v)}>{v === 0 ? "no balancing" : `γ = ${v}`}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Load imbalance over training steps and the final load of each expert">
        {[1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {runs.map((rr, j) => (
          <polyline key={j} points={rr.ratio.map((v, s) => `${px(s).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke={GAMMAS[j] === g ? "var(--accent)" : "var(--text-muted)"} strokeWidth={GAMMAS[j] === g ? 2 : 0.8} opacity={GAMMAS[j] === g ? 1 : 0.5} />
        ))}
        <text x={X0} y={Y0 + PH + 14} className="viz-label">steps →  (max load / mean load)</text>
        <line x1={BX} x2={W - 4} y1={Y0 + PH - (mean / bmax) * PH} y2={Y0 + PH - (mean / bmax) * PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {run.counts.map((c, i) => (
          <rect key={i} x={BX + i * BW + 1} y={Y0 + PH - (Math.min(c, bmax) / bmax) * PH} width={BW - 2} height={(Math.min(c, bmax) / bmax) * PH} fill="var(--code-function)" />
        ))}
        <text x={BX} y={Y0 + PH + 14} className="viz-label">load per expert</text>
        <text x={X0} y={H - 2} className="viz-label">dashed: perfectly even load</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {g === 0 ? "no balancing" : `γ = ${g}`}: last-batch loads {run.counts.join(", ")}; max/mean {run.ratio[STEPS - 1].toFixed(2)}; final biases{" "}
        {run.bias.map((b) => b.toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Eight experts, top-2 routing, and a router that prefers the low-numbered experts. Without balancing, the favourites
        take most tokens every step and the slowest device sets the pace. With the auxiliary-loss-free rule, each expert&apos;s
        bias rises a little when it is underloaded and falls when overloaded; the biases only reorder the selection, never the
        gates. A tiny step takes a long time to correct the skew, a larger one corrects it within a few dozen steps; the spread that
        remains is the noise of a finite batch.
      </figcaption>
    </figure>
  );
}
