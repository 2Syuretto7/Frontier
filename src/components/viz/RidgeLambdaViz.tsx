"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const CENTRES = Array.from({ length: 25 }, (_, i) => -1 + i / 12), WIDTH = 0.12;
const phi = (x: number) => CENTRES.map((c) => Math.exp(-((x - c) ** 2) / (2 * WIDTH * WIDTH)));
const f = (x: number) => Math.sin(3 * x) + 0.5 * Math.cos(7 * x);
const GRID = Array.from({ length: 101 }, (_, i) => -1 + i / 50);
export const LAMS = Array.from({ length: 25 }, (_, i) => 10 ** (-6 + i * 0.25));

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const t = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= t * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

/** Average training and test error of ridge regression over several data sets, at each λ. */
export function path(m: number, seed: number, reps = 12) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const D = CENTRES.length, train = new Array(LAMS.length).fill(0), test = new Array(LAMS.length).fill(0);
  const PG = GRID.map(phi);
  for (let k = 0; k < reps; k++) {
    const xs = Array.from({ length: m }, () => 2 * r() - 1), ys = xs.map((x) => f(x) + 0.3 * nrm());
    const P = xs.map(phi);
    const G = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => P.reduce((a, p) => a + p[i] * p[j], 0)));
    const b = Array.from({ length: D }, (_, i) => P.reduce((a, p, t) => a + p[i] * ys[t], 0));
    LAMS.forEach((lam, li) => {
      const w = solve(G.map((row, i) => row.map((v, j) => v + (i === j ? lam * m : 0))), b);
      const pred = (p: number[]) => p.reduce((a, v, i) => a + v * w[i], 0);
      train[li] += P.reduce((a, p, t) => a + (pred(p) - ys[t]) ** 2, 0) / m / reps;
      test[li] += (PG.reduce((a, p, t) => a + (pred(p) - f(GRID[t])) ** 2, 0) / GRID.length + 0.09) / reps;
    });
  }
  const best = test.indexOf(Math.min(...test));
  return { train, test, best };
}

const MS = [20, 80, 320];

export function RidgeLambdaViz() {
  const [mi, setMi] = useState(0);
  const p = useMemo(() => path(MS[mi], 8), [mi]);
  const W = 330, H = 180, X0 = 34, PW = 280, Y0 = 8, PH = 140, YMAX = 1;
  const sx = (i: number) => X0 + (i / (LAMS.length - 1)) * PW, sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const line = (v: number[]) => v.map((e, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(e).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">training points</span>
        <div className="segmented" role="group" aria-label="Number of training points">
          {MS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Training and test error against the regularisation strength">
        <line x1={X0} x2={X0 + PW} y1={sy(0.09)} y2={sy(0.09)} stroke="var(--border)" strokeDasharray="3 3" />
        <path d={line(p.test)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        <path d={line(p.train)} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <line x1={sx(p.best)} x2={sx(p.best)} y1={Y0} y2={Y0 + PH} stroke="var(--accent)" strokeOpacity={0.5} />
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 5} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[0, 8, 16, 24].map((i) => <text key={i} x={sx(i)} y={H + 2} textAnchor="middle" className="viz-label">{`1e${-6 + i / 4}`}</text>)}
        <text x={X0 + PW / 2} y={H + 14} textAnchor="middle" className="viz-label">λ (log scale)</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> test error</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> training error</span>
        <span>- - - noise level 0.09</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best λ {LAMS[p.best].toExponential(1)}: test {p.test[p.best].toFixed(3)}, train {p.train[p.best].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Ridge regression on 25 radial features, averaged over 12 data sets. Small λ fits the noise, so training error falls
        below the noise level while test error rises; large λ shrinks the fit towards zero and both errors climb. The best λ
        falls as data accumulate, from about 0.02 with 20 points to about 0.006 with 320, as the stability term it guards against
        shrinks like 1/(λm).
      </figcaption>
    </figure>
  );
}
