"use client";

import { useState } from "react";

const SMIN = 1, EMIN = 1;
const MULTS = [0.125, 0.25, 0.5, 1, 2, 4, 8];

/** Steps and tokens to reach a fixed loss at batch size B, relative to their minima, given the critical batch size. */
export function tradeoff(B: number, Bcrit: number) {
  return { S: SMIN * (1 + Bcrit / B), E: EMIN * (1 + B / Bcrit) };
}

export function StepTokenViz() {
  const [mult, setMult] = useState(1);
  const [late, setLate] = useState(false);
  const base = 1;
  const Bcrit = late ? 4 * base : base;
  const B = mult * base;
  const { S, E } = tradeoff(B, Bcrit);
  const W = 330, H = 170, X0 = 34, PW = 286, Y0 = 8, PH = 130;
  const lmax = Math.log10(40);
  const px = (e: number) => X0 + (Math.log10(e) / lmax) * PW;
  const py = (s: number) => Y0 + PH - (Math.log10(s) / lmax) * PH;
  const curve = (bc: number) => Array.from({ length: 121 }, (_, i) => Math.pow(10, -2 + (4.5 * i) / 120)).map((b) => tradeoff(b, bc)).filter((p) => p.E <= 40 && p.S <= 40).map((p) => `${px(p.E).toFixed(1)},${py(p.S).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Batch size">
          {MULTS.map((m) => (
            <button key={m} className="seg" aria-pressed={mult === m} onClick={() => setMult(m)}>{m < 1 ? `1/${1 / m}` : m}×</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Stage of training">
          {[false, true].map((v) => (
            <button key={String(v)} className="seg" aria-pressed={late === v} onClick={() => setLate(v)}>{v ? "late (lower loss)" : "early"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Steps against tokens needed to reach a fixed loss, for different batch sizes">
        {[1, 2, 5, 10, 20].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
            <text x={px(v)} y={Y0 + PH + 12} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        <polyline points={curve(base)} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <circle cx={px(E)} cy={py(S)} r={4.5} fill="var(--accent)" />
        <text x={X0} y={H - 2} className="viz-label">tokens ÷ minimum (log) →; up: steps ÷ minimum</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        batch {mult < 1 ? `1/${1 / mult}` : mult}× the early critical size, {late ? "late" : "early"} in training: {S.toFixed(2)}× the minimum steps, {E.toFixed(2)}× the minimum tokens
      </div>
      <figcaption className="viz-caption">
        To reach a given loss, a small batch needs the fewest tokens but many steps, a large batch the fewest steps but many
        tokens; the curve between is the hyperbola (S/S_min − 1)(E/E_min − 1) = 1. At the critical batch size both are twice
        their minimum, the usual compromise. Later in training, at lower loss, gradients are noisier relative to their mean and
        the critical batch size grows, so the same batch slides along the curve towards fewer wasted tokens: hence batch-size
        ramps that start small and grow.
      </figcaption>
    </figure>
  );
}
