"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 40, NS = 20;

function problem() {
  const r = rand(23);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const wStar = new Array<number>(D).fill(0);
  wStar[4] = 1.5; wStar[17] = -1; wStar[31] = 2;
  const X = Array.from({ length: NS }, () => Array.from({ length: D }, normal));
  const y = X.map((x) => x.reduce((s, v, j) => s + v * wStar[j], 0));
  return { wStar, X, y };
}
const { wStar, X, y } = problem();

/** Gradient descent on w = u² − v² from u = v = α, for the underdetermined regression Xw = y. */
export function trainDiag(alpha: number, steps = 30000) {
  const lr = 0.01 / Math.max(1, alpha * alpha);
  const u = new Array<number>(D).fill(alpha), v = new Array<number>(D).fill(alpha);
  const g = new Array<number>(D);
  for (let t = 0; t < steps; t++) {
    g.fill(0);
    for (let i = 0; i < NS; i++) {
      const x = X[i];
      let p = 0;
      for (let j = 0; j < D; j++) p += (u[j] * u[j] - v[j] * v[j]) * x[j];
      const res = (p - y[i]) / NS;
      for (let j = 0; j < D; j++) g[j] += res * x[j];
    }
    for (let j = 0; j < D; j++) {
      u[j] -= lr * 2 * u[j] * g[j];
      v[j] += lr * 2 * v[j] * g[j];
    }
  }
  return u.map((a, j) => a * a - v[j] * v[j]);
}

/** Minimum ℓ2-norm interpolant Xᵀ(XXᵀ)⁻¹y, the large-initialisation limit. */
export function minL2() {
  const G = X.map((a) => X.map((b) => a.reduce((s, v, j) => s + v * b[j], 0)));
  const M = G.map((row, i) => [...row, y[i]]);
  for (let i = 0; i < NS; i++) for (let k = i + 1; k < NS; k++) {
    const f = M[k][i] / M[i][i];
    for (let c = i; c <= NS; c++) M[k][c] -= f * M[i][c];
  }
  const c = new Array<number>(NS).fill(0);
  for (let i = NS - 1; i >= 0; i--) {
    let s = M[i][NS];
    for (let k = i + 1; k < NS; k++) s -= M[i][k] * c[k];
    c[i] = s / M[i][i];
  }
  return Array.from({ length: D }, (_, j) => X.reduce((s, x, i) => s + x[j] * c[i], 0));
}

export function DiagNetBiasViz() {
  const [alpha, setAlpha] = useState(0.01);
  const w = useMemo(() => trainDiag(alpha), [alpha]);
  const l2 = useMemo(() => minL2(), []);
  const err = w.reduce((s, v, j) => s + (v - wStar[j]) ** 2, 0);
  const errL2 = l2.reduce((s, v, j) => s + (v - wStar[j]) ** 2, 0);
  const l1 = w.reduce((s, v) => s + Math.abs(v), 0);
  const big = w.filter((v) => Math.abs(v) > 0.05).length;
  const W = 330, H = 150, X0 = 10, PW = 310, YM = 72, YS = 28;
  const bw = PW / D;
  const py = (v: number) => YM - Math.max(-2.4, Math.min(2.4, v)) * YS;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Initial scale alpha">
          {[0.01, 0.1, 0.5, 2].map((a) => (
            <button key={a} className="seg" aria-pressed={alpha === a} onClick={() => setAlpha(a)}>α = {a}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Learned weights of a diagonal linear network compared with the sparse truth">
        <line x1={X0} x2={X0 + PW} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        {w.map((v, j) => (
          <rect key={j} x={X0 + j * bw + 1} y={Math.min(py(v), py(0))} width={bw - 2} height={Math.abs(py(v) - py(0))} fill="var(--code-function)" opacity={0.8} />
        ))}
        {wStar.map((v, j) => (v ? <rect key={j} x={X0 + j * bw + 0.5} y={Math.min(py(v), py(0))} width={bw - 1} height={Math.abs(py(v) - py(0))} fill="none" stroke="var(--accent)" strokeWidth={1.5} /> : null))}
        {l2.map((v, j) => <circle key={j} cx={X0 + (j + 0.5) * bw} cy={py(v)} r={1.8} fill="var(--text-muted)" />)}
        <text x={X0} y={H - 2} className="viz-label">bars: learned w; outlines: true w*; dots: minimum ℓ2</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        α = {alpha}: ‖w − w*‖² = {err.toFixed(3)} (minimum ℓ2: {errL2.toFixed(3)}), ‖w‖₁ = {l1.toFixed(3)}, {big} weights above 0.05
      </div>
      <figcaption className="viz-caption">
        Twenty noiseless measurements of a 40-dimensional vector with three non-zero entries. Every run fits the data
        exactly, but the network w = u² − v² trained by gradient descent from u = v = α picks different interpolants. From a
        tiny α it nearly recovers the sparse truth, as minimum ℓ1 recovery would; from a large α it approaches the dense minimum ℓ2
        interpolant, the kernel regime. Nothing in the loss asks for sparsity: the initialisation scale decides.
      </figcaption>
    </figure>
  );
}
