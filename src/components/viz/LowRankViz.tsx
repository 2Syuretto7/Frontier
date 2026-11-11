"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { svd, type Mat } from "./la";

const N = 24;
/** A small greyscale picture: a ring, a bar and a soft gradient, values in [0, 1]. */
const IMG: Mat = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
  const r = Math.hypot(i - 9, j - 9);
  let v = 0.15 + 0.25 * (j / N);
  if (r > 4 && r < 7) v = 0.9;
  if (i >= 16 && i <= 19 && j >= 4) v = 0.7;
  if (j >= 18 && j <= 20 && i >= 3 && i <= 14) v = 0.5;
  if (Math.abs(i + j - 34) <= 1 && i < 16) v = 0.8;
  return Math.min(1, v + 0.06 * Math.sin(1.7 * i + 0.9 * j * j));
}));
const { U, s, V } = svd(IMG);
const TOTAL = s.reduce((a, x) => a + x * x, 0);

function approx(k: number): Mat {
  return IMG.map((_, i) => IMG[0].map((_, j) => { let t = 0; for (let q = 0; q < k; q++) t += s[q] * U[i][q] * V[j][q]; return t; }));
}

/** Rank-k approximation of an image from its largest k singular values (Eckart-Young). */
export function LowRankViz() {
  const [k, setK] = useState(2);
  const A = approx(k);
  const kept = s.slice(0, k).reduce((a, x) => a + x * x, 0);
  const err = Math.sqrt(Math.max(0, TOTAL - kept) / TOTAL);
  const cell = (M: Mat, label: string) => (
    <svg viewBox={`0 0 ${N} ${N}`} style={{ width: "min(44%, 200px)", height: "auto", border: "1px solid var(--border)" }} role="img" aria-label={label}>
      {M.map((r, i) => r.map((v, j) => <rect key={i * N + j} x={j} y={i} width={1.02} height={1.02} style={{ fill: "var(--text)", opacity: Math.min(1, Math.max(0, v)) }} />))}
    </svg>
  );
  return (
    <figure className="viz">
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {cell(IMG, "original image")}
        {cell(A, `rank ${k} approximation`)}
      </div>
      <div className="viz-sliders">
        <label>rank k = <span className="mono">{k}</span><input type="range" min={1} max={10} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Left: a 24 × 24 picture, 576 numbers. Right: σ₁u₁v₁ᵀ + … + σ{k}u{k}v{k}ᵀ, which needs only {k} × (24 + 24 + 1) = {k * 49} numbers.
        The largest singular values are {s.slice(0, 4).map((x) => fmtNum(Number(x.toFixed(2)))).join(", ")}, …; the relative error ‖A − A_k‖_F / ‖A‖_F is {fmtNum(Number((100 * err).toFixed(1)))}%.
        No other rank-{k} matrix comes closer.
      </figcaption>
    </figure>
  );
}
