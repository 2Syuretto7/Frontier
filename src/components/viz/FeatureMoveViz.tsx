"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const M = 100;
const STEPS = 400;
const U = [Math.cos(0.6), Math.sin(0.6)];

/**
 * Train f(x) = n^(-γ) Σ v_j relu(w_j·x), minus its initial function, on y = |u·x| with x ~ N(0, I₂),
 * learning rate η n^(2γ-1). γ = 1/2 is the NTK parametrisation, γ = 1 the mean-field one.
 */
export function trainFeatures(n: number, gamma: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const X = Array.from({ length: M }, () => [normal(), normal()]);
  const Y = X.map((x) => Math.abs(x[0] * U[0] + x[1] * U[1]));
  const v = Array.from({ length: n }, normal), w = Array.from({ length: n }, () => [normal(), normal()]);
  const v0 = v.slice(), w0 = w.map((a) => a.slice());
  const s = n ** -gamma, lr = (gamma === 1 ? 1.5 : 0.5) * n ** (2 * gamma - 1);
  const f = (V: number[], Wt: number[][], x: number[]) => {
    let a = 0;
    for (let j = 0; j < n; j++) a += V[j] * Math.max(0, Wt[j][0] * x[0] + Wt[j][1] * x[1]);
    return a * s;
  };
  const F0 = X.map((x) => f(v0, w0, x));
  let loss = 0;
  for (let t = 0; t <= STEPS; t++) {
    const res = X.map((x, i) => f(v, w, x) - F0[i] - Y[i]);
    loss = res.reduce((a, b) => a + b * b, 0) / (2 * M);
    if (t === STEPS) break;
    const gv = new Array<number>(n).fill(0), gw = Array.from({ length: n }, () => [0, 0]);
    for (let i = 0; i < M; i++) for (let j = 0; j < n; j++) {
      const u = w[j][0] * X[i][0] + w[j][1] * X[i][1];
      if (u <= 0) continue;
      gv[j] += res[i] * u;
      gw[j][0] += res[i] * v[j] * X[i][0];
      gw[j][1] += res[i] * v[j] * X[i][1];
    }
    for (let j = 0; j < n; j++) {
      v[j] -= (lr * s * gv[j]) / M;
      w[j][0] -= (lr * s * gw[j][0]) / M;
      w[j][1] -= (lr * s * gw[j][1]) / M;
    }
  }
  let dw = 0, wn = 0, a0 = 0, z0 = 0, a1 = 0, z1 = 0;
  const cosU = (W: number[]) => Math.abs(W[0] * U[0] + W[1] * U[1]) / Math.hypot(W[0], W[1]);
  for (let j = 0; j < n; j++) {
    dw += (w[j][0] - w0[j][0]) ** 2 + (w[j][1] - w0[j][1]) ** 2;
    wn += w0[j][0] ** 2 + w0[j][1] ** 2;
    const m0 = Math.abs(v0[j]) * Math.hypot(w0[j][0], w0[j][1]), m1 = Math.abs(v[j]) * Math.hypot(w[j][0], w[j][1]);
    a0 += m0 * cosU(w0[j]); z0 += m0; a1 += m1 * cosU(w[j]); z1 += m1;
  }
  return { w0, w, v, loss, move: Math.sqrt(dw / wn), align0: a0 / z0, align1: a1 / z1 };
}

export function FeatureMoveViz() {
  const [gamma, setGamma] = useState(0.5);
  const [n, setN] = useState(40);
  const [seed, setSeed] = useState(1);
  const res = useMemo(() => trainFeatures(n, gamma, seed), [n, gamma, seed]);
  const W = 330, H = 200, CX = 165, CY = 96, SC = 30;
  const px = (p: number[]) => [CX + Math.max(-5, Math.min(5, p[0])) * SC, CY - Math.max(-3, Math.min(3, p[1])) * SC];
  const vmax = Math.max(...res.v.map(Math.abs));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Parametrisation">
          <button className="seg" aria-pressed={gamma === 0.5} onClick={() => setGamma(0.5)}>NTK, 1/√n</button>
          <button className="seg" aria-pressed={gamma === 1} onClick={() => setGamma(1)}>mean field, 1/n</button>
        </div>
        <div className="segmented" role="group" aria-label="Width">
          {[40, 320].map((m) => (
            <button key={m} className="seg" aria-pressed={n === m} onClick={() => setN(m)}>n = {m}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="First-layer weight vectors before and after training, with the target direction">
        <line x1={CX - 3.3 * SC * U[0] * 1.6} y1={CY + 3.3 * SC * U[1] * 1.6} x2={CX + 3.3 * SC * U[0] * 1.6} y2={CY - 3.3 * SC * U[1] * 1.6} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="6 4" />
        <line x1={0} x2={W} y1={CY} y2={CY} stroke="var(--border)" />
        <line x1={CX} x2={CX} y1={0} y2={H - 12} stroke="var(--border)" />
        {res.w.map((p, j) => {
          const [x0, y0] = px(res.w0[j]), [x1, y1] = px(p);
          const o = 0.25 + (0.7 * Math.abs(res.v[j])) / vmax;
          return (
            <g key={j}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--text-muted)" strokeWidth={0.7} opacity={0.6} />
              <circle cx={x0} cy={y0} r={1.6} fill="var(--text-muted)" opacity={0.5} />
              <circle cx={x1} cy={y1} r={2.6} fill="var(--code-function)" opacity={o} />
            </g>
          );
        })}
        <text x={4} y={H - 2} className="viz-label">grey: w at initialisation; blue: after training; dashed: ±u</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        train loss {res.loss.toFixed(4)}; first-layer weights moved {(100 * res.move).toFixed(1)}%; alignment with ±u {res.align0.toFixed(3)} → {res.align1.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Each dot is one hidden unit&apos;s weight vector in the plane, trained for {STEPS} gradient steps to fit y = |u·x|, which is
        exactly two ReLU units pointing along ±u. Both parametrisations reach a small training loss. Under the NTK scaling the
        weights hardly move, less as n grows, and the fit is made from the random features they started with. Under the
        mean-field scaling the units travel and the ones that matter, drawn darker, swing round to ±u: the network has
        learned the feature. Alignment is the |v|·|w|-weighted mean of |cos| between each unit and u.
      </figcaption>
    </figure>
  );
}
