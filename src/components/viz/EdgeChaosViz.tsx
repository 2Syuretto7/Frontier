"use client";

import { useState } from "react";

const ZS = Array.from({ length: 60 }, (_, i) => -6 + (i + 0.5) * 0.2);
const WS = ZS.map((z) => (Math.exp(-z * z / 2) * 0.2) / Math.sqrt(2 * Math.PI));
const sech2 = (z: number) => 1 / Math.cosh(z) ** 2;

/** Mean-field quantities for tanh: fixed point q*, slope χ₁ and the correlation map. */
export function qStar(sw2: number, sb2: number) {
  let q = 1;
  for (let k = 0; k < 300; k++) q = sw2 * ZS.reduce((s, z, i) => s + WS[i] * Math.tanh(Math.sqrt(q) * z) ** 2, 0) + sb2;
  return q;
}
export function chi1(sw2: number, q: number) {
  return sw2 * ZS.reduce((s, z, i) => s + WS[i] * sech2(Math.sqrt(q) * z) ** 2, 0);
}
export function corrPath(sw2: number, sb2: number, c0: number, layers: number) {
  const q = Math.max(qStar(sw2, sb2), 1e-9), rq = Math.sqrt(q);
  const cs = [c0];
  for (let l = 0; l < layers; l++) {
    const c = cs[l], s = Math.sqrt(Math.max(0, 1 - c * c));
    let e = 0;
    for (let a = 0; a < ZS.length; a++) {
      const t1 = Math.tanh(rq * ZS[a]);
      for (let b = 0; b < ZS.length; b++) e += WS[a] * WS[b] * t1 * Math.tanh(rq * (c * ZS[a] + s * ZS[b]));
    }
    cs.push(Math.min(1, (sw2 * e + sb2) / q));
  }
  return cs;
}

export function EdgeChaosViz() {
  const [sw2, setSw2] = useState(1.5);
  const [sb2, setSb2] = useState(0.05);
  const q = qStar(sw2, sb2), chi = chi1(sw2, q);
  const cs = corrPath(sw2, sb2, 0.5, 30);
  const W = 330, H = 168, PX = 8, PWd = 130, PHd = 120, LX = 172, LW = 150;
  const gx = 22, gy = 16;
  const cells = [];
  for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) {
    const a = 0.5 + ((i + 0.5) * 3.5) / gx, b = ((j + 0.5) * 0.3) / gy;
    const c = chi1(a, qStar(a, b));
    cells.push(<rect key={`${i}-${j}`} x={PX + (i * PWd) / gx} y={8 + PHd - ((j + 1) * PHd) / gy} width={PWd / gx + 0.3} height={PHd / gy + 0.3} fill={c < 1 ? "var(--code-function)" : "var(--accent)"} opacity={Math.min(0.85, 0.15 + Math.abs(Math.log(c)))} />);
  }
  const mx = PX + ((sw2 - 0.5) / 3.5) * PWd, my = 8 + PHd - (sb2 / 0.3) * PHd;
  const lx = (l: number) => LX + (l / 30) * LW, ly = (c: number) => 8 + PHd - ((c + 0.1) / 1.1) * PHd;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 10 }}>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          σw² = {sw2.toFixed(2)}
          <input type="range" min={0.5} max={4} step={0.25} value={sw2} onChange={(e) => setSw2(Number(e.target.value))} aria-label="Weight variance" />
        </label>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          σb² = {sb2.toFixed(2)}
          <input type="range" min={0} max={0.3} step={0.025} value={sb2} onChange={(e) => setSb2(Number(e.target.value))} aria-label="Bias variance" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Phase diagram of tanh networks and the correlation between two inputs across layers">
        {cells}
        <circle cx={mx} cy={my} r={4} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.5} />
        <text x={PX} y={H - 18} className="viz-label">σw² from 0.5 to 4 →</text>
        <text x={PX} y={H - 4} className="viz-label">σb² from 0 to 0.3 ↑</text>
        <line x1={LX} x2={LX + LW} y1={ly(0)} y2={ly(0)} stroke="var(--border)" />
        <line x1={LX} x2={LX + LW} y1={ly(1)} y2={ly(1)} stroke="var(--border)" strokeDasharray="2 3" />
        <text x={LX - 3} y={ly(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={LX - 3} y={ly(0) + 4} textAnchor="end" className="viz-label">0</text>
        <path d={cs.map((c, l) => `${l ? "L" : "M"}${lx(l).toFixed(1)},${ly(c).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={LX} y={H - 18} className="viz-label">correlation, layers 0 to 30</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        q* = {q.toFixed(3)}, χ₁ = {chi.toFixed(3)} ({chi < 1 ? "ordered" : "chaotic"}); correlation after 30 layers {cs[30].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Left: the phase diagram of tanh networks, blue where χ₁ &lt; 1 (ordered) and purple where χ₁ &gt; 1 (chaotic), paler near the
        boundary χ₁ = 1. Right: the correlation between two inputs that start at correlation 0.5. In the ordered phase it
        climbs to 1, so all inputs look alike deep in the network; in the chaotic phase it falls to a fixed value below 1,
        so nearby inputs are pulled apart. Near the edge either change is slow, and information survives many layers.
      </figcaption>
    </figure>
  );
}
