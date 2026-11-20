"use client";

import { useState } from "react";

const MODELS = [
  { name: "GPT-3", N: 175e9, D: 300e9 },
  { name: "Gopher", N: 280e9, D: 300e9 },
  { name: "Chinchilla", N: 70e9, D: 1.4e12 },
  { name: "Llama 2 70B", N: 70e9, D: 2e12 },
  { name: "Llama 3 8B", N: 8e9, D: 15e12 },
  { name: "Llama 3 405B", N: 405e9, D: 15.6e12 },
];

/** Model size from the rule of 20 tokens per parameter with C = 6ND. */
export function ruleN(C: number) {
  return Math.sqrt(C / 120);
}

/** Kaplan and colleagues' compute-efficient size, 1.3e9 · C^0.73 with C in petaflop-days. */
export function kaplanN(C: number) {
  return 1.3e9 * Math.pow(C / 8.64e19, 0.73);
}

const fmtN = (x: number) => (x >= 1e12 ? `${(x / 1e12).toFixed(1)}T` : `${(x / 1e9).toFixed(x < 1e10 ? 1 : 0)}B`);

export function AllocationViz() {
  const [sel, setSel] = useState(2);
  const W = 330, H = 180, X0 = 34, PW = 286, Y0 = 8, PH = 140;
  const cx0 = 21, cx1 = 26, ny0 = 9, ny1 = 13;
  const px = (C: number) => X0 + ((Math.log10(C) - cx0) / (cx1 - cx0)) * PW;
  const py = (N: number) => Y0 + PH - ((Math.min(ny1, Math.max(ny0, Math.log10(N))) - ny0) / (ny1 - ny0)) * PH;
  const cs = Array.from({ length: 41 }, (_, i) => Math.pow(10, cx0 + ((cx1 - cx0) * i) / 40));
  const m = MODELS[sel];
  const C = 6 * m.N * m.D;
  const rn = ruleN(C);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Model">
          {MODELS.map((mm, i) => (
            <button key={mm.name} className="seg" aria-pressed={sel === i} onClick={() => setSel(i)}>{mm.name}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Model size against training compute for published models and two allocation rules">
        {[9, 10, 11, 12, 13].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={py(Math.pow(10, e))} y2={py(Math.pow(10, e))} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(Math.pow(10, e)) + 3} textAnchor="end" className="viz-label">{fmtN(Math.pow(10, e))}</text>
          </g>
        ))}
        {[21, 22, 23, 24, 25, 26].map((e) => (
          <text key={e} x={px(Math.pow(10, e))} y={Y0 + PH + 12} textAnchor={e === 26 ? "end" : "middle"} className="viz-label">1e{e}</text>
        ))}
        <polyline points={cs.map((c) => `${px(c).toFixed(1)},${py(kaplanN(c)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline points={cs.map((c) => `${px(c).toFixed(1)},${py(ruleN(c)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={1.8} />
        {MODELS.map((mm, i) => (
          <circle key={mm.name} cx={px(6 * mm.N * mm.D)} cy={py(mm.N)} r={i === sel ? 5 : 3.2} fill={i === sel ? "var(--accent)" : "var(--text)"} />
        ))}
        <text x={X0} y={H - 2} className="viz-label">FLOPs; solid: 20 tokens/parameter; dashed: Kaplan</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {m.name}: {fmtN(m.N)} parameters, {(m.D / 1e12).toFixed(2)}T tokens, {(m.D / m.N).toFixed(1)} tokens per parameter, {C.toExponential(2)} FLOPs;
        20-token rule at this compute: {fmtN(rn)} parameters on {((20 * rn) / 1e12).toFixed(2)}T tokens
      </div>
      <figcaption className="viz-caption">
        Published models placed by training compute and size. GPT-3 and Gopher sit well above the compute-optimal
        line, towards Kaplan&apos;s allocation. Chinchilla, trained on the same compute as Gopher with a quarter of the parameters and over four
        times the tokens, beat it on almost every benchmark. Later models such as Llama 3 8B sit far below the line: they are
        deliberately over-trained, for reasons the next lesson explains.
      </figcaption>
    </figure>
  );
}
