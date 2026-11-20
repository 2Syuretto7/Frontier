"use client";

import { useState } from "react";

const SOURCES = [
  { name: "English", size: 1000 },
  { name: "Chinese", size: 200 },
  { name: "German", size: 80 },
  { name: "Hindi", size: 10 },
  { name: "Swahili", size: 2 },
  { name: "Yoruba", size: 0.5 },
];
const BUDGET = 1000;

/** Sampling weights proportional to size^(1/T). */
export function temperatureMix(sizes: number[], T: number) {
  const w = sizes.map((n) => Math.pow(n, 1 / T));
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}

export function TemperatureMixViz() {
  const [T, setT] = useState(1);
  const sizes = SOURCES.map((s) => s.size);
  const w = temperatureMix(sizes, T);
  const nat = temperatureMix(sizes, 1);
  const ep = w.map((x, i) => (x * BUDGET) / sizes[i]);
  const W = 330, H = 190, X0 = 10, PW = 310, Y0 = 18, PH = 110;
  const bw = PW / SOURCES.length;
  const py = (v: number) => Y0 + PH - v * PH;
  const unique = w.reduce((s, x, i) => s + Math.min(x * BUDGET, sizes[i]), 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Sampling temperature">
          {[1, 2, 3.3, 5, 100].map((t) => (
            <button key={t} className="seg" aria-pressed={T === t} onClick={() => setT(t)}>T = {t}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Mixture weights and epochs per language at the chosen sampling temperature">
        <line x1={X0} x2={X0 + PW} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        {SOURCES.map((s, i) => (
          <g key={s.name}>
            <rect x={X0 + i * bw + 8} y={py(w[i])} width={bw - 16} height={w[i] * PH} fill="var(--code-function)" opacity={0.8} />
            <rect x={X0 + i * bw + 6} y={py(nat[i])} width={bw - 12} height={nat[i] * PH} fill="none" stroke="var(--text-muted)" strokeDasharray="3 2" />
            <text x={X0 + (i + 0.5) * bw} y={py(w[i]) - 4} textAnchor="middle" className="viz-label">{(100 * w[i]).toFixed(1)}%</text>
            <text x={X0 + (i + 0.5) * bw} y={Y0 + PH + 12} textAnchor="middle" className="viz-label">{s.name}</text>
            <text x={X0 + (i + 0.5) * bw} y={Y0 + PH + 24} textAnchor="middle" className="viz-label" style={{ fill: ep[i] > 4 ? "var(--accent)" : "var(--text-muted)" }}>
              {ep[i] < 10 ? ep[i].toFixed(2) : ep[i].toFixed(0)} ep
            </text>
          </g>
        ))}
        <text x={X0} y={H - 14} className="viz-label">bars: sampling share; dashed: share by size</text>
        <text x={X0} y={H - 2} className="viz-label">ep: epochs of each language over the budget</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        T = {T}: {BUDGET.toLocaleString("en-IN")}B tokens drawn, {unique.toFixed(0)}B of them distinct; the smallest language is seen{" "}
        {ep[ep.length - 1].toFixed(1)} times over
      </div>
      <figcaption className="viz-caption">
        Six languages with very different amounts of text, in billions of tokens, and a training budget of a trillion tokens.
        Sampling in proportion to size (T = 1) starves the small languages; raising T flattens the mixture towards uniform,
        which gives them a fair share of the model but forces their few tokens to be repeated many times. Every choice of
        mixture is a trade between too little data for some sources and too much repetition of others.
      </figcaption>
    </figure>
  );
}
