"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 10, FLIP = 0.1, DELTA = 0.05;
export const MS = [100, 1000, 10000];
export const SS = Array.from({ length: 20 }, (_, i) => 10 ** (-0.5 + (2.5 * i) / 19));

const erf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
const kl = (q: number, p: number) => (q > 0 ? q * Math.log(q / p) : 0) + (q < 1 ? (1 - q) * Math.log((1 - q) / (1 - p)) : 0);
function klInv(q: number, c: number) { let lo = q, hi = 1 - 1e-12; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (kl(q, mid) > c) hi = mid; else lo = mid; } return lo; }

/**
 * m points in ℝ¹⁰ labelled by a fixed direction with 10% of labels flipped. Posterior N(w, σ²I) with ‖w‖/σ = s around the
 * normalised mean of yᵢxᵢ, prior N(0, σ²I), so KL = s²/2. The bound inverts kl with δ/20 for each of the 20 values of s.
 */
export function pacBayes(m: number) {
  const r = rand(77);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const u = Array.from({ length: D }, (_, j) => (j === 0 ? 1 : 0));
  const X = Array.from({ length: m }, () => Array.from({ length: D }, nrm));
  const y = X.map((x) => (x[0] > 0 ? 1 : -1) * (r() < FLIP ? -1 : 1));
  const w = Array.from({ length: D }, (_, j) => X.reduce((s, x, i) => s + y[i] * x[j], 0));
  const nw = Math.hypot(...w), wh = w.map((v) => v / nw);
  const z = X.map((x, i) => (y[i] * x.reduce((s, v, j) => s + v * wh[j], 0)) / Math.hypot(...x));
  const rows = SS.map((s) => {
    const emp = z.reduce((a, zi) => a + Phi(-s * zi), 0) / m;
    const c = (s * s / 2 + Math.log((2 * Math.sqrt(m) * SS.length) / DELTA)) / m;
    return { s, emp, bound: klInv(emp, c) };
  });
  const best = rows.reduce((a, b) => (b.bound < a.bound ? b : a));
  const train = z.filter((v) => v <= 0).length / m;
  const test = FLIP + (1 - 2 * FLIP) * Math.acos(Math.max(-1, Math.min(1, wh[0] * u[0]))) / Math.PI;
  return { rows, best, train, test };
}

export function PacBayesViz() {
  const [mi, setMi] = useState(1);
  const p = useMemo(() => pacBayes(MS[mi]), [mi]);
  const W = 330, H = 160, X0 = 30, PW = 284, Y0 = 8, PH = 132, YH = 0.6;
  const lx = (s: number) => X0 + ((Math.log10(s) + 0.5) / 2.5) * PW, sy = (v: number) => Y0 + PH - (Math.min(YH, v) / YH) * PH;
  const line = (f: (k: number) => number) => p.rows.map((row, k) => `${k ? "L" : "M"}${lx(row.s).toFixed(1)},${sy(f(k)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">sample size m</span>
        <div className="segmented" role="group" aria-label="Sample size">
          {MS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="PAC-Bayes bound and empirical Gibbs risk against the signal-to-noise ratio of the posterior">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 0.2, 0.4, 0.6].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[1, 10, 100].map((s) => <text key={s} x={lx(s)} y={H - 1} textAnchor="middle" className="viz-label">{s}</text>)}
        <line x1={X0} x2={X0 + PW} y1={sy(p.test)} y2={sy(p.test)} stroke="var(--text)" strokeDasharray="2 3" />
        <path d={line((k) => p.rows[k].emp)} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <path d={line((k) => p.rows[k].bound)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={lx(p.best.s)} cy={sy(p.best.bound)} r={3.5} fill="var(--accent)" />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>━</span> empirical Gibbs risk</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> PAC-Bayes bound</span>
        <span>┈ true risk of the mean classifier</span>
        <span className="viz-label">horizontal axis: ‖w‖/σ</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best bound {p.best.bound.toFixed(3)} at ‖w‖/σ = {p.best.s.toFixed(1)}; training error {p.train.toFixed(3)}; true risk {p.test.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A linear classifier in ten dimensions, with 10% of the labels flipped. The posterior is a Gaussian cloud of
        classifiers around the learnt direction, the prior a cloud of the same width around zero. A wide cloud (small ‖w‖/σ)
        costs little KL but contains many poor classifiers; a narrow one fits well but pays KL = ‖w‖²/2σ². The best trade-off
        gives a bound of 0.527 with 100 examples, 0.305 with 1000 and 0.216 with 10000, where the classifier&apos;s true risk is
        0.110: never vacuous, and tightening as the sample grows.
      </figcaption>
    </figure>
  );
}
