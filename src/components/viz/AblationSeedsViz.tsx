"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const BENCH: [string, number][] = [["noisy benchmark", 1.0], ["steady benchmark", 0.35]];   // seed noise σ, in points
const SEEDS = [1, 3, 5, 10];
const DELTA = 0.5;   // dataset B is truly better by half a point

/** Standard normal CDF via an erf approximation. */
function phi(z: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Probability that the mean of n seeds ranks B above A when B is better by DELTA and each run has noise sigma. */
export function pCorrect(n: number, sigma: number) {
  return phi((DELTA * Math.sqrt(n)) / (sigma * Math.SQRT2));
}

export function AblationSeedsViz() {
  const [bi, setBi] = useState(0);
  const [ni, setNi] = useState(1);
  const sigma = BENCH[bi][1], n = SEEDS[ni];
  const rng = rand(61 + bi);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const runs = Array.from({ length: 12 }, () => {
    const a = Array.from({ length: n }, () => 40 + sigma * normal());
    const b = Array.from({ length: n }, () => 40 + DELTA + sigma * normal());
    const m = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
    return { a: m(a), b: m(b) };
  });
  const W = 330, X0 = 30, Y0 = 6, PW = 290, RH = 17;
  const x = (v: number) => X0 + ((v - 37.5) / 5.5) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Benchmark">
          {BENCH.map(([nme], j) => <button key={nme} type="button" className="seg" aria-pressed={bi === j} onClick={() => setBi(j)}>{nme}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Seeds per dataset">
          {SEEDS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={ni === j} onClick={() => setNi(j)}>{`${v} seed${v > 1 ? "s" : ""}`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + runs.length * RH + 16}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Repeated ablations comparing two datasets">
        <line x1={x(40)} x2={x(40)} y1={Y0} y2={Y0 + runs.length * RH} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <line x1={x(40 + DELTA)} x2={x(40 + DELTA)} y1={Y0} y2={Y0 + runs.length * RH} stroke="var(--accent)" strokeDasharray="2 3" />
        {runs.map((r, i) => {
          const y = Y0 + i * RH + RH / 2;
          const right = r.b > r.a;
          return (
            <g key={i}>
              <line x1={x(r.a)} x2={x(r.b)} y1={y} y2={y} stroke={right ? "var(--accent)" : "var(--text)"} strokeWidth={right ? 1 : 2} />
              <circle cx={x(r.a)} cy={y} r={3.5} style={{ fill: "var(--text-muted)" }} />
              <circle cx={x(r.b)} cy={y} r={3.5} style={{ fill: "var(--accent)" }} />
            </g>
          );
        })}
        {[38, 40, 42].map((v) => <text key={v} x={x(v)} y={Y0 + runs.length * RH + 12} textAnchor="middle" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        In this draw {runs.filter((r) => r.b > r.a).length} of 12 ablations rank B first; expected share {(100 * pCorrect(n, sigma)).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Twelve repeated ablations comparing dataset A (grey) with dataset B (colour), which is truly better by half a point. Each row
        shows the benchmark score averaged over the chosen number of training seeds; dark lines mark ablations that rank the datasets
        the wrong way. A benchmark with less seed noise, or more seeds, makes the decision reliable.
      </figcaption>
    </figure>
  );
}
