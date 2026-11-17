"use client";

import { useState } from "react";

const h = (q: number) => (q <= 0 || q >= 1 ? 0 : -q * Math.log2(q) - (1 - q) * Math.log2(1 - q));
const STAGES = 8;

/** A bit passed through a chain of noisy copies X → Z₁ → Z₂ → …: the information each stage keeps about X can only fall. */
export function DpiViz() {
  const [p, setP] = useState(0.5);
  const [eps, setEps] = useState(0.1);
  const [k, setK] = useState(4);
  const info = Array.from({ length: STAGES + 1 }, (_, j) => {
    const e = (1 - (1 - 2 * eps) ** j) / 2;
    const q = p * (1 - e) + (1 - p) * e;
    return h(q) - h(e);
  });
  const W = 330, H = 180;
  const BX = (j: number) => 30 + j * 33;
  const BY = (v: number) => 140 - v * 110;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(X = 1) = {p.toFixed(2)}
          <input type="range" min={0.01} max={0.99} step={0.01} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="probability that X is 1" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          flip ε = {eps.toFixed(2)}
          <input type="range" min={0} max={0.5} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} aria-label="flip probability per stage" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          stages shown = {k}
          <input type="range" min={1} max={STAGES} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of stages" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Bars of the mutual information between X and each stage of the chain">
        <line x1={20} x2={W - 10} y1={BY(0)} y2={BY(0)} stroke="var(--border)" />
        <line x1={20} x2={W - 10} y1={BY(info[0])} y2={BY(info[0])} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {info.slice(0, k + 1).map((v, j) => (
          <g key={j}>
            <rect x={BX(j)} y={BY(v)} width={24} height={BY(0) - BY(v)} fill={j === 0 ? "var(--text-muted)" : "var(--accent)"} opacity={0.7} />
            <text x={BX(j) + 12} y={BY(v) - 3} textAnchor="middle" className="viz-label">{v.toFixed(2)}</text>
            <text x={BX(j) + 12} y={BY(0) + 13} textAnchor="middle" className="viz-label">{j === 0 ? "X" : `Z${j}`}</text>
          </g>
        ))}
        <text x={W - 10} y={BY(info[0]) - 4} textAnchor="end" className="viz-label">H(X)</text>
        <text x={30} y={H - 6} className="viz-label">I(X; Zⱼ) in bits, each stage flipping with probability ε</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The first bar is I(X; X) = H(X). Each later stage copies the previous one and flips it with probability ε, so X →
        Z₁ → Z₂ → … is a Markov chain, and the data processing inequality forces the bars to fall: no later stage can know
        more about X than an earlier one. With ε = 0 nothing is lost; with ε = 0.5 everything is lost at once.
      </figcaption>
    </figure>
  );
}
