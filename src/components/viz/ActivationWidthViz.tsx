"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const ACTS: { label: string; f: (z: number) => number }[] = [
  { label: "ReLU", f: (z) => Math.max(0, z) },
  { label: "tanh", f: Math.tanh },
  { label: "square", f: (z) => z * z },
];
export const WIDTHS = [2, 4, 8, 16, 32, 64];
export const target = (x: number) => Math.sin(3 * x) + 0.5 * Math.abs(x);
const XS = Array.from({ length: 241 }, (_, i) => -1 + i / 120);

/** Solve (AᵀA + λI) c = Aᵀy by Gaussian elimination. */
function lstsq(A: number[][], y: number[], lam = 1e-9) {
  const k = A[0].length;
  const M = Array.from({ length: k }, (_, i) => Array.from({ length: k + 1 }, (_, j) => {
    if (j === k) return A.reduce((s, r, t) => s + r[i] * y[t], 0);
    return A.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? lam : 0);
  }));
  for (let c = 0; c < k; c++) {
    let p = c;
    for (let r = c + 1; r < k; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < k; r++) {
      if (r === c || M[c][c] === 0) continue;
      const f = M[r][c] / M[c][c];
      for (let j = c; j <= k; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r, i) => (r[i] === 0 ? 0 : r[k] / r[i]));
}

/** Fit a one-hidden-layer network with fixed random inner weights; only the output layer is trained. */
export function fit(act: number, width: number) {
  const g = rand(4242 + width);
  const units = Array.from({ length: width }, () => { const w = (g() * 2 - 1) * 4; return { w, b: (g() * 2 - 1) * Math.abs(w) * 1.1 }; });
  const feat = (x: number) => [1, ...units.map((u) => ACTS[act].f(u.w * x + u.b))];
  const A = XS.map(feat), y = XS.map(target);
  const c = lstsq(A, y);
  const pred = (x: number) => feat(x).reduce((s, v, i) => s + v * c[i], 0);
  const rms = Math.sqrt(XS.reduce((s, x) => s + (pred(x) - target(x)) ** 2, 0) / XS.length);
  return { pred, rms };
}

export function ActivationWidthViz() {
  const [act, setAct] = useState(0);
  const [wi, setWi] = useState(2);
  const r = fit(act, WIDTHS[wi]);
  const W = 330, H = 150, X0 = 26, PW = 296, Y0 = 8, PH = 124, LO = -1.6, HI = 1.6;
  const sx = (x: number) => X0 + ((x + 1) / 2) * PW, sy = (y: number) => Y0 + PH - ((Math.max(LO, Math.min(HI, y)) - LO) / (HI - LO)) * PH;
  const path = (f: (x: number) => number) => XS.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Activation">
          {ACTS.map((a, i) => (
            <button key={a.label} type="button" className="seg" aria-pressed={act === i} onClick={() => setAct(i)}>{a.label}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Width" style={{ flexWrap: "wrap" }}>
          {WIDTHS.map((w, i) => (
            <button key={w} type="button" className="seg" aria-pressed={wi === i} onClick={() => setWi(i)}>{w}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Target function and the best network output for the chosen activation and width">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(0)} x2={sx(0)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[-1, 0, 1].map((v) => <text key={v} x={sx(v)} y={H - 1} textAnchor={v === 1 ? "end" : v === -1 ? "start" : "middle"} className="viz-label">{v}</text>)}
        <path d={path(target)} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={path(r.pred)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {ACTS[act].label}, width {WIDTHS[wi]}: RMS error {r.rms.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        The target sin 3x + |x|/2 (dashed) and the best output layer on top of randomly placed hidden units (solid). With
        ReLU or tanh the error keeps falling as the width grows. With the square activation every network, however wide, is
        a polynomial of degree 2, and the error is the same at every width shown: a polynomial activation is never universal.
      </figcaption>
    </figure>
  );
}
