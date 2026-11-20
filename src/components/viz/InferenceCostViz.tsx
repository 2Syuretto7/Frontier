"use client";

import { useState } from "react";

const E = 1.69, A = 406.4, B = 410.7, AL = 0.34, BE = 0.28;
const TARGET = E + A / Math.pow(70e9, AL) + B / Math.pow(1.4e12, BE);

/** Tokens a model of size N needs to reach the target loss under the Chinchilla fit. */
export function tokensNeeded(N: number) {
  const gap = TARGET - E - A / Math.pow(N, AL);
  return gap > 0 ? Math.pow(B / gap, 1 / BE) : Infinity;
}

export function totalCost(N: number, Dinf: number) {
  return 6 * N * tokensNeeded(N) + 2 * N * Dinf;
}

const DINF = [0, 1e12, 1e13, 1e14];
const NS = Array.from({ length: 81 }, (_, i) => Math.pow(10, 9.7 + i * 0.0175));

export function InferenceCostViz() {
  const [dinf, setDinf] = useState(1e13);
  const W = 330, H = 170, X0 = 34, PW = 286, Y0 = 8, PH = 130;
  const lx0 = 9.7, lx1 = 11.1, ly0 = 23.4, ly1 = 25.6;
  const px = (N: number) => X0 + ((Math.log10(N) - lx0) / (lx1 - lx0)) * PW;
  const py = (c: number) => Y0 + PH - ((Math.min(ly1, Math.max(ly0, Math.log10(c))) - ly0) / (ly1 - ly0)) * PH;
  const costs = NS.map((n) => totalCost(n, dinf));
  const bi = costs.indexOf(Math.min(...costs));
  const bn = NS[bi], bd = tokensNeeded(bn);
  const c70 = totalCost(70e9, dinf);
  const lbl = (d: number) => (d === 0 ? "training only" : `${d / 1e12}T served`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Tokens served at inference">
          {DINF.map((d) => (
            <button key={d} className="seg" aria-pressed={dinf === d} onClick={() => setDinf(d)}>{lbl(d)}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Lifetime compute against model size for a fixed target loss">
        {[24, 25].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={py(Math.pow(10, e))} y2={py(Math.pow(10, e))} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(Math.pow(10, e)) + 3} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[1e10, 3e10, 1e11].map((n) => (
          <text key={n} x={px(n)} y={Y0 + PH + 12} textAnchor={n === 1e11 ? "end" : "middle"} className="viz-label">{n / 1e9}B</text>
        ))}
        {DINF.map((d) => (
          <polyline key={d} points={NS.map((n) => `${px(n).toFixed(1)},${py(totalCost(n, d)).toFixed(1)}`).join(" ")} fill="none"
            stroke={d === dinf ? "var(--accent)" : "var(--text-muted)"} strokeWidth={d === dinf ? 2 : 0.8} opacity={d === dinf ? 1 : 0.5} />
        ))}
        <circle cx={px(bn)} cy={py(costs[bi])} r={4} fill="var(--code-function)" />
        <line x1={px(70e9)} x2={px(70e9)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" strokeDasharray="3 3" />
        <text x={X0} y={H - 2} className="viz-label">model size; up: training + inference FLOPs (log)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {lbl(dinf)}: cheapest is {(bn / 1e9).toFixed(1)}B parameters on {(bd / 1e12).toFixed(1)}T tokens ({(bd / bn).toFixed(0)} per parameter), {(c70 / costs[bi]).toFixed(2)}× cheaper
        than the 70B model (dashed line)
      </div>
      <figcaption className="viz-caption">
        Every point on a curve reaches the same loss, that of a 70-billion-parameter model trained on 1.4 trillion tokens,
        under the Chinchilla fit. Smaller models need more training tokens to get there but cost less per token served. With
        no inference, the cheapest choice is near compute-optimal; the more tokens the model will serve, the further the
        optimum moves towards a small model trained far beyond twenty tokens per parameter.
      </figcaption>
    </figure>
  );
}
