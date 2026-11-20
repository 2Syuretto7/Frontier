"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 20, N = 15, STEPS = 300, SIGMA = 0.8;

function gauss(r: () => number) {
  const u = Math.max(1e-12, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Linear regression stand-in for fine-tuning. The pretrained weights solve task A exactly; fine-tuning runs gradient
 * descent on 15 examples of a related task B, optionally adding a replay gradient towards task A.
 */
export function simulate(lr: number, replay: number, seed = 4) {
  const r = rand(seed);
  const wA = Array.from({ length: D }, () => gauss(r));
  const wB = wA.map((v) => v + 1.0 * gauss(r));
  const X = Array.from({ length: N }, () => Array.from({ length: D }, () => gauss(r)));
  const y = X.map((x) => x.reduce((s, xi, i) => s + xi * wB[i], 0) + SIGMA * gauss(r));
  const w = [...wA];
  const out: { trainB: number; valB: number; lossA: number }[] = [];
  const sq = (a: number[], b: number[]) => a.reduce((s, ai, i) => s + (ai - b[i]) ** 2, 0);
  for (let t = 0; t <= STEPS; t++) {
    const res = X.map((x, k) => x.reduce((s, xi, i) => s + xi * w[i], 0) - y[k]);
    out.push({ trainB: res.reduce((s, e) => s + e * e, 0) / N, valB: sq(w, wB) + SIGMA ** 2, lossA: sq(w, wA) });
    const g = new Array(D).fill(0);
    X.forEach((x, k) => x.forEach((xi, i) => { g[i] += (2 / N) * res[k] * xi; }));
    for (let i = 0; i < D; i++) w[i] -= lr * ((1 - replay) * g[i] + replay * 2 * (w[i] - wA[i]));
  }
  return out;
}

export function ForgettingViz() {
  const [lr, setLr] = useState(0.02);
  const [replay, setReplay] = useState(0);
  const run = useMemo(() => simulate(lr, replay), [lr, replay]);
  const W = 330, H = 210, X0 = 34, PW = 286, Y0 = 8, PH = 160;
  const YMAX = Math.max(6, Math.ceil(Math.max(...run.map((p) => Math.max(p.valB, p.lossA)))));
  const px = (t: number) => X0 + (t / STEPS) * PW;
  const py = (v: number) => Y0 + PH - (Math.min(YMAX, v) / YMAX) * PH;
  const line = (f: (p: (typeof run)[number]) => number) => run.map((p, t) => `${px(t).toFixed(1)},${py(f(p)).toFixed(1)}`).join(" ");
  const last = run[STEPS];
  const best = run.reduce((b, p, t) => (p.valB < run[b].valB ? t : b), 0);
  const series = [
    { f: (p: (typeof run)[number]) => p.trainB, c: "var(--accent)", label: "task B, training" },
    { f: (p: (typeof run)[number]) => p.valB, c: "var(--code-function)", label: "task B, held out" },
    { f: (p: (typeof run)[number]) => p.lossA, c: "var(--danger)", label: "task A (pretraining)" },
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Learning rate">
          {[0.02, 0.08].map((v) => (
            <button key={v} className="seg" aria-pressed={lr === v} onClick={() => setLr(v)}>{v === 0.02 ? "low learning rate" : "high learning rate"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Replay">
          {[0, 0.2].map((v) => (
            <button key={v} className="seg" aria-pressed={replay === v} onClick={() => setReplay(v)}>{v === 0 ? "no replay" : "20% replay"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Losses during fine-tuning">
        {[0, YMAX / 2, YMAX].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <line x1={px(best)} x2={px(best)} y1={Y0} y2={Y0 + PH} stroke="var(--code-function)" strokeDasharray="3 3" strokeWidth={0.8} />
        {series.map((s) => <polyline key={s.label} points={line(s.f)} fill="none" stroke={s.c} strokeWidth={1.8} />)}
        {series.map((s, i) => (
          <text key={s.label} x={X0 + PW} y={Y0 + 11 + i * 14} textAnchor="end" className="viz-label" style={{ fill: s.c }}>{s.label}</text>
        ))}
        <text x={X0} y={H - 16} className="viz-label">fine-tuning steps, 0 to {STEPS}</text>
        <text x={X0} y={H - 4} className="viz-label">dotted: lowest held-out loss on task B</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        after {STEPS} steps: B training {last.trainB.toFixed(2)}, B held out {last.valB.toFixed(2)}, A {last.lossA.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        A linear model whose starting weights solve task A is fine-tuned on 15 examples of a related task B with 20 unknowns.
        Training loss on B falls towards zero while held-out loss on B levels off, and at the higher rate turns up as the model
        fits noise; meanwhile loss on A climbs as the weights leave A&apos;s solution. Replaying task A holds its loss far lower at
        a modest cost on B.
      </figcaption>
    </figure>
  );
}
