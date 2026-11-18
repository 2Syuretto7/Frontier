"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 64, D = 4, STEPS = 120, LR = 0.05;
const normal = makeNormal(makeRng(21));
const TRUE_W = [1.5, -2.0, 0.7, 2.0];
const X = Array.from({ length: N }, () => [normal(), normal(), normal(), 1]);
const Y = X.map((x) => x.reduce((s, v, j) => s + v * TRUE_W[j], 0) + 0.3 * normal());
const PERM = (() => {
  const r = makeRng(4), p = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
})();

export const BUGS = ["correct", "pred (N,1) − y (N,)", "no zero_grad", "labels misaligned"] as const;
type Bug = (typeof BUGS)[number];

/** Gradient descent on squared error with one of the bugs; returns the loss the run reports at each step and its final weights. */
export function train(bug: Bug) {
  const y = bug === "labels misaligned" ? PERM.map((i) => Y[i]) : Y;
  const ybar = y.reduce((s, v) => s + v, 0) / N;
  const w = [0, 0, 0, 0], acc = [0, 0, 0, 0], losses: number[] = [];
  for (let t = 0; t < STEPS; t++) {
    const pred = X.map((x) => x.reduce((s, v, j) => s + v * w[j], 0));
    const g = [0, 0, 0, 0];
    let loss = 0;
    for (let i = 0; i < N; i++) {
      if (bug === "pred (N,1) − y (N,)") {
        for (let k = 0; k < N; k++) loss += (pred[i] - y[k]) ** 2 / (N * N);
        for (let j = 0; j < D; j++) g[j] += (2 * (pred[i] - ybar) * X[i][j]) / N;
      } else {
        loss += (pred[i] - y[i]) ** 2 / N;
        for (let j = 0; j < D; j++) g[j] += (2 * (pred[i] - y[i]) * X[i][j]) / N;
      }
    }
    losses.push(loss);
    for (let j = 0; j < D; j++) {
      acc[j] = bug === "no zero_grad" ? acc[j] + g[j] : g[j];
      w[j] -= LR * acc[j];
    }
  }
  return { losses, w, err: Math.hypot(...w.map((v, j) => v - TRUE_W[j])) };
}

export function SilentBugViz() {
  const [b, setB] = useState<Bug>("pred (N,1) − y (N,)");
  const ref = train("correct"), run = train(b);
  const ymax = Math.max(...ref.losses, ...run.losses);
  const W = 300, H = 150, X0 = 30, PW = W - 38, PH = 126;
  const sx = (t: number) => X0 + (t / (STEPS - 1)) * PW, sy = (v: number) => 8 + PH - (v / ymax) * PH;
  const line = (ls: number[]) => ls.map((v, t) => `${sx(t)},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {BUGS.map((x) => (
          <button key={x} type="button" className="seg mono" aria-pressed={b === x} onClick={() => setB(x)}>{x}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Reported training loss of a correct run and a buggy run">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" points={line(ref.losses)} />
        <polyline fill="none" stroke={b === "correct" ? "var(--accent)" : "var(--danger)"} strokeWidth={2} points={line(run.losses)} />
        {[0, 40, 80, 119].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t + 1}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`final reported loss ${run.losses[STEPS - 1].toFixed(3)}, distance to the true weights ${run.err.toFixed(3)} (correct run: ${ref.err.toFixed(3)})`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Linear regression with an intercept, trained by gradient descent, with the correct run dashed. Each bug still
        produces a loss that falls and settles, so a curve seen on its own looks like a model that has learned what it
        can. A (N, 1) prediction minus an (N,) target
        broadcasts to an N × N matrix, and the model learns only to predict the mean. Never zeroing gradients turns the
        update into a running sum that overshoots and rings. Misaligned labels leave nothing to learn but the noise floor.
        Comparing the learned weights with known ones exposes all three.
      </figcaption>
    </figure>
  );
}
