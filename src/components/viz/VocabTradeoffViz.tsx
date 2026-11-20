"use client";

import { useState } from "react";

const MODELS: [string, number, number][] = [["100M", 1e8, 768], ["1B", 1e9, 2048], ["10B", 1e10, 4096], ["100B", 1e11, 8192]];
const VS = Array.from({ length: 61 }, (_, i) => 8000 * 2 ** (i / 10));   // 8k to 512k

/** Illustrative compression: English bytes per token rising with vocabulary size, with diminishing returns. */
export function bytesPerToken(V: number) {
  return 5.0 - 7.0 * V ** -0.2;
}

/** Forward FLOPs per byte for a model with N body parameters and width d. */
export function costPerByte(V: number, N: number, d: number) {
  return (2 * (N + V * d)) / bytesPerToken(V);
}

export function VocabTradeoffViz() {
  const [mi, setMi] = useState(1);
  const [, N, d] = MODELS[mi];
  const costs = VS.map((V) => costPerByte(V, N, d));
  const best = costs.indexOf(Math.min(...costs));
  const lo = Math.min(...costs), hi = Math.max(...costs);
  const W = 330, X0 = 40, Y0 = 8, PW = 278, PH = 120;
  const x = (i: number) => X0 + (i / (VS.length - 1)) * PW;
  const y = (c: number) => Y0 + PH - ((c - lo) / (hi - lo || 1)) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">model size</span>
        <div className="segmented" role="group" aria-label="Model size">
          {MODELS.map(([n], j) => <button key={n} type="button" className="seg" aria-pressed={mi === j} onClick={() => setMi(j)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Compute per byte against vocabulary size">
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <polyline points={costs.map((c, i) => `${x(i)},${y(c)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={x(best)} cy={y(costs[best])} r={4} style={{ fill: "var(--accent)" }} />
        {[0, 20, 40, 60].map((i) => <text key={i} x={x(i)} y={Y0 + PH + 13} textAnchor={i === 60 ? "end" : "middle"} className="viz-label">{`${Math.round(VS[i] / 1000)}k`}</text>)}
        <text x={X0 - 5} y={Y0 + 10} textAnchor="end" className="viz-label">more</text>
        <text x={X0 - 5} y={Y0 + PH} textAnchor="end" className="viz-label">less</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        cheapest near {Math.round(VS[best] / 1000)}k tokens; the output layer is {((100 * VS[best] * d) / (N + VS[best] * d)).toFixed(0)}% of
        the parameters used per token there
      </div>
      <figcaption className="viz-caption">
        Forward compute per byte of English text against vocabulary size, on a log scale, for models of different sizes, using an
        illustrative compression curve. A larger vocabulary packs more bytes into each token but makes the output layer bigger. For a
        small model the output layer dominates and a small vocabulary is cheapest; for a large one the body dominates and larger
        vocabularies pay for themselves.
      </figcaption>
    </figure>
  );
}
