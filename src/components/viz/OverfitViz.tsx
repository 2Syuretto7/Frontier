"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";

const V: View = { xmin: -1.1, xmax: 1.1, ymin: -1.6, ymax: 1.8, w: 440, h: 300 };
const truth = (x: number) => Math.sin(2.4 * x) * 0.9 + 0.2;
// Fixed noisy samples, so every reader sees the same data.
const TRAIN_X = [-0.95, -0.78, -0.6, -0.41, -0.22, -0.02, 0.19, 0.38, 0.6, 0.83];
const TRAIN_N = [0.18, -0.22, 0.25, -0.12, 0.2, -0.25, 0.15, 0.24, -0.2, 0.1];
const TEST_X = [-0.87, -0.7, -0.5, -0.31, -0.12, 0.09, 0.29, 0.49, 0.71, 0.95];
const TEST_N = [-0.15, 0.2, -0.1, 0.18, -0.2, 0.12, -0.18, 0.1, 0.22, -0.12];
const TRAIN = TRAIN_X.map((x, i) => ({ x, y: truth(x) + TRAIN_N[i] }));
const TEST = TEST_X.map((x, i) => ({ x, y: truth(x) + TEST_N[i] }));

/** Least-squares polynomial of the given degree, by the normal equations and Gaussian elimination. */
function fit(deg: number): number[] {
  const n = deg + 1;
  const A = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (const p of TRAIN) {
    const pw = Array.from({ length: 2 * n }, (_, k) => p.x ** k);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += pw[i + j];
      A[i][n] += pw[i] * p.y;
    }
  }
  for (let i = 0; i < n; i++) A[i][i] += 1e-9; // a whisker of ridge keeps the solve stable at degree 9
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[n] / row[i]);
}

/** Fit polynomials of growing degree to ten points. Training error always falls; error on new points falls, then climbs. */
export function OverfitViz() {
  const [deg, setDeg] = useState(1);
  const coef = fit(deg);
  const f = (x: number) => coef.reduce((s, a, k) => s + a * x ** k, 0);
  const err = (pts: { x: number; y: number }[]) => pts.reduce((s, p) => s + (f(p.x) - p.y) ** 2, 0) / pts.length;
  const tr = err(TRAIN), te = err(TEST);
  const { X, Y } = scales(V);
  const verdict = deg <= 2 ? "Too simple: it misses the shape, so both errors are high." : deg <= 5 ? "About right: it follows the shape without chasing the noise." : "Too flexible: it bends to pass near every training point, noise and all, and does worse on new points.";

  return (
    <figure className="viz">
      <Axes v={V} label={`Polynomial of degree ${deg} fitted to ten training points`}>
        <path d={curvePath(V, f, 300)} className="plot-curve" />
        {TEST.map((p, i) => <circle key={`t${i}`} cx={X(p.x)} cy={Y(p.y)} r={4.5} className="plot-point" style={{ fill: "var(--surface)", stroke: "var(--text-muted)" }} />)}
        {TRAIN.map((p, i) => <circle key={`r${i}`} cx={X(p.x)} cy={Y(p.y)} r={5} className="plot-hot" />)}
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>Degree of the polynomial <span className="mono">{deg}</span></span>
          <input type="range" min={0} max={9} step={1} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Filled dots are the training data; hollow dots are new data the model never saw. Training error{" "}
        <span className="mono">{tr.toFixed(3)}</span>, error on new data <span className="mono">{te.toFixed(3)}</span>. {verdict}
      </figcaption>
    </figure>
  );
}
