"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 5;
const W_TRUE = [1.0, -0.8, 0.6, 0.4, -0.3];
const NS = [100, 300, 1000, 3000, 10000];
const BIASES = [
  { label: "small AI bias", b: [0.05, 0.0, -0.05, 0.05, 0.0] },
  { label: "large AI bias", b: [0.0, 0.3, 0.0, -0.4, 0.4] },
];
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function solve(A: number[][], y: number[]) {
  const n = y.length, M = A.map((r, i) => [...r, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / M[i][i]);
}

/** Fit a Bradley–Terry reward on feature differences by Newton's method with a small ridge term. */
function fit(X: number[][], y: number[]) {
  let w = new Array(D).fill(0);
  for (let it = 0; it < 8; it++) {
    const g = new Array(D).fill(0), H = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => (i === j ? 1e-3 * X.length : 0)));
    X.forEach((x, n) => {
      const p = sig(dot(w, x)), s = p * (1 - p);
      for (let i = 0; i < D; i++) { g[i] += (p - y[n]) * x[i]; for (let j = 0; j < D; j++) H[i][j] += s * x[i] * x[j]; }
    });
    for (let i = 0; i < D; i++) g[i] += 1e-3 * X.length * w[i];
    const step = solve(H, g);
    w = w.map((v, i) => v - step[i]);
  }
  return w;
}

/** Held-out accuracy, against the true reward, of reward models fitted to human labels (true preferences) and to AI
 *  labels (preferences from a biased weight vector), for each number of labelled pairs. */
export function curves(bias: number[], seed = 17) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const wAi = W_TRUE.map((v, i) => v + bias[i]);
  const pool = Array.from({ length: NS[NS.length - 1] }, () => Array.from({ length: D }, normal));
  const yH = pool.map((x) => (r() < sig(dot(W_TRUE, x)) ? 1 : 0));
  const yA = pool.map((x) => (r() < sig(dot(wAi, x)) ? 1 : 0));
  const test = Array.from({ length: 2000 }, () => Array.from({ length: D }, normal));
  const acc = (w: number[]) => test.filter((x) => dot(w, x) * dot(W_TRUE, x) > 0).length / test.length;
  return NS.map((n) => ({ n, human: acc(fit(pool.slice(0, n), yH.slice(0, n))), ai: acc(fit(pool.slice(0, n), yA.slice(0, n))) }));
}

export function LabelBudgetViz() {
  const [bi, setBi] = useState(0);
  const pts = useMemo(() => curves(BIASES[bi].b), [bi]);
  const W = 330, H = 190, X0 = 40, PW = 270, Y0 = 10, PH = 140, LO = 0.7;
  const px = (n: number) => X0 + (Math.log10(n / 100) / 2) * PW;
  const py = (v: number) => Y0 + PH - ((Math.max(LO, v) - LO) / (1 - LO)) * PH;
  const path = (k: "human" | "ai") => pts.map((p, i) => `${i ? "L" : "M"}${px(p.n).toFixed(1)},${py(p[k]).toFixed(1)}`).join(" ");
  const h1k = pts.find((p) => p.n === 1000)!, a10k = pts[pts.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Systematic bias of the AI labeller">
          {BIASES.map((b, i) => <button key={b.label} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{b.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Reward model accuracy against number of labels">
        {[0.7, 0.8, 0.9, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{Math.round(v * 100)}%</text>
          </g>
        ))}
        {[100, 1000, 10000].map((n) => (
          <text key={n} x={px(n)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{n.toLocaleString("en-IN")}</text>
        ))}
        <path d={path("human")} fill="none" stroke="var(--text)" strokeWidth={2} />
        <path d={path("ai")} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 3" />
        {pts.map((p) => <circle key={`h${p.n}`} cx={px(p.n)} cy={py(p.human)} r={2.5} style={{ fill: "var(--text)" }} />)}
        {pts.map((p) => <circle key={`a${p.n}`} cx={px(p.n)} cy={py(p.ai)} r={2.5} style={{ fill: "var(--accent)" }} />)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">labelled pairs; solid: human, dashed: AI</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        same budget, AI labels 10× cheaper: 1,000 human labels {(h1k.human * 100).toFixed(1)}% vs 10,000 AI labels {(a10k.ai * 100).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        A reward model is fitted to pairs labelled by people, who follow the true preference with Bradley–Terry noise, or by an
        AI labeller whose judgement is noisy in the same way and also tilted by a systematic bias. Accuracy is how often the
        fitted model orders fresh pairs as the true reward does. Random label noise averages out as labels grow; systematic
        bias does not, so with a large bias the AI curve levels off well below the human one. Whether cheap AI labels win depends on how large that
        bias is.
      </figcaption>
    </figure>
  );
}
