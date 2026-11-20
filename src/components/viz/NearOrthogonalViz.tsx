"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) * Math.cos(2 * Math.PI * r());
}

/** Cosines between every pair of n random unit directions in d dimensions. */
export function pairCosines(n: number, d: number, seed = 9) {
  const r = rand(seed + n * 7 + d);
  const vs = Array.from({ length: n }, () => {
    const v = Array.from({ length: d }, () => gauss(r));
    const s = Math.sqrt(v.reduce((t, x) => t + x * x, 0));
    return v.map((x) => x / s);
  });
  const cos: number[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    let s = 0;
    for (let k = 0; k < d; k++) s += vs[i][k] * vs[j][k];
    cos.push(s);
  }
  const rms = Math.sqrt(cos.reduce((t, c) => t + c * c, 0) / cos.length);
  const max = cos.reduce((t, c) => Math.max(t, Math.abs(c)), 0);
  return { cos, rms, max };
}

const DIMS = [16, 64, 256];
const NS = [32, 128, 512];

export function NearOrthogonalViz() {
  const [d, setD] = useState(1);
  const [n, setN] = useState(1);
  const { cos, rms, max } = useMemo(() => pairCosines(NS[n], DIMS[d]), [n, d]);
  const W = 330, H = 160, X0 = 14, PW = 302, Y0 = 8, PH = 118, BINS = 60;
  const counts = new Array(BINS).fill(0);
  for (const c of cos) counts[Math.min(BINS - 1, Math.floor(((c + 1) / 2) * BINS))]++;
  const top = Math.max(...counts);
  const bw = PW / BINS;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Dimension of the residual stream">
          {DIMS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={d === i} onClick={() => setD(i)}>d = {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Number of directions">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={n === i} onClick={() => setN(i)}>{v} directions</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of cosines between pairs of random directions">
        {counts.map((c, i) => {
          const h = (c / top) * PH;
          return <rect key={i} x={X0 + i * bw + 0.3} y={Y0 + PH - h} width={bw - 0.6} height={h} style={{ fill: "var(--accent)" }} />;
        })}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border-strong)" />
        {[-1, -0.5, 0, 0.5, 1].map((v) => <text key={v} x={X0 + ((v + 1) / 2) * PW} y={Y0 + PH + 13} textAnchor={v === -1 ? "start" : v === 1 ? "end" : "middle"} className="viz-label">{v}</text>)}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="viz-label">cosine between two of the directions</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {cos.length.toLocaleString("en-IN")} pairs; root-mean-square cosine {rms.toFixed(3)}; largest |cosine| {max.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Random directions in the residual stream, as components might use to write and read. In high dimensions almost every pair is
        nearly orthogonal: the typical cosine shrinks like one over the square root of the dimension, so many more directions than
        dimensions can coexist with little interference. Adding directions does not widen the spread, though the worst pair gets worse.
      </figcaption>
    </figure>
  );
}
