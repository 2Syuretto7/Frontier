"use client";

import { useState } from "react";

const win = (i: number, N: number, p: number) => {
  if (Math.abs(p - 0.5) < 1e-9) return i / N;
  const r = (1 - p) / p;
  return (1 - Math.pow(r, i)) / (1 - Math.pow(r, N));
};

/** Gambler's ruin: probability of reaching N before 0 from each starting fortune, for a coin with win probability p. */
export function RuinViz() {
  const [pc, setPc] = useState(49);
  const [N, setN] = useState(20);
  const [i, setI] = useState(10);
  const p = pc / 100;
  const start = Math.min(i, N - 1);
  const W = 320, H = 160;
  const X = (j: number) => 34 + (j / N) * (W - 44);
  const Y = (v: number) => H - 22 - v * (H - 34);
  const pts = Array.from({ length: N + 1 }, (_, j) => `${X(j).toFixed(1)},${Y(win(j, N, p)).toFixed(1)}`).join(" ");
  const fair = Array.from({ length: N + 1 }, (_, j) => `${X(j).toFixed(1)},${Y(j / N).toFixed(1)}`).join(" ");
  const v = win(start, N, p);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          p = {p.toFixed(2)}
          <input type="range" min={40} max={60} value={pc} onChange={(e) => setPc(Number(e.target.value))} aria-label="probability of winning each bet" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          N = {N}
          <input type="range" min={4} max={60} value={N} onChange={(e) => setN(Number(e.target.value))} aria-label="target fortune" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          start = {start}
          <input type="range" min={1} max={59} value={i} onChange={(e) => setI(Number(e.target.value))} aria-label="starting fortune" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of reaching the target against starting fortune">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={34} x2={W - 10} y1={Y(t)} y2={Y(t)} stroke="var(--border)" />
            <text x={30} y={Y(t) + 4} textAnchor="end" className="viz-label">{t}</text>
          </g>
        ))}
        <text x={X(0)} y={H - 6} textAnchor="middle" className="viz-label">0</text>
        <text x={X(N)} y={H - 6} textAnchor="middle" className="viz-label">{N}</text>
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" points={fair} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts} />
        <circle cx={X(start)} cy={Y(v)} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        P(reach {N} before 0 | start at {start}) = {v.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each bet wins ₹1 with probability p and loses ₹1 otherwise. Conditioning on the first bet gives wᵢ = p·wᵢ₊₁ + (1 −
        p)·wᵢ₋₁, whose solution is drawn in blue; the dashed line is the fair game, wᵢ = i/N. A tiny edge for the house, p =
        0.49, already bends the curve hard when N is large: starting halfway to 60 you win only about 23% of the time.
      </figcaption>
    </figure>
  );
}
