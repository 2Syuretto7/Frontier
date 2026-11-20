"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const ACTS = [
  { label: "tanh", f: Math.tanh },
  { label: "ReLU", f: (z: number) => Math.max(0, z) },
];
export const SW2 = [0.5, 1, 1.5, 2, 3, 4];
export const SB2 = 0.05, DEPTH = 12, WIDTH = 200;

const ZS = Array.from({ length: 241 }, (_, i) => -6 + i * 0.05);
const WZ = ZS.map((z) => (Math.exp(-z * z / 2) * 0.05) / Math.sqrt(2 * Math.PI));

/** The mean-field length map q ↦ σ_w² E[φ(√q z)²] + σ_b², iterated from q⁰ = 1. */
export function theory(a: number, sw2: number) {
  const qs = [1];
  for (let l = 0; l < DEPTH; l++) {
    const q = qs[l];
    qs.push(sw2 * ZS.reduce((s, z, i) => s + WZ[i] * ACTS[a].f(Math.sqrt(q) * z) ** 2, 0) + SB2);
  }
  return qs;
}

/** Mean squared pre-activation per layer in one random network of width 200. */
export function empirical(a: number, sw2: number, seed: number) {
  const g = rand(seed * 131 + a * 7 + Math.round(sw2 * 10));
  const gauss = () => Math.sqrt(-2 * Math.log(1 - g())) * Math.cos(2 * Math.PI * g());
  let x = Array.from({ length: WIDTH }, gauss);
  const qs = [x.reduce((s, v) => s + v * v, 0) / WIDTH];
  for (let l = 0; l < DEPTH; l++) {
    const h = x.map(ACTS[a].f), sd = Math.sqrt(sw2 / WIDTH), bs = Math.sqrt(SB2);
    x = Array.from({ length: WIDTH }, () => { let s = bs * gauss(); for (let j = 0; j < WIDTH; j++) s += sd * gauss() * h[j]; return s; });
    qs.push(x.reduce((s, v) => s + v * v, 0) / WIDTH);
  }
  return qs;
}

export function LengthMapViz() {
  const [a, setA] = useState(1);
  const [si, setSi] = useState(3);
  const [seed, setSeed] = useState(1);
  const sw2 = SW2[si];
  const th = theory(a, sw2), em = empirical(a, sw2, seed);
  const top = Math.max(2, ...th, ...em) * 1.1;
  const W = 330, H = 150, X0 = 30, PW = 290, Y0 = 8, PH = 120;
  const sx = (l: number) => X0 + (l / DEPTH) * PW, sy = (q: number) => Y0 + PH - (Math.min(q, top) / top) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Activation">
          {ACTS.map((x, i) => (
            <button key={x.label} type="button" className="seg" aria-pressed={a === i} onClick={() => setA(i)}>{x.label}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Weight variance" style={{ flexWrap: "wrap" }}>
          {SW2.map((v, i) => (
            <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>σw² = {v}</button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed((v) => (v % 9) + 1)}>New network</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Pre-activation variance per layer: mean-field prediction and one finite network">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={sy(0)} stroke="var(--border)" />
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X0 - 4} y={Y0 + 8} textAnchor="end" className="viz-label">{top.toFixed(1)}</text>
        {[0, 6, 12].map((l) => <text key={l} x={sx(l)} y={H - 2} textAnchor={l === 12 ? "end" : "middle"} className="viz-label">layer {l}</text>)}
        <path d={th.map((q, l) => `${l ? "L" : "M"}${sx(l).toFixed(1)},${sy(q).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        {em.map((q, l) => <circle key={l} cx={sx(l)} cy={sy(q)} r={3} fill="var(--accent)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        layer 12: mean field q = {th[DEPTH].toFixed(3)}, network of width {WIDTH}: {em[DEPTH].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The variance of pre-activations, layer by layer, with σ_b² = 0.05. The dashed curve iterates the mean-field length
        map; the dots come from one random network of width 200. For ReLU the map is linear, q ↦ σ_w² q/2 + σ_b², so the
        variance settles at a fixed point below σ_w² = 2, grows by σ_b² per layer at σ_w² = 2 and geometrically above it.
        For tanh it always settles at a finite fixed point, because tanh is bounded. A finite network fluctuates around the
        prediction, and the fluctuations compound with depth.
      </figcaption>
    </figure>
  );
}
