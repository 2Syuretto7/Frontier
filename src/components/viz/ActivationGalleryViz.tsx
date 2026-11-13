"use client";

import { useState } from "react";

const sig = (x: number) => 1 / (1 + Math.exp(-x));
const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
type Act = { name: string; f: (x: number) => number; note: string };
const ACTS: Act[] = [
  { name: "sigmoid", f: sig, note: "Squashes to (0, 1). The slope is at most 0.25 and vanishes for |x| beyond about 5: saturation." },
  { name: "tanh", f: Math.tanh, note: "Zero-centred, range (−1, 1), slope at most 1 at the origin, but it saturates just like the sigmoid." },
  { name: "ReLU", f: (x) => Math.max(x, 0), note: "Slope exactly 1 for positive inputs, so gradients pass unchanged, and exactly 0 for negative ones, so a unit that is always negative never learns again." },
  { name: "leaky ReLU", f: (x) => (x > 0 ? x : 0.1 * x), note: "A small slope (here 0.1) for negative inputs keeps a little gradient flowing." },
  { name: "GELU", f: gelu, note: "x times the probability that a standard normal is below x: a smooth ReLU that dips slightly below 0. Used in BERT and GPT-2." },
  { name: "SiLU", f: (x) => x * sig(x), note: "x·σ(x), also called swish. Smooth, with a minimum of about −0.28 near x = −1.28. It is the gate inside SwiGLU." },
];

/** Plot an activation and its derivative over [-5, 5]. */
export function ActivationGalleryViz() {
  const [k, setK] = useState(2);
  const a = ACTS[k];
  const W = 320, H = 180, lo = -5, hi = 5, ylo = -1.5, yhi = 3;
  const X = (x: number) => ((x - lo) / (hi - lo)) * W, Y = (y: number) => H - ((Math.max(ylo, Math.min(yhi, y)) - ylo) / (yhi - ylo)) * H;
  const xs = Array.from({ length: 201 }, (_, i) => lo + (i * (hi - lo)) / 200);
  const h = 1e-4, d = (x: number) => (a.f(x + h) - a.f(x - h)) / (2 * h);
  const path = (g: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {ACTS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{q.name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label={`${a.name} and its derivative`}>
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={0} y2={H} stroke="var(--border)" />
        <line x1={0} x2={W} y1={Y(1)} y2={Y(1)} stroke="var(--border)" strokeDasharray="2 4" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.6} strokeDasharray="5 3" points={path(d)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} points={path(a.f)} />
        <text x={W - 4} y={Y(1) - 4} textAnchor="end" className="viz-label">1</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Solid: {a.name}(x). Dashed: its derivative, the factor by which it scales a gradient passing through. {a.note}
      </figcaption>
    </figure>
  );
}
