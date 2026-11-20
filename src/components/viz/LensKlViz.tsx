"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 8, V = 8, LAYERS = 12, N = 300;

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) * Math.cos(2 * Math.PI * r());
}

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
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

const logSoftmax = (z: number[]) => {
  const m = Math.max(...z), l = Math.log(z.reduce((s, v) => s + Math.exp(v - m), 0)) + m;
  return z.map((v) => v - l);
};

/** Mean KL from the final distribution to a lens's distribution. */
function meanKl(final: number[][], lens: number[][]) {
  let s = 0;
  final.forEach((zf, i) => {
    const lp = logSoftmax(zf), lq = logSoftmax(lens[i]);
    s += lp.reduce((t, v, k) => t + Math.exp(v) * (v - lq[k]), 0);
  });
  return s / final.length;
}

/**
 * A toy residual stream. The final state is random; the state at layer l holds a fraction l/L of it, expressed in a basis rotated by
 * an angle that grows with distance from the output, plus a constant offset and noise standing in for what later layers still add.
 * The logit lens unembeds each state directly; the tuned lens first applies an affine map fitted by least squares on half the inputs,
 * and both are scored on the other half.
 */
export function lensCurves(drift: number, seed = 3) {
  const r = rand(seed);
  const U = Array.from({ length: V }, () => Array.from({ length: D }, () => gauss(r)));
  const unembed = (h: number[]) => U.map((u) => u.reduce((s, v, i) => s + v * h[i], 0));
  const off = Array.from({ length: D }, () => gauss(r));
  const hL = Array.from({ length: N }, () => Array.from({ length: D }, () => 1.2 * gauss(r)));
  const final = hL.map(unembed);
  const out = { logit: [] as number[], tuned: [] as number[] };
  const half = N / 2;
  for (let l = 1; l <= LAYERS; l++) {
    const keep = l / LAYERS, ang = drift * (1 - keep), c = Math.cos(ang), s = Math.sin(ang);
    const hs = hL.map((h) => {
      const v = h.map((x, i) => keep * x + 0.6 * (1 - keep) * gauss(r) + (1 - keep) * off[i]);
      // Rotate within consecutive pairs of coordinates.
      for (let i = 0; i + 1 < D; i += 2) { const a = v[i], b = v[i + 1]; v[i] = c * a - s * b; v[i + 1] = s * a + c * b; }
      return v;
    });
    out.logit.push(meanKl(final.slice(half), hs.slice(half).map(unembed)));
    // Fit h_L ~ A h + b on the first half, one output coordinate at a time.
    const k = D + 1, G = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let n = 0; n < half; n++) { const z = [...hs[n], 1]; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) G[i][j] += z[i] * z[j]; }
    for (let i = 0; i < k; i++) G[i][i] += 1e-6;
    const coef = Array.from({ length: D }, (_, o) => {
      const b = new Array(k).fill(0);
      for (let n = 0; n < half; n++) { const z = [...hs[n], 1]; for (let i = 0; i < k; i++) b[i] += z[i] * hL[n][o]; }
      return solve(G, b);
    });
    const translate = (h: number[]) => coef.map((w) => w.reduce((t, v, i) => t + v * (i < D ? h[i] : 1), 0));
    out.tuned.push(meanKl(final.slice(half), hs.slice(half).map((h) => unembed(translate(h)))));
  }
  return out;
}

const DRIFTS = [0, 0.8, 1.6];

export function LensKlViz() {
  const [k, setK] = useState(1);
  const { logit, tuned } = lensCurves(DRIFTS[k]);
  const W = 330, H = 176, X0 = 30, PW = 290, Y0 = 10, PH = 132;
  const top = Math.max(4, Math.ceil(Math.max(...logit)));
  const px = (l: number) => X0 + ((l - 1) / (LAYERS - 1)) * PW;
  const py = (v: number) => Y0 + PH - (Math.min(v, top) / top) * PH;
  const path = (ys: number[]) => ys.map((y, i) => `${i ? "L" : "M"}${px(i + 1).toFixed(1)},${py(y).toFixed(1)}`).join(" ");
  const ticks = [0, top / 2, top];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How much the basis drifts across layers">
          {["no drift", "some drift", "strong drift"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="KL divergence from the final prediction to each lens, by layer">
        {ticks.map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={path(logit)} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
        <path d={path(tuned)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[1, 4, 8, 12].map((l) => <text key={l} x={px(l)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{l}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">layer; grey: logit lens, coloured: tuned lens (KL, nats)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        KL at layer 6: logit lens {logit[5].toFixed(2)}, tuned lens {tuned[5].toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        A toy residual stream in which each layer holds part of the final state, in a basis that rotates further from the output the
        earlier the layer, plus an offset and noise. The logit lens reads every layer with the output head, so it fails wherever the
        basis or offset differs. The tuned lens fits a small affine map per layer first, so it removes the drift and offset, and what
        remains measures the information each layer is still missing.
      </figcaption>
    </figure>
  );
}
