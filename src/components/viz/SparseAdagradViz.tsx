"use client";

import { useMemo, useState } from "react";
import { makeRng } from "./ml";

const T = 2000;
const LR = 0.5;

/** Online least squares y = x·(1, 1, 1) with binary features firing at rates (1, 0.2, p); errors |wᵢ − 1| over time. */
export function runSparse(p: number, method: "sgd" | "adagrad") {
  const rng = makeRng(7);
  const rates = [1, 0.2, p];
  const w = [0, 0, 0], G = [0, 0, 0];
  const err: number[][] = [[1, 1, 1]];
  for (let t = 1; t <= T; t++) {
    const x: number[] = rates.map((r) => (rng() < r ? 1 : 0));
    const r = x.reduce((s, xi, i) => s + xi * (w[i] - 1), 0);
    for (let i = 0; i < 3; i++) {
      const g = r * x[i];
      G[i] += g * g;
      const step = method === "sgd" ? LR / Math.sqrt(t) : G[i] > 0 ? LR / Math.sqrt(G[i]) : 0;
      w[i] -= step * g;
    }
    err.push(w.map((v) => Math.abs(v - 1)));
  }
  return err;
}

export function SparseAdagradViz() {
  const [p, setP] = useState(0.01);
  const runs = useMemo(() => ({ sgd: runSparse(p, "sgd"), ada: runSparse(p, "adagrad") }), [p]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (e: number) => 8 + (-Math.max(-4, Math.log10(Math.max(e, 1e-4))) / 4) * PH;
  const line = (err: number[][], i: number) => err.filter((_, t) => t % 10 === 0).map((e, j) => `${sx(j * 10)},${sy(e[i])}`).join(" ");
  const fmt = (e: number[]) => e.map((v) => v.toFixed(3)).join(", ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">rare feature fires with probability</span>
        {[0.1, 0.03, 0.01].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={p === v} onClick={() => setP(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Error in the common and rare weights over time for decaying-rate SGD and AdaGrad">
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" points={line(runs.sgd, 0)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={line(runs.sgd, 2)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" points={line(runs.ada, 0)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(runs.ada, 2)} />
        {[0, 500, 1000, 1500, 2000].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[1, 0.01, 0.0001].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div>{`SGD η/√t   final errors: ${fmt(runs.sgd[T])}`}</div>
        <div>{`AdaGrad    final errors: ${fmt(runs.ada[T])}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Online least squares with three binary features: one always present, one present a fifth of the time, one rare.
        Lines show the error in the always-present weight (dashed) and the rare weight (solid) for SGD with the global decay
        η/√t (red) and AdaGrad (blue), both with η = 0.5. By the time the rare feature appears, SGD&apos;s global rate has
        already shrunk; AdaGrad&apos;s rate for that coordinate depends only on its own gradients, so it is still large.
      </figcaption>
    </figure>
  );
}
