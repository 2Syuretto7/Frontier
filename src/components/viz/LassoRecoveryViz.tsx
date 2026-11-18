"use client";

import { useMemo, useState } from "react";

const D = 100, S = 5, SIGMA = 0.5, NS = [20, 40, 80, 160, 320], MULTS = [0.25, 1, 4];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The true 5-sparse signal used throughout. */
export const TRUTH = (() => {
  const x = new Array(D).fill(0);
  [[7, 2], [23, -1.5], [41, 1], [66, -2.5], [88, 1.2]].forEach(([j, v]) => (x[j] = v));
  return x;
})();

/** Lasso by coordinate descent on n Gaussian measurements of TRUTH with noise SIGMA, lambda = mult times the theory value. */
export function solve(n: number, mult: number) {
  const r = rand(400 + n);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const A = Array.from({ length: n }, () => Array.from({ length: D }, g));
  const y = A.map((row) => row.reduce((s, a, j) => s + a * TRUTH[j], 0) + SIGMA * g());
  const lam = mult * 2 * SIGMA * Math.sqrt((2 * Math.log(2 * D / 0.05)) / n);
  const x = new Array(D).fill(0), res = y.slice();
  const sq = Array.from({ length: D }, (_, j) => A.reduce((s, row) => s + row[j] * row[j], 0) / n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let moved = 0;
    for (let j = 0; j < D; j++) {
      let rho = 0;
      for (let i = 0; i < n; i++) rho += A[i][j] * res[i];
      rho = rho / n + sq[j] * x[j];
      const nx = Math.sign(rho) * Math.max(Math.abs(rho) - lam, 0) / sq[j];
      const dx = nx - x[j];
      if (dx !== 0) { for (let i = 0; i < n; i++) res[i] -= A[i][j] * dx; x[j] = nx; moved = Math.max(moved, Math.abs(dx)); }
    }
    if (moved < 1e-9) break;
  }
  const err = Math.sqrt(x.reduce((s, v, j) => s + (v - TRUTH[j]) ** 2, 0));
  const found = x.filter((v, j) => v !== 0 && TRUTH[j] !== 0).length;
  const extra = x.filter((v, j) => v !== 0 && TRUTH[j] === 0).length;
  return { x, lam, err, found, extra };
}

export function LassoRecoveryViz() {
  const [n, setN] = useState(80);
  const [mult, setMult] = useState(1);
  const { x, lam, err, found, extra } = useMemo(() => solve(n, mult), [n, mult]);
  const W = 330, H = 170, X0 = 24, Y0 = 8, PW = W - 32, PH = H - Y0 - 24, YM = 3;
  const sx = (j: number) => X0 + ((j + 0.5) / D) * PW;
  const sy = (v: number) => Y0 + PH / 2 - (Math.max(-YM, Math.min(YM, v)) / YM) * (PH / 2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">measurements n</span>
        <div className="segmented" role="group" aria-label="Number of measurements">
          {NS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={n === v} onClick={() => setN(v)}>{v}</button>
          ))}
        </div>
        <span className="viz-label">λ</span>
        <div className="segmented" role="group" aria-label="Penalty relative to the theory value">
          {MULTS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={mult === v} onClick={() => setMult(v)}>{`${v}×`}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="True sparse signal and lasso estimate">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        {TRUTH.map((v, j) => v !== 0 && (
          <rect key={`t${j}`} x={sx(j) - 3} y={Math.min(sy(v), sy(0))} width={6} height={Math.abs(sy(v) - sy(0))} fill="var(--accent-soft)" stroke="var(--accent)" />
        ))}
        {x.map((v, j) => v !== 0 && (
          <circle key={`e${j}`} cx={sx(j)} cy={sy(v)} r={2.6} fill={TRUTH[j] !== 0 ? "var(--accent)" : "var(--danger)"} />
        ))}
        {[-2, 0, 2].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">coordinate j of 100</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`λ = ${lam.toFixed(3)}; error ‖x̂ − x*‖ = ${err.toFixed(2)}; true coordinates found ${found} of 5; false ones ${extra}`}
      </div>
      <figcaption className="viz-caption">
        A 5-sparse signal in 100 dimensions (bars), measured n times by random Gaussian rows with noise of standard deviation
        0.5, and the lasso estimate (dots; red where the estimate is nonzero but the truth is zero). With the theory value
        of λ, 80 measurements, fewer than the 100 unknowns, find all five coordinates with no false ones. A quarter of that λ
        lets noise in as small false coordinates; four times it shrinks the estimates towards zero and loses the smallest. The quarter λ even has the
        smaller error here: the theory value is chosen to keep false coordinates out, and pays with shrinkage.
      </figcaption>
    </figure>
  );
}
