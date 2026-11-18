"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const MODELS = [
  { name: "N(0, 1)", mu: 0, s: 1 },
  { name: "N(0.5, 1)", mu: 0.5, s: 1 },
  { name: "N(0, 0.5²)", mu: 0, s: 0.5 },
  { name: "N(0, 2²)", mu: 0, s: 2 },
];
const BINS = 10, N = 1000;

export function normCdf(x: number) {
  const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - 0.5 * r : 0.5 * r;
}

export function pitCounts(data: number[], mu: number, s: number) {
  const c = Array(BINS).fill(0);
  data.forEach((x) => { c[Math.min(BINS - 1, Math.floor(normCdf((x - mu) / s) * BINS))]++; });
  return c;
}

/** The probability integral transform: data pushed through a model's CDF are uniform only if the model is right. */
export function PitViz() {
  const [mi, setMi] = useState(0);
  const [data, setData] = useState<number[]>([]);
  useEffect(() => {
    const g = makeNormal(makeRng(21));
    setData(Array.from({ length: N }, () => g()));
  }, []);
  const m = MODELS[mi];
  const c = pitCounts(data, m.mu, m.s);
  const W = 330, H = 150, X0 = 20, PW = W - 30, top = Math.max(N / BINS * 2.2, ...c);
  const bw = PW / BINS;
  const sy = (v: number) => H - (v / top) * (H - 10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {MODELS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === mi} onClick={() => setMi(i)}>{q.name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the model CDF evaluated at the data">
        {c.map((v, i) => <rect key={i} x={X0 + i * bw + 1} y={sy(v)} width={bw - 2} height={H - sy(v)} fill="var(--accent)" opacity={0.75} />)}
        <line x1={X0} y1={sy(N / BINS)} x2={X0 + PW} y2={sy(N / BINS)} stroke="var(--danger)" strokeDasharray="4 3" />
        <line x1={X0} y1={H} x2={X0 + PW} y2={H} stroke="var(--border)" />
        <text x={X0} y={H + 13} className="viz-label">0</text>
        <text x={X0 + PW} y={H + 13} textAnchor="end" className="viz-label">1</text>
        <text x={X0 + PW / 2} y={H + 13} textAnchor="middle" className="viz-label">F(x)</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        A thousand draws from N(0, 1) are pushed through the CDF of the chosen model. If the model is right the values are
        uniform and the bars sit on the dashed line. A shifted model tilts the histogram; a model that is too narrow sends
        too many points to the extreme bins, a U shape; one that is too wide piles them in the middle.
      </figcaption>
    </figure>
  );
}
