"use client";

import { useState } from "react";

const PRESETS: { name: string; w: number[] }[] = [
  { name: "uniform", w: [1, 1, 1, 1] },
  { name: "dyadic", w: [4, 2, 1, 1] },
  { name: "skewed", w: [16, 2, 1, 1] },
  { name: "certain", w: [1, 0, 0, 0] },
];

/** A distribution over four outcomes: each bar's surprise −log₂ p, and the entropy as their probability-weighted average. */
export function EntropyViz() {
  const [w, setW] = useState([4, 2, 1, 1]);
  const tot = w.reduce((a, b) => a + b, 0) || 1;
  const p = w.map((v) => v / tot);
  const s = p.map((q) => (q > 0 ? -Math.log2(q) : Infinity));
  const H = p.reduce((a, q, i) => a + (q > 0 ? q * s[i] : 0), 0) + 0;
  const W = 330, H0 = 190;
  const BX = (i: number) => 40 + i * 70;
  const BY = (q: number) => 150 - q * 120;
  const set = (i: number, v: number) => setW(w.map((x, j) => (j === i ? v : x)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PRESETS.map((q) => (
          <button key={q.name} type="button" className="seg" aria-pressed={q.w.every((v, i) => v === w[i])} onClick={() => setW(q.w)}>{q.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        {w.map((v, i) => (
          <label key={i} className="mono" style={{ fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
            w{i + 1}
            <input type="range" min={0} max={16} value={v} onChange={(e) => set(i, Number(e.target.value))} aria-label={`weight of outcome ${i + 1}`} style={{ width: 60 }} />
          </label>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H0}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Bars of four probabilities labelled with their surprise">
        <line x1={30} x2={W - 10} y1={BY(0)} y2={BY(0)} stroke="var(--border)" />
        {p.map((q, i) => (
          <g key={i}>
            <rect x={BX(i)} y={BY(q)} width={44} height={BY(0) - BY(q)} fill="var(--accent)" opacity={0.6} />
            <text x={BX(i) + 22} y={BY(q) - 4} textAnchor="middle" className="viz-label">{q.toFixed(3)}</text>
            <text x={BX(i) + 22} y={168} textAnchor="middle" className="viz-label">{Number.isFinite(s[i]) ? `${s[i].toFixed(2)} bits` : "never"}</text>
          </g>
        ))}
        <text x={W / 2} y={184} textAnchor="middle" className="viz-label">surprise of each outcome</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        H = Σ p·(−log₂ p) = {H.toFixed(3)} bits (maximum log₂ 4 = 2)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Entropy is the average surprise: each outcome&apos;s surprise weighted by how often it happens. The uniform
        distribution reaches the maximum of 2 bits. The dyadic one, with probabilities 1/2, 1/4, 1/8, 1/8, has surprises of
        exactly 1, 2, 3 and 3 bits and entropy 1.75, the length of the code 0, 10, 110, 111 on average. Making one outcome
        dominant drives the entropy towards 0, where nothing is left to learn.
      </figcaption>
    </figure>
  );
}
