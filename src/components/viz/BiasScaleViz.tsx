"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng, solve } from "./ml";

const N = 16, SIGMA = 0.5, LAM = 0.5, SEEDS = 8;
const MS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
const KERNEL = [0.5, -1, 2, 1, -0.5];

/** The true map: a 5-tap filter, wrapping around (circulant) or with zero padding at the ends. */
export function trueMap(wrap: boolean) {
  const T = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++)
    KERNEL.forEach((k, a) => {
      const j = i + a - 2;
      if (wrap) T[i][(j + N) % N] += k;
      else if (j >= 0 && j < N) T[i][j] = k;
    });
  return T;
}

/** Ridge fits of an unconstrained N x N map and of a circulant map; returns excess test error ||W - T||^2 / N for each. */
export function fitBoth(T: number[][], m: number, seed: number) {
  const z = makeNormal(makeRng(seed));
  const X = Array.from({ length: m }, () => Array.from({ length: N }, z));
  const Y = X.map((x) => T.map((row) => row.reduce((a, t, j) => a + t * x[j], 0) + SIGMA * z()));
  const G = Array.from({ length: N }, (_, a) => Array.from({ length: N }, (_, b) => X.reduce((s, x) => s + x[a] * x[b], 0) + (a === b ? LAM : 0)));
  const Wf = Array.from({ length: N }, (_, i) => solve(G, Array.from({ length: N }, (_, a) => X.reduce((s, x, r) => s + x[a] * Y[r][i], 0))));
  const H = Array.from({ length: N }, () => new Array(N).fill(0)), h = new Array(N).fill(0);
  X.forEach((x, r) => {
    for (let i = 0; i < N; i++) {
      const f = Array.from({ length: N }, (_, d) => x[(i - d + N) % N]);
      for (let a = 0; a < N; a++) {
        h[a] += f[a] * Y[r][i];
        for (let b = 0; b < N; b++) H[a][b] += f[a] * f[b];
      }
    }
  });
  for (let a = 0; a < N; a++) H[a][a] += LAM;
  const c = solve(H, h);
  let ef = 0, ec = 0;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      ef += (Wf[i][j] - T[i][j]) ** 2;
      ec += (c[(i - j + N) % N] - T[i][j]) ** 2;
    }
  return [ef / N, ec / N];
}

export function curves(wrap: boolean) {
  const T = trueMap(wrap);
  return MS.map((m) => {
    let f = 0, c = 0;
    for (let s = 0; s < SEEDS; s++) {
      const [a, b] = fitBoth(T, m, 1000 * s + m);
      f += a / SEEDS;
      c += b / SEEDS;
    }
    return [f, c];
  });
}

export function BiasScaleViz() {
  const [wrap, setWrap] = useState(false);
  const [res, setRes] = useState<{ a: number[][]; b: number[][] } | null>(null);
  useEffect(() => setRes({ a: curves(false), b: curves(true) }), []);
  const cur = res ? (wrap ? res.b : res.a) : null;
  const W = 300, H = 200, X0 = 34, PW = W - 42, PH = 172, LMIN = -3, LMAX = 1;
  const sx = (m: number) => X0 + (Math.log2(m) / 9) * PW, sy = (v: number) => 8 + ((LMAX - Math.max(LMIN, Math.min(LMAX, Math.log10(v)))) / (LMAX - LMIN)) * PH;
  const line = (k: number) => cur!.map((e, i) => `${sx(MS[i])},${sy(e[k])}`).join(" ");
  const cross = cur ? MS.find((_, i) => cur[i][0] < cur[i][1]) : undefined;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!wrap} onClick={() => setWrap(false)}>true map has edges</button>
        <button type="button" className="seg" aria-pressed={wrap} onClick={() => setWrap(true)}>true map wraps around</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Test error against number of training examples for an unconstrained and a shift-equivariant linear model">
        <line x1={X0} y1={sy(10 ** LMIN)} x2={X0 + PW} y2={sy(10 ** LMIN)} stroke="var(--border)" />
        <line x1={X0} y1={sy(10 ** LMIN)} x2={X0} y2={sy(10 ** LMAX)} stroke="var(--border)" />
        {cur && <polyline fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 3" points={line(0)} />}
        {cur && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(1)} />}
        {[1, 8, 64, 512].map((m) => (
          <text key={m} x={sx(m)} y={H + 12} textAnchor="middle" className="viz-label">{m}</text>
        ))}
        {[1, 0, -1, -2, -3].map((v) => (
          <text key={v} x={X0 - 4} y={sy(10 ** v) + 4} textAnchor="end" className="viz-label">{v === 0 ? "1" : `1e${v}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {cur ? `at 4 examples: free ${cur[2][0].toFixed(2)}, equivariant ${cur[2][1].toFixed(2)}; at 512: free ${cur[9][0].toFixed(3)}, equivariant ${cur[9][1].toFixed(3)}${cross ? `; free model ahead from ${cross} examples` : ""}` : "fitting"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A signal of length 16 passes through an unknown 5-tap filter, plus noise, and two linear models learn it from the
        given number of examples. Red dashed is an unconstrained 16 × 16 map (256 parameters). The colour curve is a
        shift-equivariant (circulant) map with 16 parameters, a convolution that wraps around. When the truth has edges where
        nothing wraps, the equivariant model learns fast but stops at a floor set by its wrong assumption, and the free model
        overtakes it with enough data. When the truth wraps around, the assumption is right and the constrained model wins at
        every size.
      </figcaption>
    </figure>
  );
}
