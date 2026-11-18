"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 24;
const BASE = Array.from({ length: N }, (_, i) => (i >= 4 && i < 8 ? 1 : 0) + (i >= 11 && i < 13 ? 0.6 : 0));
const KERNEL = [-1, 0, 1];

export const roll = (x: number[], s: number) => x.map((_, i) => x[(((i - s) % N) + N) % N]);

/** Circular cross-correlation: out[i] = sum_u k[u] x[i + u - 1]. */
export const conv = (x: number[]) => x.map((_, i) => KERNEL.reduce((a, k, u) => a + k * x[(i + u - 1 + N) % N], 0));

export function denseMatrix(seed: number) {
  const z = makeNormal(makeRng(seed));
  return Array.from({ length: N }, () => Array.from({ length: N }, () => z() / Math.sqrt(N)));
}

export const apply = (A: number[][], x: number[]) => A.map((row) => row.reduce((a, w, j) => a + w * x[j], 0));

export function ShiftEquivarianceViz() {
  const [shift, setShift] = useState(0);
  const [dense, setDense] = useState(false);
  const [A, setA] = useState<number[][] | null>(null);
  useEffect(() => setA(denseMatrix(3)), []);
  const f = (x: number[]) => (dense ? (A ? apply(A, x) : x.map(() => 0)) : conv(x));
  const x = roll(BASE, shift), y = f(x), y0 = roll(f(BASE), shift);
  const gap = Math.max(...y.map((v, i) => Math.abs(v - y0[i])));
  const W = 330, BW = (W - 20) / N, X0 = 10;
  const bars = (vals: number[], top: number, h: number, scale: number, pos: string, neg: string) =>
    vals.map((v, i) => {
      const len = Math.min(Math.abs(v) * scale, h), y1 = v >= 0 ? top + h - len : top + h;
      return <rect key={i} x={X0 + i * BW + 1} y={y1} width={BW - 2} height={len} fill={v >= 0 ? pos : neg} />;
    });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => setShift((s) => s - 1)}>shift left</button>
        <button type="button" className="seg" onClick={() => setShift((s) => s + 1)}>shift right</button>
        <button type="button" className="seg" aria-pressed={!dense} onClick={() => setDense(false)}>convolution</button>
        <button type="button" className="seg" aria-pressed={dense} onClick={() => setDense(true)}>dense layer</button>
      </div>
      <svg viewBox={`0 0 ${W} 190`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="An input signal and the layer's output, as the input is shifted">
        <text x={X0} y={12} className="viz-label">input</text>
        {bars(x, 16, 50, 50, "var(--text-muted)", "var(--text-muted)")}
        <line x1={X0} y1={66} x2={W - 10} y2={66} stroke="var(--border)" />
        <text x={X0} y={92} className="viz-label">output</text>
        {bars(y, 96, 40, 40, "var(--accent)", "var(--danger)")}
        <line x1={X0} y1={136} x2={W - 10} y2={136} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        shift {shift}: largest gap between f(shifted x) and shifted f(x) is {gap.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The convolution uses the kernel (−1, 0, 1) with wrap-around at the ends, so it marks rising edges (colour) and falling
        edges (red). Shift the input and the output shifts by exactly the same amount: the layer is translation equivariant.
        A dense layer with random weights has no such structure, and shifting its input changes the output unpredictably.
      </figcaption>
    </figure>
  );
}
