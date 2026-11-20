"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const CENTRES = Array.from({ length: 15 }, (_, i) => -1 + i / 7), WIDTH = 0.18;
const phi = (x: number) => CENTRES.map((c) => Math.exp(-((x - c) ** 2) / (2 * WIDTH * WIDTH)));
const f = (x: number) => Math.sin(3 * x);
const GRID = Array.from({ length: 81 }, (_, i) => -1 + i / 40);

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

/** Ridge regression minimising (1/m) Σ (f(x_i) - y_i)² + λ‖w‖² on radial features. */
function fit(xs: number[], ys: number[], lam: number) {
  const D = CENTRES.length, m = xs.length;
  const A = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => (i === j ? lam * m : 0)));
  const b = new Array(D).fill(0);
  xs.forEach((x, k) => { const p = phi(x); for (let i = 0; i < D; i++) { b[i] += p[i] * ys[k]; for (let j = 0; j < D; j++) A[i][j] += p[i] * p[j]; } });
  const w = solve(A, b);
  return (x: number) => phi(x).reduce((a, v, i) => a + v * w[i], 0);
}

/** Fit on S and on S with its first point replaced by an outlier; returns both fits and the largest change on the grid. */
export function experiment(m: number, lam: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const xs = Array.from({ length: m }, () => 2 * r() - 1), ys = xs.map((x) => f(x) + 0.2 * nrm());
  const xs2 = [0.2, ...xs.slice(1)], ys2 = [3, ...ys.slice(1)];
  const g = fit(xs, ys, lam), g2 = fit(xs2, ys2, lam);
  const change = Math.max(...GRID.map((x) => Math.abs(g(x) - g2(x))));
  const train = xs.reduce((a, x, i) => a + (g(x) - ys[i]) ** 2, 0) / m;
  const test = GRID.reduce((a, x) => a + (g(x) - f(x)) ** 2, 0) / GRID.length + 0.04;
  return { xs, ys, g, g2, change, train, test };
}

const LAMS = [1e-5, 1e-3, 1e-1];

export function StabilityViz() {
  const [li, setLi] = useState(1);
  const lam = LAMS[li];
  const e = useMemo(() => experiment(40, lam, 3), [lam]);
  const decay = useMemo(() => [40, 160, 640].map((m) => experiment(m, lam, 3).change), [lam]);
  const W = 330, H = 170, X0 = 10, PW = 310, Y0 = 8, PH = 140, YL = -2, YH = 3.2;
  const sx = (x: number) => X0 + ((x + 1) / 2) * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  const line = (g: (x: number) => number) => GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">regularisation λ</span>
        <div className="segmented" role="group" aria-label="Regularisation strength">
          {LAMS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Fits before and after replacing one training point">
        {e.xs.slice(1).map((x, i) => <circle key={i} cx={sx(x)} cy={sy(e.ys[i + 1])} r={2} fill="var(--text)" fillOpacity={0.5} />)}
        <circle cx={sx(e.xs[0])} cy={sy(e.ys[0])} r={3.5} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        <circle cx={sx(0.2)} cy={sy(3)} r={3.5} fill="var(--code-function)" />
        <path d={line(e.g)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={line(e.g2)} fill="none" stroke="var(--code-function)" strokeWidth={2} strokeDasharray="5 3" />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> fit on S</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> fit after replacing the ringed point by the filled outlier</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        largest change {e.change.toFixed(3)}; train error {e.train.toFixed(3)}, test error {e.test.toFixed(3)}; change at m = 40, 160, 640: {decay.map((v) => v.toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Forty noisy points, and the same data with one point swapped for an outlier. With almost no regularisation the fit
        chases the outlier and moves by 0.859; with λ = 0.1 it moves by only 0.292, at the price of fitting the data less
        closely. For fixed λ the change shrinks roughly like 1/m as more points dilute the replaced one: at λ = 0.001 it
        falls from 0.652 to 0.033 as m grows sixteenfold.
      </figcaption>
    </figure>
  );
}
