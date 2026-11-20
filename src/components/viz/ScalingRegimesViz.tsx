"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const C = Math.PI ** 2 / 6, S2 = 0.25;
const NS = [4, 16, 64, 256];
const COLORS = ["var(--code-string)", "var(--code-function)", "var(--text-muted)", "var(--accent)"];
const LD = Array.from({ length: 21 }, (_, i) => 1 + i * 0.25);

export const lossModel = (N: number, D: number, d: number) => C * N ** (-2 / d) + (S2 * N) / D;
export const bestN = (D: number, d: number) => ((2 * C * D) / (d * S2)) ** (d / (d + 2));

/** Monte Carlo excess error of the N-bin histogram estimator of sin(2πx) with noise variance 0.25 on D uniform samples. */
export function histogramError(N: number, D: number, trials: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let total = 0;
  for (let t = 0; t < trials; t++) {
    const sum = new Float64Array(N), cnt = new Float64Array(N);
    for (let k = 0; k < D; k++) {
      const x = r(), j = Math.min(N - 1, Math.floor(x * N));
      sum[j] += Math.sin(2 * Math.PI * x) + Math.sqrt(S2) * normal();
      cnt[j]++;
    }
    let e = 0;
    const G = 2000;
    for (let g = 0; g < G; g++) {
      const x = (g + 0.5) / G, j = Math.min(N - 1, Math.floor(x * N));
      const fhat = cnt[j] ? sum[j] / cnt[j] : 0;
      e += (fhat - Math.sin(2 * Math.PI * x)) ** 2;
    }
    total += e / G;
  }
  return total / trials;
}

export function ScalingRegimesViz() {
  const [d, setD] = useState(1);
  const sim = useMemo(() => [1.5, 2, 2.5, 3, 3.5, 4].map((l) => [l, histogramError(16, Math.round(10 ** l), 20, 5)]), []);
  const curves = NS.map((N) => LD.map((l) => Math.log10(lossModel(N, 10 ** l, d))));
  const env = LD.map((l) => Math.log10(lossModel(bestN(10 ** l, d), 10 ** l, d)));
  const all = [...curves.flat(), ...env];
  const lo = Math.floor(Math.min(...all)), hi = Math.ceil(Math.max(...all.filter((v) => v < 3)));
  const W = 330, H = 172, X0 = 40, PW = 260, Y0 = 140, PH = 126;
  const px = (l: number) => X0 + ((l - 1) / 5) * PW;
  const py = (v: number) => Y0 - ((Math.min(hi, v) - lo) / Math.max(1, hi - lo)) * PH;
  const fit = (env[20] - env[8]) / 3;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Data dimension">
          {[1, 2, 4].map((v) => (
            <button key={v} className="seg" aria-pressed={d === v} onClick={() => setD(v)}>d = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Test error against dataset size for several model sizes, log-log">
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((e) => hi - lo <= 4 || (e - lo) % 2 === 0).map((e) => (
          <text key={e} x={X0 - 4} y={py(e) + 4} textAnchor="end" className="viz-label">10{e < 0 ? "⁻" : ""}{"⁰¹²³⁴⁵⁶⁷⁸⁹"[Math.abs(e)]}</text>
        ))}
        {[1, 2, 3, 4, 5, 6].map((l) => <text key={l} x={px(l)} y={Y0 + 12} textAnchor="middle" className="viz-label">10{"⁰¹²³⁴⁵⁶"[l]}</text>)}
        {curves.map((c, k) => (
          <g key={k}>
            <path d={c.map((v, i) => `${i ? "L" : "M"}${px(LD[i]).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[k]} strokeWidth={1.6} />
            <text x={X0 + PW + 2} y={py(c[20]) + 3} className="viz-label" style={{ fill: COLORS[k] }}>{NS[k]}</text>
          </g>
        ))}
        <path d={env.map((v, i) => `${i ? "L" : "M"}${px(LD[i]).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeWidth={2} strokeDasharray="5 4" />
        {d === 1 ? sim.map(([l, e], i) => <circle key={i} cx={px(l)} cy={py(Math.log10(e))} r={3.2} fill="var(--surface)" stroke="var(--code-function)" strokeWidth={1.6} />) : null}
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">samples D; curves labelled by model size N</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best-size envelope slope {fit.toFixed(3)} (resolution-limited, predicted −{(2 / (d + 2)).toFixed(3)}); each fixed-N curve falls with slope −1 before levelling off
      </div>
      <figcaption className="viz-caption">
        The bias–variance model L = c N^−2/d + σ² N/D of a histogram regressor with N cells in d dimensions. At fixed N,
        adding data removes variance at rate 1/D until the resolution floor c N^−2/d is reached: variance-limited, then
        saturated. The dashed envelope chooses the best N for each D and falls with the smaller resolution-limited exponent
        2/(d + 2). For d = 1 the circles are Monte Carlo errors of an actual 16-cell histogram fit to sin(2πx) with noise
        variance 0.25; they match the model curve once each cell holds more than a few samples.
      </figcaption>
    </figure>
  );
}
