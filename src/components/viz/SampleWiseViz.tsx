"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const P = 40, RUNS = 12;
const NS = Array.from({ length: 30 }, (_, i) => 4 * i + 4);
const NOISE = [0.1, 0.5];

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = c + 1; r < n; r++) { const t = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= t * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

/**
 * Linear regression with P isotropic Gaussian features, coefficients drawn with squared norm about 1 and noise variance s2.
 * For each training size n, fits minimum-norm least squares, or ridge with the Bayes-optimal penalty P·s2, and returns the
 * excess test risk ‖β̂ − β‖² averaged over RUNS draws.
 */
export function sampleWise(s2: number, ridge: boolean, seed = 63) {
  const r = rand(seed);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return NS.map((n) => {
    let tot = 0;
    for (let run = 0; run < RUNS; run++) {
      const beta = Array.from({ length: P }, () => g() / Math.sqrt(P));
      const X = Array.from({ length: n }, () => Array.from({ length: P }, g));
      const y = X.map((row) => row.reduce((a, x, j) => a + x * beta[j], 0) + Math.sqrt(s2) * g());
      let bh: number[];
      if (ridge || n >= P) {
        const lam = ridge ? P * s2 : 0;
        const A = Array.from({ length: P }, (_, i) => Array.from({ length: P }, (_, j) => X.reduce((a, row) => a + row[i] * row[j], 0) + (i === j ? lam : 0)));
        const b = Array.from({ length: P }, (_, i) => X.reduce((a, row, k) => a + row[i] * y[k], 0));
        bh = solve(A, b);
      } else {
        const K = X.map((ri) => X.map((rj) => ri.reduce((a, x, j) => a + x * rj[j], 0)));
        const alpha = solve(K, y);
        bh = Array.from({ length: P }, (_, j) => X.reduce((a, row, k) => a + row[j] * alpha[k], 0));
      }
      tot += bh.reduce((a, v, j) => a + (v - beta[j]) ** 2, 0);
    }
    return { n, risk: tot / RUNS };
  });
}

export function SampleWiseViz() {
  const [s, setS] = useState(1);
  const [rg, setRg] = useState(0);
  const pts = useMemo(() => sampleWise(NOISE[s], rg === 1), [s, rg]);
  const W = 330, H = 180, X0 = 30, PW = 290, Y0 = 10, PH = 140, YMAX = 3;
  const px = (n: number) => X0 + (n / 120) * PW;
  const py = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const path = pts.map((d, i) => `${i ? "L" : "M"}${px(d.n).toFixed(1)},${py(d.risk).toFixed(1)}`).join(" ");
  const worst = pts.reduce((a, b) => (b.risk > a.risk ? b : a));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Label noise">
          {NOISE.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>noise variance {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Fit">
          {["no penalty", "tuned ridge"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={rg === i} onClick={() => setRg(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Test error against the number of training examples">
        {[0, 1, 2, 3].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <line x1={px(P)} x2={px(P)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={px(P) + 4} y={Y0 + PH - 6} className="viz-label">n = number of parameters</text>
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[0, 40, 80, 120].map((n) => <text key={n} x={px(n)} y={Y0 + PH + 13} textAnchor={n === 0 ? "start" : n === 120 ? "end" : "middle"} className="viz-label">{n}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">training examples n (40 parameters)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        worst test error {worst.risk > YMAX ? `above ${YMAX}` : worst.risk.toFixed(2)} at n = {worst.n}; at n = 120: {pts[pts.length - 1].risk.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Least-squares regression with 40 parameters, fitted on more and more examples; the curve is the error in the fitted
        coefficients, averaged over draws. Without a penalty, error rises as the number of examples approaches the number of
        parameters, where the model can just barely fit the noise, so adding data makes the model worse. A well-chosen ridge
        penalty removes the peak.
      </figcaption>
    </figure>
  );
}
