"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const GRID = Array.from({ length: 161 }, (_, i) => -4 + i / 20);
const kappa = (d: number) => Math.exp(-(d * d) / 2);
export const DS = [10, 100, 1000];

/** Random Fourier features for the Gaussian kernel with σ = 1: w ~ N(0, 1), b ~ U[0, 2π). Returns x ↦ z(0)·z(x). */
export function estimate(D: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const feats = Array.from({ length: D }, () => [nrm(), 2 * Math.PI * r()]);
  const est = (x: number) => feats.reduce((s, [w, b]) => s + 2 * Math.cos(b) * Math.cos(w * x + b), 0) / D;
  const err = Math.max(...GRID.map((x) => Math.abs(est(x) - kappa(x))));
  return { est, err };
}

/** Largest error on the grid, averaged over 20 independent draws. */
export function meanErr(D: number) {
  let s = 0;
  for (let seed = 1; seed <= 20; seed++) s += estimate(D, 100 + seed).err;
  return s / 20;
}

export function RandomFeaturesViz() {
  const [di, setDi] = useState(0);
  const e = useMemo(() => estimate(DS[di], 7), [di]);
  const avg = useMemo(() => DS.map(meanErr), []);
  const W = 330, H = 160, X0 = 10, PW = 310, Y0 = 8, PH = 140, YL = -0.5, YH = 1.3;
  const sx = (x: number) => X0 + ((x + 4) / 8) * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  const line = (g: (x: number) => number) => GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">features D</span>
        <div className="segmented" role="group" aria-label="Number of random features">
          {DS.map((d, i) => <button key={d} type="button" className="seg" aria-pressed={di === i} onClick={() => setDi(i)}>{d}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The Gaussian kernel and its random feature estimate">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <path d={line(kappa)} fill="none" stroke="var(--text)" strokeWidth={1.2} strokeDasharray="4 3" />
        <path d={line(e.est)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span>┅ k(0, x) = exp(−x²/2)</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> estimate z(0)·z(x)</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        largest error {e.err.toFixed(3)}; averaged over 20 draws at D = 10, 100, 1000: {avg.map((v) => v.toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        The Gaussian kernel (dashed) against the inner product of two random feature vectors, one draw for each D. Ten
        cosines give a rough sketch that is off by 0.966 somewhere on the interval; a thousand follow the kernel to within
        0.034. Averaged over 20 draws the largest error falls from 0.525 to 0.169 to 0.052: each tenfold increase in D
        divides it by about √10, the Monte Carlo rate.
      </figcaption>
    </figure>
  );
}
