"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 200, SIGMA = 1.5;

export function weights(d: number, seed: number) {
  const g = makeNormal(makeRng(seed));
  const lw = Array.from({ length: N }, () => {
    let s = 0;
    for (let j = 0; j < d; j++) {
      const z = SIGMA * g();
      s += -0.5 * z * z + 0.5 * (z / SIGMA) ** 2 + Math.log(SIGMA);
    }
    return s;
  });
  const m = Math.max(...lw);
  const w = lw.map((v) => Math.exp(v - m));
  const tot = w.reduce((a, b) => a + b, 0);
  return w.map((v) => v / tot).sort((a, b) => b - a);
}

/** Importance weights for a Gaussian target in d dimensions with a wider Gaussian proposal: one weight takes over. */
export function EssDimViz() {
  const [d, setD] = useState(5);
  const [seed, setSeed] = useState(1);
  const [w, setW] = useState<number[]>([]);
  useEffect(() => setW(weights(d, seed)), [d, seed]);
  const ess = w.length ? 1 / w.reduce((a, v) => a + v * v, 0) : 0;
  const theory = N * Math.pow(SIGMA ** 2 / Math.sqrt(2 * SIGMA ** 2 - 1), -d);
  const W = 330, H = 150, X0 = 20, PW = W - 30, top = w.length ? w[0] : 1;
  const bw = PW / N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          dimension {d}
          <input type="range" min={1} max={60} value={d} onChange={(e) => setD(Number(e.target.value))} aria-label="dimension" style={{ width: 150 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new draw</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Normalised importance weights of 200 samples, sorted from largest to smallest">
        <line x1={X0} y1={H} x2={X0 + PW} y2={H} stroke="var(--border)" />
        <line x1={X0} y1={H - (1 / N / top) * (H - 10)} x2={X0 + PW} y2={H - (1 / N / top) * (H - 10)} stroke="var(--danger)" strokeDasharray="3 3" />
        {w.map((v, i) => (
          <rect key={i} x={X0 + i * bw} y={H - (v / top) * (H - 10)} width={Math.max(0.6, bw - 0.3)} height={(v / top) * (H - 10)} fill="var(--accent)" />
        ))}
        <text x={X0} y={H + 12} className="viz-label">largest weight</text>
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">smallest</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {w.length ? `ESS ${ess.toFixed(1)} of ${N}; theory ≈ ${Math.max(1, theory).toFixed(1)}; largest weight ${(w[0] * 100).toFixed(1)}%` : "sampling"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Target N(0, I) in d dimensions, proposal N(0, 1.5² I): a sensible choice in one dimension, with 83% efficiency.
        Bars are the 200 normalised weights, largest first, scaled to the largest; the dashed line is where equal weights
        would sit. Each dimension multiplies the efficiency by 0.83, so by d = 30 a handful of samples carry nearly all
        the weight, and the estimate is really an average of very few points.
      </figcaption>
    </figure>
  );
}
