"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const T = 100, UNITS = 64;
const BIASES = [0, 1, 3, 5];
const LMIN = -12;
const sig = (v: number) => 1 / (1 + Math.exp(-v));

/**
 * Along the cell-state path, d c_T / d c_(T-k) is the product of the last k forget gates, unit by unit.
 * Forget pre-activations are bias + 1.5 * noise. Returns log10 of the mean over units of that product, for k = 0..T.
 */
export function forgetCurve(bias: number, seed = 1) {
  const z = makeNormal(makeRng(seed)), out = new Array(T + 1).fill(0);
  const logs = new Array(UNITS).fill(0);
  for (let k = 1; k <= T; k++) {
    for (let u = 0; u < UNITS; u++) logs[u] += Math.log(sig(bias + 1.5 * z()));
    const m = Math.max(...logs);
    out[k] = (m + Math.log(logs.reduce((a, l) => a + Math.exp(l - m), 0) / UNITS)) / Math.LN10;
  }
  return out;
}

/** The same quantity for a 64-unit tanh RNN with recurrent gain 0.9, for comparison. */
export function rnnCurve(seed = 2) {
  const z = makeNormal(makeRng(seed)), H = UNITS;
  const W = Array.from({ length: H }, () => Array.from({ length: H }, () => (0.9 * z()) / Math.sqrt(H)));
  const hs = [new Array(H).fill(0)];
  for (let t = 0; t < T; t++) hs.push(W.map((row) => Math.tanh(row.reduce((a, w, j) => a + w * hs[t][j], 0) + 0.5 * z())));
  let d = Array.from({ length: H }, z);
  const n0 = Math.hypot(...d), out = [0];
  d = d.map((v) => v / n0);
  for (let k = 1; k <= T; k++) {
    const h = hs[T - k + 1], da = d.map((v, i) => v * (1 - h[i] * h[i]));
    d = Array.from({ length: H }, (_, j) => da.reduce((a, v, i) => a + v * W[i][j], 0));
    out.push(Math.log10(Math.max(Math.hypot(...d), 1e-300)));
  }
  return out;
}

export function ForgetPathViz() {
  const [bi, setBi] = useState(1);
  const [data, setData] = useState<{ f: number[][]; r: number[] } | null>(null);
  useEffect(() => setData({ f: BIASES.map((b) => forgetCurve(b)), r: rnnCurve() }), []);
  const W = 300, H = 200, X0 = 30, PW = W - 38, PH = 172;
  const sx = (k: number) => X0 + (k / T) * PW, sy = (v: number) => 8 + (Math.max(LMIN, Math.min(0, v)) / LMIN) * PH;
  const line = (c: number[]) => c.map((v, k) => `${sx(k)},${sy(v)}`).join(" ");
  const f = data?.f[bi];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {BIASES.map((b, i) => (
          <button key={b} type="button" className="seg" aria-pressed={i === bi} onClick={() => setBi(i)}>forget bias {b}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Gradient surviving along the LSTM cell state compared with a plain RNN">
        <line x1={X0} y1={sy(LMIN)} x2={X0 + PW} y2={sy(LMIN)} stroke="var(--border)" />
        <line x1={X0} y1={sy(LMIN)} x2={X0} y2={sy(0)} stroke="var(--border)" />
        {data && <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" points={line(data.r)} />}
        {f && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(f)} />}
        {[0, 25, 50, 75, 100].map((k) => (
          <text key={k} x={sx(k)} y={H + 12} textAnchor="middle" className="viz-label">{k}</text>
        ))}
        {[0, -4, -8, -12].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v === 0 ? "1" : `1e${v}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {f && data ? `100 steps back: cell path ${(10 ** f[T]).toExponential(1)}, plain RNN ${(10 ** data.r[T]).toExponential(1)}` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The colour curve is the gradient carried back k steps along the LSTM cell state, which is just the product of the
        forget gates, averaged over 64 units whose gates fluctuate around the chosen bias. The red dashed curve is a plain tanh
        RNN with gain 0.9. A forget bias of 0 halves the signal every step, about as bad as the RNN; raising it towards 5 keeps
        gates near 1 and lets the signal cross a hundred steps almost intact.
      </figcaption>
    </figure>
  );
}
