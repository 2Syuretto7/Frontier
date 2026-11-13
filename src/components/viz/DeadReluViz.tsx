"use client";

import { useMemo, useState } from "react";

const H = 20, STEPS = 300, NPTS = 32;

function rng(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

function trainDead(lr: number, seed = 4) {
  const r = rng(seed);
  const xs = Array.from({ length: NPTS }, (_, i) => -1 + (2 * i) / (NPTS - 1));
  const ys = xs.map((x) => Math.sin(3 * x));
  const w1 = Array.from({ length: H }, () => r()), b1 = Array.from({ length: H }, () => 0.5 * r());
  const w2 = Array.from({ length: H }, () => r() / Math.sqrt(H));
  let b2 = 0;
  const deadAt: number[] = [], lossAt: number[] = [];
  const countDead = () => w1.filter((w, j) => xs.every((x) => w * x + b1[j] <= 0)).length;
  for (let t = 0; t <= STEPS; t++) {
    const gw1 = new Array(H).fill(0), gb1 = new Array(H).fill(0), gw2 = new Array(H).fill(0);
    let gb2 = 0, loss = 0;
    xs.forEach((x, i) => {
      const a = w1.map((w, j) => w * x + b1[j]);
      const h = a.map((v) => Math.max(v, 0));
      const out = h.reduce((s, v, j) => s + v * w2[j], b2);
      const d = (out - ys[i]) / NPTS;
      loss += (out - ys[i]) ** 2 / NPTS;
      gb2 += d;
      for (let j = 0; j < H; j++) {
        gw2[j] += h[j] * d;
        if (a[j] > 0) { gw1[j] += d * w2[j] * x; gb1[j] += d * w2[j]; }
      }
    });
    deadAt.push(countDead());
    lossAt.push(loss);
    if (t === STEPS || !Number.isFinite(loss)) break;
    for (let j = 0; j < H; j++) { w1[j] -= lr * gw1[j]; b1[j] -= lr * gb1[j]; w2[j] -= lr * gw2[j]; }
    b2 -= lr * gb2;
  }
  return { deadAt, lossAt, w1, b1 };
}

/** Number of dead ReLU units while a small network trains, for three learning rates. */
export function DeadReluViz() {
  const [lr, setLr] = useState(1);
  const { deadAt, lossAt } = useMemo(() => trainDead(lr), [lr]);
  const W = 320, Ht = 160;
  const px = (t: number) => 34 + (t / STEPS) * (W - 44);
  const py = (d: number) => 10 + (1 - d / H) * (Ht - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {[0.05, 0.5, 1].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={lr === v} onClick={() => setLr(v)}>lr {v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${Ht}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Dead units against training step">
        {[0, 10, 20].map((d) => (
          <g key={d}>
            <line x1={34} x2={W - 10} y1={py(d)} y2={py(d)} stroke="var(--border)" />
            <text x={30} y={py(d) + 4} textAnchor="end" className="viz-label">{d}</text>
          </g>
        ))}
        {[0, 100, 200, 300].map((t) => <text key={t} x={px(t)} y={Ht - 8} textAnchor="middle" className="viz-label">{t}</text>)}
        <polyline fill="none" stroke={deadAt[deadAt.length - 1] > H / 2 ? "var(--danger)" : "var(--accent)"} strokeWidth={2} points={deadAt.map((d, t) => `${px(t).toFixed(1)},${py(d).toFixed(1)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        dead units {deadAt[0]} → {deadAt[deadAt.length - 1]} of {H}, final loss {lossAt[lossAt.length - 1].toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A 1-20-1 ReLU network fits sin(3x) on [−1, 1]. A unit is dead when its pre-activation is ≤ 0 on every input: its
        gradient is then exactly 0 and it can never come back. A few units start dead. With a large learning rate, early
        steps overshoot, push many biases far negative, and the count jumps; the network is left with too few units to fit
        the curve.
      </figcaption>
    </figure>
  );
}
