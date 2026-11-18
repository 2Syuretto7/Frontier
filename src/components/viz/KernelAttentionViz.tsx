"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 25;
const WIDTHS = [0.01, 0.05, 0.15, 0.5];
const Q0 = 0.5;
const truth = (x: number) => Math.sin(2 * Math.PI * x);

export function sampleData(seed = 4) {
  const u = makeRng(seed), z = makeNormal(makeRng(seed + 1));
  const xs = Array.from({ length: N }, () => u()).sort((a, b) => a - b);
  return { xs, ys: xs.map((x) => truth(x) + 0.3 * z()) };
}

/** Attention weights of one query over the keys xs: softmax of -(q - x)^2 / (2 h^2). */
export function weights(q: number, xs: number[], h: number) {
  const s = xs.map((x) => -((q - x) ** 2) / (2 * h * h)), m = Math.max(...s);
  const e = s.map((v) => Math.exp(v - m)), t = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / t);
}

export function fit(xs: number[], ys: number[], h: number, grid: number[]) {
  return grid.map((q) => weights(q, xs, h).reduce((a, w, i) => a + w * ys[i], 0));
}

export function KernelAttentionViz() {
  const [hi, setHi] = useState(2);
  const [data, setData] = useState<{ xs: number[]; ys: number[] } | null>(null);
  useEffect(() => setData(sampleData()), []);
  const W = 300, H = 220, X0 = 26, PW = W - 34, TOP = 8, PH = 150, BAR = 40;
  const sx = (x: number) => X0 + x * PW, sy = (y: number) => TOP + ((1.8 - Math.max(-1.8, Math.min(1.8, y))) / 3.6) * PH;
  const grid = Array.from({ length: 121 }, (_, i) => i / 120);
  const h = WIDTHS[hi];
  const curve = data ? fit(data.xs, data.ys, h, grid) : null;
  const w0 = data ? weights(Q0, data.xs, h) : null;
  const ent = w0 ? Math.exp(-w0.reduce((a, w) => a + (w > 0 ? w * Math.log(w) : 0), 0)) : 0;
  const mse = curve ? curve.reduce((a, v, i) => a + (v - truth(grid[i])) ** 2, 0) / grid.length : 0;
  const wmax = w0 ? Math.max(...w0) : 1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {WIDTHS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={i === hi} onClick={() => setHi(i)}>width {v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Attention used as kernel regression, with the weights of one query shown underneath">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" points={grid.map((x) => `${sx(x)},${sy(truth(x))}`).join(" ")} />
        {data?.xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(data.ys[i])} r={2.5} fill="var(--text)" />)}
        {curve && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((x, i) => `${sx(x)},${sy(curve[i])}`).join(" ")} />}
        <line x1={sx(Q0)} y1={TOP} x2={sx(Q0)} y2={H} stroke="var(--danger)" strokeDasharray="2 3" />
        <line x1={X0} y1={H} x2={X0 + PW} y2={H} stroke="var(--border)" />
        {data && w0?.map((w, i) => (
          <line key={i} x1={sx(data.xs[i])} y1={H} x2={sx(data.xs[i])} y2={H - (w / wmax) * BAR} stroke="var(--danger)" strokeWidth={3} />
        ))}
        {[0, 0.5, 1].map((x) => (
          <text key={x} x={sx(x)} y={H + 12} textAnchor="middle" className="viz-label">{x}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {curve ? `query 0.5 attends to about ${ent.toFixed(1)} points; error against the true curve ${mse.toFixed(3)}` : "sampling"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each of 25 noisy points is a key (its position) with a value (its height). The colour curve answers every query
        position with the attention-weighted average of the values, the weights being a softmax of minus squared distance
        over twice the width squared. The red bars are the weights for the query at 0.5. A tiny width is a hard lookup of
        the nearest point and copies its noise; a huge width averages everything into a flat line.
      </figcaption>
    </figure>
  );
}
