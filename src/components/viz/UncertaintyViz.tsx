"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const CENTRES = Array.from({ length: 17 }, (_, i) => -4 + i * 0.5), WIDTH = 0.7, ALPHA = 1;
const feats = (x: number) => [1, ...CENTRES.map((c) => Math.exp(-((x - c) ** 2) / (2 * WIDTH * WIDTH)))];
/** Known heteroscedastic noise: small on the left, large on the right. */
export const noiseSd = (x: number) => 0.05 + 0.35 / (1 + Math.exp(-2 * x));
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

/** Bayesian linear regression on radial features with the known noise; returns the predictive mean and the two variances. */
export function fit(n: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const xs = Array.from({ length: n }, () => (r() < 0.5 ? -3 + 2.5 * r() : 1 + 2 * r()));
  const ys = xs.map((x) => f(x) + noiseSd(x) * nrm());
  const D = CENTRES.length + 1;
  const A = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => (i === j ? ALPHA : 0)));
  const b = new Array(D).fill(0);
  xs.forEach((x, k) => { const p = feats(x), w = 1 / noiseSd(x) ** 2; for (let i = 0; i < D; i++) { b[i] += w * p[i] * ys[k]; for (let j = 0; j < D; j++) A[i][j] += w * p[i] * p[j]; } });
  const m = solve(A, b);
  const pred = (x: number) => { const p = feats(x); return { mu: p.reduce((a, v, i) => a + v * m[i], 0), epi: p.reduce((a, v, i) => a + v * solve(A, p)[i], 0), ale: noiseSd(x) ** 2 }; };
  return { xs, ys, pred };
}

const NS = [10, 40, 160], PROBES = [-2, 0.4, 2];

export function UncertaintyViz() {
  const [ni, setNi] = useState(1);
  const { xs, ys, pred } = useMemo(() => fit(NS[ni], 6), [ni]);
  const grid = useMemo(() => Array.from({ length: 121 }, (_, i) => -4 + (i * 8) / 120).map((x) => ({ x, ...pred(x) })), [pred]);
  const W = 330, H = 190, X0 = 10, PW = W - 20, Y0 = 8, PH = H - Y0 - 26, YL = -2.6, YH = 2.6;
  const sx = (x: number) => X0 + ((x + 4) / 8) * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  const band = (k: (g: (typeof grid)[number]) => number) => grid.map((g, i) => `${i ? "L" : "M"}${sx(g.x).toFixed(1)},${sy(g.mu + 2 * Math.sqrt(k(g))).toFixed(1)}`).join(" ") + " " + [...grid].reverse().map((g) => `L${sx(g.x).toFixed(1)},${sy(g.mu - 2 * Math.sqrt(k(g))).toFixed(1)}`).join(" ") + "Z";
  const probe = PROBES.map((x) => pred(x));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">training points</span>
        <div className="segmented" role="group" aria-label="Number of training points">
          {NS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Predictive mean with aleatoric and epistemic bands">
        <path d={band((g) => g.ale + g.epi)} fill="var(--accent)" fillOpacity={0.18} />
        <path d={band((g) => g.ale)} fill="var(--code-function)" fillOpacity={0.3} />
        <path d={grid.map((g, i) => `${i ? "L" : "M"}${sx(g.x).toFixed(1)},${sy(g.mu).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={1.8} fill="var(--text)" fillOpacity={0.6} />)}
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>■</span> ±2 sd of noise (aleatoric)</span>
        <span><span style={{ color: "var(--accent)", opacity: 0.5 }}>■</span> ±2 sd including model uncertainty (epistemic)</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {PROBES.map((x, i) => `x = ${x}: aleatoric ${probe[i].ale.toFixed(3)}, epistemic ${probe[i].epi.toFixed(3)}`).join("; ")}
      </div>
      <figcaption className="viz-caption">
        A Bayesian regression with a known noise level that grows from left to right. The inner band is the noise itself,
        which no amount of data reduces. The outer band adds the uncertainty about the function, which is large in the gap
        between 0 and 1 and beyond the data, and shrinks everywhere data accumulate: going from 10 to 160 points cuts the
        epistemic variance at x = 2 from 0.101 to 0.006, while the aleatoric variance there stays at 0.155.
      </figcaption>
    </figure>
  );
}
