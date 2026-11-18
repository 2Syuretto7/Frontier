"use client";

import { useEffect, useState } from "react";

const D = 5, NMAX = 24, TASKS = 400, SIGMA = 0.3;

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/** Mean squared error against the true x_q·w, over random tasks, for each number of in-context examples. */
export function iclCurves() {
  const g = gaussian(5);
  const gd = new Array(NMAX).fill(0), ridge = new Array(NMAX).fill(0);
  for (let t = 0; t < TASKS; t++) {
    const w = Array.from({ length: D }, g), xq = Array.from({ length: D }, g);
    const X: number[][] = [], y: number[] = [];
    const truth = xq.reduce((s, v, i) => s + v * w[i], 0);
    for (let n = 1; n <= NMAX; n++) {
      const x = Array.from({ length: D }, g);
      X.push(x);
      y.push(x.reduce((s, v, i) => s + v * w[i], 0) + SIGMA * g());
      const Xty = Array.from({ length: D }, (_, j) => X.reduce((s, r, i) => s + r[j] * y[i], 0));
      const lr = 1 / (n + D + 1);
      const pg = lr * Xty.reduce((s, v, j) => s + v * xq[j], 0);
      const A = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? SIGMA * SIGMA : 0)));
      const wr = solve(A, Xty);
      const pr = wr.reduce((s, v, j) => s + v * xq[j], 0);
      gd[n - 1] += (pg - truth) ** 2 / TASKS;
      ridge[n - 1] += (pr - truth) ** 2 / TASKS;
    }
  }
  return { gd, ridge };
}

export function IclRegressionViz() {
  const [curves, setCurves] = useState<{ gd: number[]; ridge: number[] } | null>(null);
  const [n, setN] = useState(10);
  useEffect(() => {
    const id = setTimeout(() => setCurves(iclCurves()), 0);
    return () => clearTimeout(id);
  }, []);
  const W = 320, H = 190, X0 = 34, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 30, top = 6;
  const sx = (k: number) => X0 + (k / NMAX) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, top) / top) * PH;
  const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="icl-n">examples in the prompt: {n}</label>
        <input id="icl-n" type="range" min={1} max={NMAX} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Prediction error against the number of in-context examples">
        <line x1={X0} x2={W - 10} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 2, 4, 6].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[1, 6, 12, 18, 24].map((k) => (
          <text key={k} x={sx(k)} y={H - 10} textAnchor="middle" className="viz-label">{k}</text>
        ))}
        <line x1={X0} x2={W - 10} y1={sy(D)} y2={sy(D)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <text x={W - 12} y={sy(D) - 4} textAnchor="end" className="viz-label">predict 0</text>
        {curves && <path d={path(curves.gd)} fill="none" stroke="var(--accent)" strokeWidth={2} />}
        {curves && <path d={path(curves.ridge)} fill="none" stroke="var(--success)" strokeWidth={2} />}
        <line x1={sx(n)} x2={sx(n)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {curves ? `n = ${n}: one attention layer (one GD step) ${curves.gd[n - 1].toFixed(2)}, Bayes-optimal ridge ${curves.ridge[n - 1].toFixed(3)}` : "computing…"}
      </div>
      <figcaption className="viz-caption">
        Each prompt holds n pairs (x, y) with y = w·x plus noise, for a fresh random w in 5 dimensions, and then a query x.
        The blue curve is the error of the prediction that one linear attention layer computes with the weights of the
        theorem, which equals one step of gradient descent from w = 0. It falls as examples arrive, though slowly. The green
        curve is the best possible predictor, ridge regression with the true prior, which falls steeply until n passes the
        dimension and stays small after. Transformers trained on many such prompts have been found to come close to the
        green curve, as if their layers ran a better algorithm than a single step.
      </figcaption>
    </figure>
  );
}
