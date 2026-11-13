"use client";

import { useMemo, useState } from "react";

const XS = [[2, 3, -1], [3, -1, 0.5], [0.5, 1, 1], [1, 1, -1]];
const YS = [1, -1, -1, 1];
const SIZES = [3, 4, 4, 1];
const RATES = [0.005, 0.05, 0.5];
const MAXSTEPS = 120;

type Net = { W: number[][][]; B: number[][] };

function init(): Net {
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647) * 2 - 1;
  };
  const W: number[][][] = [], B: number[][] = [];
  for (let l = 0; l < SIZES.length - 1; l++) {
    W.push(Array.from({ length: SIZES[l + 1] }, () => Array.from({ length: SIZES[l] }, rnd)));
    B.push(Array.from({ length: SIZES[l + 1] }, rnd));
  }
  return { W, B };
}

function forward(n: Net, x: number[]) {
  const acts = [x];
  let h = x;
  n.W.forEach((Wl, l) => {
    h = Wl.map((row, j) => Math.tanh(row.reduce((s, w, i) => s + w * h[i], n.B[l][j])));
    acts.push(h);
  });
  return acts;
}

/** loss and gradient of the summed squared error, by hand-written backprop */
function lossGrad(n: Net) {
  const gW = n.W.map((Wl) => Wl.map((r) => r.map(() => 0)));
  const gB = n.B.map((Bl) => Bl.map(() => 0));
  let loss = 0;
  XS.forEach((x, k) => {
    const acts = forward(n, x);
    const out = acts[acts.length - 1][0];
    loss += (out - YS[k]) ** 2;
    let d = [2 * (out - YS[k])];
    for (let l = n.W.length - 1; l >= 0; l--) {
      const a = acts[l + 1], prev = acts[l];
      const dz = d.map((g, j) => g * (1 - a[j] ** 2));
      dz.forEach((g, j) => {
        gB[l][j] += g;
        prev.forEach((p, i) => { gW[l][j][i] += g * p; });
      });
      d = prev.map((_, i) => dz.reduce((s, g, j) => s + g * n.W[l][j][i], 0));
    }
  });
  return { loss, gW, gB };
}

function run(steps: number, lr: number) {
  const n = init();
  const losses: number[] = [];
  for (let t = 0; t <= steps; t++) {
    const { loss, gW, gB } = lossGrad(n);
    losses.push(loss);
    if (t === steps) break;
    n.W.forEach((Wl, l) => Wl.forEach((r, j) => r.forEach((_, i) => { r[i] -= lr * gW[l][j][i]; })));
    n.B.forEach((Bl, l) => Bl.forEach((_, j) => { Bl[j] -= lr * gB[l][j]; }));
  }
  return { losses, preds: XS.map((x) => { const a = forward(n, x); return a[a.length - 1][0]; }) };
}

/** Training a 3-4-4-1 tanh MLP on four points with gradient descent at three learning rates. */
export function MlpTrainViz() {
  const [steps, setSteps] = useState(0);
  const [lr, setLr] = useState(0.05);
  const { losses, preds } = useMemo(() => run(steps, lr), [steps, lr]);
  const W = 340, H = 150, P = 30;
  const top = Math.max(8, ...losses.filter(Number.isFinite));
  const px = (t: number) => P + (t / MAXSTEPS) * (W - P - 10);
  const py = (v: number) => H - 20 - (Math.min(v, top) / top) * (H - 35);
  const last = losses[losses.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {RATES.map((r) => (
          <button key={r} type="button" className="seg" aria-pressed={lr === r} onClick={() => { setLr(r); setSteps(0); }}>lr = {r}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => setSteps(Math.min(MAXSTEPS, steps + 1))} disabled={steps >= MAXSTEPS}>1 step</button>
        <button type="button" className="btn" onClick={() => setSteps(Math.min(MAXSTEPS, steps + 20))} disabled={steps >= MAXSTEPS}>20 steps</button>
        <button type="button" className="btn" onClick={() => setSteps(0)}>Reset</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Loss against training step">
        <line x1={P} y1={H - 20} x2={W - 10} y2={H - 20} stroke="var(--text-faint)" />
        <line x1={P} y1={10} x2={P} y2={H - 20} stroke="var(--text-faint)" />
        <text x={P - 4} y={py(top) + 4} textAnchor="end" className="viz-label">{top.toFixed(0)}</text>
        <text x={P - 4} y={H - 16} textAnchor="end" className="viz-label">0</text>
        <text x={W - 10} y={H - 5} textAnchor="end" className="viz-label">step</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={losses.map((v, t) => `${px(t)},${py(v)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        step {steps}, loss {last.toFixed(4)}
        <br />
        targets {YS.map((y) => y.toFixed(2).padStart(5)).join(" ")}
        <br />
        outputs {preds.map((p) => p.toFixed(2).padStart(5)).join(" ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each step: forward pass over the four examples, loss = sum of squared errors, backward, then every parameter moves by
        −lr × its grad.{" "}
        {lr === 0.005
          ? "A small learning rate is safe but slow: after 20 steps the loss has barely halved."
          : lr === 0.5
            ? "A large learning rate overshoots: the loss drops, then jumps back up near its start at step 2 before it settles."
            : "A moderate learning rate brings the loss near 0 within about 20 steps, and the outputs sit near their targets."}
      </figcaption>
    </figure>
  );
}
