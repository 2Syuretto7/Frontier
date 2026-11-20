"use client";

import { useState } from "react";

/** A one-unit model on three features: a sigmoid of a weighted sum, where the third feature has no weight. */
const WEIGHTS = [3, 1.5, 0], BIAS = -2;
export const model = (x: number[]) => 1 / (1 + Math.exp(-(x.reduce((s, v, i) => s + v * WEIGHTS[i], 0) + BIAS)));
const grad = (x: number[]) => { const f = model(x); return WEIGHTS.map((w) => w * f * (1 - f)); };

/** Attributions by plain gradient, gradient times input (from the baseline), and integrated gradients with 200 midpoint steps. */
export function attributions(x: number[], base: number[]) {
  const g = grad(x);
  const ig = x.map(() => 0);
  const S = 200;
  for (let k = 0; k < S; k++) {
    const t = (k + 0.5) / S, p = x.map((v, i) => base[i] + t * (v - base[i])), gp = grad(p);
    gp.forEach((v, i) => { ig[i] += (v * (x[i] - base[i])) / S; });
  }
  return {
    gradient: g,
    gradInput: g.map((v, i) => v * (x[i] - base[i])),
    integrated: ig,
    target: model(x) - model(base),
  };
}

const INPUTS = [
  { name: "unsaturated", x: [0.6, 0.4, 1.0] },
  { name: "saturated", x: [2.0, 1.5, 1.0] },
];
const BASES = [
  { name: "zero baseline", b: [0, 0, 0] },
  { name: "mean baseline", b: [0.5, 0.5, 0.5] },
];
const METHODS: { key: "gradient" | "gradInput" | "integrated"; name: string }[] = [
  { key: "gradient", name: "gradient" },
  { key: "gradInput", name: "grad × input" },
  { key: "integrated", name: "integrated" },
];

export function SaliencyMethodsViz() {
  const [xi, setXi] = useState(1);
  const [bi, setBi] = useState(0);
  const a = attributions(INPUTS[xi].x, BASES[bi].b);
  const W = 330, H = 170, X0 = 92, PW = 210, MAX = 0.8, ZERO = X0 + PW * 0.25;
  const sx = (v: number) => (v / MAX) * PW * 0.75;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Input">
          {INPUTS.map((v, i) => <button key={v.name} type="button" className="seg" aria-pressed={xi === i} onClick={() => setXi(i)}>{v.name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Baseline">
          {BASES.map((v, i) => <button key={v.name} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{v.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Attribution to three features by three methods">
        <line x1={ZERO} x2={ZERO} y1={4} y2={H - 22} stroke="var(--border-strong)" />
        {METHODS.map((m, r) => (
          <g key={m.key}>
            <text x={X0 - 8} y={26 + r * 48} textAnchor="end" className="viz-label">{m.name}</text>
            {a[m.key].map((v, j) => {
              const w = sx(v), y = 8 + r * 48 + j * 13;
              return (
                <g key={j}>
                  <rect x={w >= 0 ? ZERO : ZERO + w} y={y} width={Math.abs(w)} height={11} style={{ fill: j === 0 ? "var(--accent)" : j === 1 ? "var(--text-muted)" : "var(--border-strong)" }} />
                  <text x={ZERO + Math.max(w, 0) + 4} y={y + 9} className="viz-label">x{j + 1} {v.toFixed(2)}</text>
                </g>
              );
            })}
          </g>
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="viz-label">attribution to each feature</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        output change from baseline {a.target.toFixed(3)}; sums: grad × input {a.gradInput.reduce((s, v) => s + v, 0).toFixed(3)}, integrated{" "}
        {a.integrated.reduce((s, v) => s + v, 0).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A single sigmoid unit with weights 3, 1.5 and 0 on three features. At a saturated input the gradient is nearly zero, so
        gradient-based saliency says no feature matters although the output is far from its baseline value. Integrated gradients
        averages the gradient along the straight path from the baseline, and its attributions add up to the change in output. Changing
        the baseline changes every attribution, and the irrelevant third feature always gets zero.
      </figcaption>
    </figure>
  );
}
