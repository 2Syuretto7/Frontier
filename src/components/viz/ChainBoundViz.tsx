"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 16;
const EPS = Array.from({ length: 9 }, (_, i) => 0.01 * 100 ** (i / 8));

function orthogonal(normal: () => number) {
  const Q: number[][] = [];
  for (let k = 0; k < N; k++) {
    const v = Array.from({ length: N }, () => normal());
    for (const q of Q) {
      const d = q.reduce((s, x, i) => s + x * v[i], 0);
      for (let i = 0; i < N; i++) v[i] -= d * q[i];
    }
    const n = Math.hypot(...v);
    Q.push(v.map((x) => x / n));
  }
  return Q;
}

const mul = (A: number[][], x: number[]) => A.map((row) => row.reduce((s, a, j) => s + a * x[j], 0));
const rms = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length);

/** RMS change in the output of a depth-L chain of orthogonal layers when each layer moves by ε times a random orthogonal matrix. */
export function chainChanges(L: number) {
  const normal = makeNormal(makeRng(9));
  const Ws = Array.from({ length: L }, () => orthogonal(normal));
  const Ds = Array.from({ length: L }, () => orthogonal(normal));
  const x = Array.from({ length: N }, () => normal());
  let old = x;
  for (const W of Ws) old = mul(W, old);
  return EPS.map((e) => {
    let y = x;
    Ws.forEach((W, l) => { y = W.map((row, i) => row.reduce((s, a, j) => s + (a + e * Ds[l][i][j]) * y[j], 0)); });
    return rms(y.map((v, i) => v - old[i])) / rms(x);
  });
}

export function ChainBoundViz() {
  const [L, setL] = useState(4);
  const meas = useMemo(() => chainChanges(L), [L]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (e: number) => X0 + ((Math.log10(e) + 2) / 2) * PW;
  const sy = (v: number) => 8 + ((3 - Math.max(-3, Math.min(3, Math.log10(v)))) / 6) * PH;
  const grid = Array.from({ length: 41 }, (_, i) => 0.01 * 100 ** (i / 40));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">depth L</span>
        {[2, 4, 8].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={L === v} onClick={() => setL(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Output change of a deep chain against the per-layer perturbation, with the product bound">
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={grid.map((e) => `${sx(e)},${sy((1 + e) ** L - 1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" points={grid.map((e) => `${sx(e)},${sy(L * e)}`).join(" ")} />
        {meas.map((v, i) => (
          <circle key={i} cx={sx(EPS[i])} cy={sy(v)} r={3.5} fill="var(--accent)" />
        ))}
        {[0.01, 0.1, 1].map((e) => (
          <text key={e} x={sx(e)} y={H + 12} textAnchor="middle" className="viz-label">{e}</text>
        ))}
        {[0.001, 1, 1000].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`ε = ${EPS[4].toFixed(2)}: measured ${meas[4].toFixed(3)}, Lε = ${(L * EPS[4]).toFixed(3)}, bound ${((1 + EPS[4]) ** L - 1).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A chain of L orthogonal 16 × 16 layers, each perturbed by ε times a random orthogonal matrix, so every layer moves
        by exactly ε in the RMS-to-RMS operator norm. Dots are the measured relative change of the output; the red curve
        is the bound (1 + ε)^L − 1, attained when every perturbation is aligned; the dashed line is its first-order part
        Lε. Random perturbations partly cancel, so the measured change sits below Lε for small ε and far below the bound for large ε.
      </figcaption>
    </figure>
  );
}
