"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const F = 40, LAMBDA = 0.03, NOISE = 0.15;
const f = (x: number) => Math.sin(1.5 * x);

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

/** Shared noisy training data with a gap between -0.5 and 1. */
export function data(seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const xs = Array.from({ length: 24 }, () => (r() < 0.5 ? -3 + 2.5 * r() : 1 + 2 * r()));
  return { xs, ys: xs.map((x) => f(x) + NOISE * nrm()) };
}

/** One member: ridge regression on random cosine features; only the random draw (its "initialisation") differs. */
export function member(xs: number[], ys: number[], seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const w = Array.from({ length: F }, () => 2.5 * nrm()), b = Array.from({ length: F }, () => 2 * Math.PI * r());
  const phi = (x: number) => w.map((wi, i) => Math.cos(wi * x + b[i]));
  const A = Array.from({ length: F }, (_, i) => Array.from({ length: F }, (_, j) => (i === j ? LAMBDA : 0)));
  const rhs = new Array(F).fill(0);
  xs.forEach((x, k) => { const p = phi(x); for (let i = 0; i < F; i++) { rhs[i] += p[i] * ys[k]; for (let j = 0; j < F; j++) A[i][j] += p[i] * p[j]; } });
  const c = solve(A, rhs);
  return (x: number) => phi(x).reduce((a, v, i) => a + v * c[i], 0);
}

const TEST = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1);

/** Ambiguity decomposition on the test grid: ensemble error = mean member error - diversity. */
export function stats(m: number) {
  const { xs, ys } = data(3);
  const members = Array.from({ length: m }, (_, k) => member(xs, ys, 100 + k));
  let ens = 0, avg = 0, div = 0;
  for (const x of TEST) {
    const p = members.map((g) => g(x)), mean = p.reduce((a, v) => a + v, 0) / m;
    ens += (mean - f(x)) ** 2; avg += p.reduce((a, v) => a + (v - f(x)) ** 2, 0) / m; div += p.reduce((a, v) => a + (v - mean) ** 2, 0) / m;
  }
  return { xs, ys, members, ens: ens / TEST.length, avg: avg / TEST.length, div: div / TEST.length };
}

const MS = [1, 3, 10];

export function EnsembleViz() {
  const [mi, setMi] = useState(2);
  const s = useMemo(() => stats(MS[mi]), [mi]);
  const grid = useMemo(() => Array.from({ length: 121 }, (_, i) => -4 + (i * 8) / 120), []);
  const W = 330, H = 190, X0 = 10, PW = W - 20, Y0 = 8, PH = H - Y0 - 26, YL = -2.6, YH = 2.6;
  const sx = (x: number) => X0 + ((x + 4) / 8) * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  const line = (g: (x: number) => number) => grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`).join(" ");
  const mean = (x: number) => s.members.reduce((a, g) => a + g(x), 0) / s.members.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">members</span>
        <div className="segmented" role="group" aria-label="Number of ensemble members">
          {MS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Ensemble members and their average">
        <rect x={sx(-0.5)} y={Y0} width={sx(1) - sx(-0.5)} height={PH} fill="var(--text)" fillOpacity={0.05} />
        <path d={line(f)} fill="none" stroke="var(--text)" strokeDasharray="4 3" strokeWidth={1.2} />
        {s.members.map((g, k) => <path key={k} d={line(g)} fill="none" stroke="var(--code-function)" strokeOpacity={0.45} strokeWidth={1} />)}
        <path d={line(mean)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        {s.xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(s.ys[i])} r={1.8} fill="var(--text)" fillOpacity={0.6} />)}
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>━</span> members</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> ensemble average</span>
        <span>- - - true function</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        mean member error {s.avg.toFixed(3)} − diversity {s.div.toFixed(3)} = ensemble error {s.ens.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Each member is fitted to the same 24 points and differs only in its random features, the analogue of a random
        initialisation. The members agree near the data and fan out in the shaded gap and beyond the data at either end. Their disagreement,
        the diversity, is subtracted exactly from their average error: on the test range [−3, 3], ten members bring the squared
        error from 0.174 for a typical member to 0.026 for the average.
      </figcaption>
    </figure>
  );
}
