"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const H = 32, T = 60;
const GAINS = [0.5, 0.9, 1.5, 3];
const LMIN = -12, LMAX = 6;

/**
 * Run h_t = tanh(g W h_{t-1} + x_t) for T steps with W ~ N(0, 1/H), then backpropagate a random unit gradient
 * from h_T. Returns log10 of the gradient norm reaching h_{T-k}, for k = 0..T, averaged over a few seeds.
 */
export function lagCurve(gain: number, seeds = 4) {
  const acc = new Array(T + 1).fill(0);
  for (let s = 0; s < seeds; s++) {
    const z = makeNormal(makeRng(100 * s + 7));
    const W = Array.from({ length: H }, () => Array.from({ length: H }, () => (gain * z()) / Math.sqrt(H)));
    const hs = [new Array(H).fill(0)];
    for (let t = 0; t < T; t++) {
      const h = hs[t];
      hs.push(W.map((row, i) => Math.tanh(row.reduce((a, w, j) => a + w * h[j], 0) + 0.5 * z())));
    }
    let d = Array.from({ length: H }, z);
    const n0 = Math.hypot(...d);
    d = d.map((v) => v / n0);
    for (let k = 1; k <= T; k++) {
      const h = hs[T - k + 1], da = d.map((v, i) => v * (1 - h[i] * h[i]));
      d = Array.from({ length: H }, (_, j) => da.reduce((a, v, i) => a + v * W[i][j], 0));
      acc[k] += Math.log10(Math.max(Math.hypot(...d), 1e-300));
    }
  }
  return acc.map((v) => v / seeds);
}

export function BpttLagViz() {
  const [gi, setGi] = useState(1);
  const [curves, setCurves] = useState<number[][] | null>(null);
  useEffect(() => setCurves(GAINS.map((g) => lagCurve(g))), []);
  const W = 300, Hh = 200, X0 = 30, PW = W - 38, PH = 172;
  const sx = (k: number) => X0 + (k / T) * PW, sy = (v: number) => 8 + ((LMAX - Math.max(LMIN, Math.min(LMAX, v))) / (LMAX - LMIN)) * PH;
  const c = curves?.[gi];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {GAINS.map((g, i) => (
          <button key={g} type="button" className="seg" aria-pressed={i === gi} onClick={() => setGi(i)}>gain {g}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${Hh + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Size of the backpropagated gradient against how many steps back it has travelled">
        <line x1={X0} y1={sy(LMIN)} x2={X0 + PW} y2={sy(LMIN)} stroke="var(--border)" />
        <line x1={X0} y1={sy(LMIN)} x2={X0} y2={sy(LMAX)} stroke="var(--border)" />
        {curves?.map((cv, i) => i !== gi && (
          <polyline key={i} fill="none" stroke="var(--text-muted)" strokeWidth={1} points={cv.map((v, k) => `${sx(k)},${sy(v)}`).join(" ")} />
        ))}
        {c && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={c.map((v, k) => `${sx(k)},${sy(v)}`).join(" ")} />}
        {[0, 20, 40, 60].map((k) => (
          <text key={k} x={sx(k)} y={Hh + 12} textAnchor="middle" className="viz-label">{k}</text>
        ))}
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" strokeDasharray="2 3" />
        {[6, 0, -6, -12].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v === 0 ? "1" : `1e${v}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {c ? `gradient norm 10 steps back: ${(10 ** c[10]).toExponential(1)}; 40 steps back: ${(10 ** c[40]).toExponential(1)}` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A 32-unit tanh RNN with recurrent weights of the chosen gain runs for 60 steps on random input. A unit gradient at the
        last hidden state is sent backwards through time; the curve shows its size (log scale) after k steps. Each step
        multiplies by the transposed recurrent matrix and the tanh derivatives. Below a gain of about 1 it shrinks
        geometrically, so distant steps contribute almost nothing to learning; at gain 3 the network is chaotic and the
        gradient explodes. Only near the boundary does it survive dozens of steps.
      </figcaption>
    </figure>
  );
}
