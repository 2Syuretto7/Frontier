"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { scales, type View } from "./Plot";

const SERIES: { name: string; t: (n: number) => number; sum: number | null; label: string; ymax: number }[] = [
  { name: "1/2ⁿ", t: (n) => 0.5 ** n, sum: 1, label: "1", ymax: 1.3 },
  { name: "1/n²", t: (n) => 1 / (n * n), sum: (Math.PI * Math.PI) / 6, label: "π²/6 ≈ 1.6449", ymax: 2 },
  { name: "1/n", t: (n) => 1 / n, sum: null, label: "", ymax: 5.5 },
  { name: "(−1)ⁿ⁺¹/n", t: (n) => (-1) ** (n + 1) / n, sum: Math.LN2, label: "ln 2 ≈ 0.6931", ymax: 1.2 },
];

/** Partial sums Sₙ = a₁ + … + aₙ of four series: some settle, the harmonic series creeps upward for ever. */
export function PartialSumViz() {
  const [k, setK] = useState(2);
  const [N, setN] = useState(60);
  const S = SERIES[k];
  const V: View = { xmin: 0, xmax: N + 1, ymin: 0, ymax: S.ymax, w: 520, h: 240 };
  const { X, Y } = scales(V);
  const sums: number[] = [];
  let s = 0;
  for (let n = 1; n <= N; n++) { s += S.t(n); sums.push(s); }
  let big = 0; for (let n = 1; n <= 1_000_000; n++) big += S.t(n);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Series">
        {SERIES.map((q, i) => <button key={q.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">Σ {q.name}</span></button>)}
      </div>
      <svg viewBox={`-10 -8 ${V.w + 20} ${V.h + 30}`} className="plot" role="img" aria-label={`Partial sums of the series of ${S.name}`}>
        <line x1={0} x2={V.w} y1={Y(0)} y2={Y(0)} className="viz-axis" />
        {S.sum !== null && <line x1={0} x2={V.w} y1={Y(S.sum)} y2={Y(S.sum)} className="plot-ghost" />}
        {sums.map((v, i) => <circle key={i} cx={X(i + 1)} cy={Y(v)} r={N > 120 ? 1.6 : 2.8} className="plot-point" />)}
        <text x={V.w} y={V.h + 18} textAnchor="end" className="plot-tick">n = 1 to {N}</text>
      </svg>
      <div className="viz-sliders">
        <label>Terms shown N = <span className="mono">{N}</span><input type="range" min={10} max={400} step={10} value={N} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>S<sub>{N}</sub></td><td className="mono">{sums[N - 1].toFixed(5)}</td></tr>
          <tr><td>S<sub>1,000,000</sub></td><td className="mono">{big.toFixed(5)}</td></tr>
          <tr><td>sum of the series</td><td className="mono">{S.sum !== null ? S.label : "none: diverges"}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {S.sum === null
          ? `The terms 1/n shrink to 0, yet the partial sums grow without bound, roughly like ln n: a million terms give only ${fmtNum(Number(big.toFixed(2)))}, but no ceiling is ever reached. Terms tending to 0 is necessary for convergence, not sufficient.`
          : k === 3 ? "The terms alternate in sign and shrink, so the partial sums zig-zag inside ever smaller intervals and close in on ln 2." : "The partial sums rise and settle on the dashed line, the sum of the series."}
      </figcaption>
    </figure>
  );
}
