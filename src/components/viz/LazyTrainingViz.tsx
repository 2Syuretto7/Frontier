"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const XT = [-2.2, -1.2, -0.4, 0.5, 1.3, 2.1];
const YT = [0.5, -0.4, 0.3, 0.8, -0.3, 0.4];
const ETA = 0.1;
const STEPS = 400;
const GRID = Array.from({ length: 49 }, (_, i) => -3 + (i * 6) / 48);

/** The infinite-width NTK of f(x) = Σ v relu(wx + b)/√n with v, w, b ~ N(0, 1). */
export function ntkLimit(x: number, y: number) {
  const k11 = x * x + 1, k22 = y * y + 1, k12 = x * y + 1, r = Math.sqrt(k11 * k22);
  const t = Math.acos(Math.max(-1, Math.min(1, k12 / r)));
  return (r * (Math.sin(t) + (Math.PI - t) * Math.cos(t))) / (2 * Math.PI) + (k12 * (Math.PI - t)) / (2 * Math.PI);
}

/** Gradient descent on the linearised (infinite-width) model, started from zero. */
export function ntkPrediction(xs: number[]) {
  const T = XT.map((a) => XT.map((b) => ntkLimit(a, b)));
  const sum = new Array<number>(XT.length).fill(0);
  let r = YT.map((y) => -y);
  for (let k = 0; k < STEPS; k++) {
    for (let i = 0; i < r.length; i++) sum[i] += r[i];
    r = r.map((ri, i) => ri - ETA * T[i].reduce((s, t, j) => s + t * r[j], 0));
  }
  return xs.map((x) => -ETA * XT.reduce((s, xi, i) => s + ntkLimit(x, xi) * sum[i], 0));
}

/** Train the width-n network (minus its initial function) by gradient descent; report the fit and how far it moved. */
export function trainNetwork(n: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const v0 = Array.from({ length: n }, normal), w0 = Array.from({ length: n }, normal), b0 = Array.from({ length: n }, normal);
  const v = v0.slice(), w = w0.slice(), b = b0.slice();
  const s = 1 / Math.sqrt(n);
  const f = (V: number[], Wt: number[], B: number[], x: number) => {
    let acc = 0;
    for (let j = 0; j < n; j++) acc += V[j] * Math.max(0, Wt[j] * x + B[j]);
    return acc * s;
  };
  const grads = (x: number) => {
    const gv = new Array<number>(n), gw = new Array<number>(n), gb = new Array<number>(n);
    for (let j = 0; j < n; j++) {
      const u = w[j] * x + b[j], on = u > 0 ? 1 : 0;
      gv[j] = Math.max(0, u) * s;
      gw[j] = v[j] * on * x * s;
      gb[j] = v[j] * on * s;
    }
    return [gv, gw, gb];
  };
  const ntkAt = () => {
    const G = XT.map(grads);
    return XT.map((_, i) => XT.map((__, k) => G[i].reduce((acc, gi, c) => acc + gi.reduce((a2, g, j) => a2 + g * G[k][c][j], 0), 0)));
  };
  const f0 = XT.map((x) => f(v0, w0, b0, x));
  const theta0 = ntkAt();
  for (let step = 0; step < STEPS; step++) {
    const res = XT.map((x, i) => f(v, w, b, x) - f0[i] - YT[i]);
    const G = XT.map(grads);
    for (let i = 0; i < XT.length; i++) for (let j = 0; j < n; j++) {
      v[j] -= ETA * res[i] * G[i][0][j];
      w[j] -= ETA * res[i] * G[i][1][j];
      b[j] -= ETA * res[i] * G[i][2][j];
    }
  }
  const theta1 = ntkAt();
  let dk = 0, k0 = 0, dp = 0, p0 = 0;
  for (let i = 0; i < XT.length; i++) for (let k = 0; k < XT.length; k++) { dk += (theta1[i][k] - theta0[i][k]) ** 2; k0 += theta0[i][k] ** 2; }
  for (let j = 0; j < n; j++) {
    dp += (v[j] - v0[j]) ** 2 + (w[j] - w0[j]) ** 2 + (b[j] - b0[j]) ** 2;
    p0 += v0[j] ** 2 + w0[j] ** 2 + b0[j] ** 2;
  }
  const curve = GRID.map((x) => f(v, w, b, x) - f(v0, w0, b0, x));
  return { curve, weightChange: Math.sqrt(dp / p0), kernelChange: Math.sqrt(dk / k0) };
}

export function LazyTrainingViz() {
  const [n, setN] = useState(30);
  const [seed, setSeed] = useState(1);
  const net = useMemo(() => trainNetwork(n, seed), [n, seed]);
  const lim = useMemo(() => ntkPrediction(GRID), []);
  const gap = Math.max(...net.curve.map((c, i) => Math.abs(c - lim[i])));
  const W = 330, H = 150, X0 = 10, PW = 310, YM = 64, YS = 52;
  const px = (x: number) => X0 + ((x + 3) / 6) * PW;
  const py = (y: number) => YM - Math.max(-1.15, Math.min(1.15, y)) * YS;
  const line = (ys: number[]) => ys.map((y, i) => `${i ? "L" : "M"}${px(GRID[i]).toFixed(1)},${py(y).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Hidden width">
          {[5, 30, 300, 3000].map((m) => (
            <button key={m} className="seg" aria-pressed={n === m} onClick={() => setN(m)}>n = {m}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A trained network compared with the neural tangent kernel prediction">
        <line x1={X0} x2={X0 + PW} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        <path d={line(lim)} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="6 4" />
        <path d={line(net.curve)} fill="none" stroke="var(--code-function)" strokeWidth={1.8} />
        {XT.map((x, i) => <circle key={i} cx={px(x)} cy={py(YT[i])} r={3.5} fill="var(--text)" />)}
        <text x={X0} y={H - 4} className="viz-label">solid: trained network; dashed: infinite-width NTK</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        width {n}: weights moved {(100 * net.weightChange).toFixed(2)}%, kernel moved {(100 * net.kernelChange).toFixed(2)}%, largest gap to NTK curve {gap.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A one-hidden-layer ReLU network, with its initial function subtracted so that it starts at zero, trained by {STEPS} steps
        of gradient descent on six points. The dashed curve is what the same gradient descent does to the linearised
        network with the infinite-width tangent kernel. As the width grows the trained network converges to it, while the
        weights and the kernel move less and less, roughly like 1/√n: the lazy regime.
      </figcaption>
    </figure>
  );
}
