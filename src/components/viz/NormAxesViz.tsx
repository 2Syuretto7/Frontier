"use client";

import { useState } from "react";

const X = [
  [2.0, 9.0, -1.0, 4.0],
  [0.5, 7.0, 1.0, 3.5],
  [3.5, 13.0, 0.0, 4.5],
];
type Mode = "batch" | "layer" | "rms";

function apply(mode: Mode) {
  const n = X.length, d = X[0].length;
  if (mode === "batch") {
    const mu = X[0].map((_, j) => X.reduce((s, r) => s + r[j], 0) / n);
    const sd = X[0].map((_, j) => Math.sqrt(X.reduce((s, r) => s + (r[j] - mu[j]) ** 2, 0) / n));
    return X.map((r) => r.map((v, j) => (v - mu[j]) / sd[j]));
  }
  return X.map((r) => {
    const mu = mode === "layer" ? r.reduce((s, v) => s + v, 0) / d : 0;
    const sd = Math.sqrt(r.reduce((s, v) => s + (v - mu) ** 2, 0) / d);
    return r.map((v) => (v - mu) / sd);
  });
}

/** Which axis batch, layer and RMS normalisation average over, on a 3-example, 4-feature batch. */
export function NormAxesViz() {
  const [mode, setMode] = useState<Mode>("batch");
  const [hot, setHot] = useState(0);
  const Y = apply(mode);
  const cw = 46, ch = 24, gap = 26, W = 4 * cw * 2 + gap + 20;
  const inGroup = (i: number, j: number) => (mode === "batch" ? j === hot : i === hot);
  const grid = (M: number[][], x0: number, title: string) => (
    <g>
      <text x={x0 + 2 * cw} y={12} textAnchor="middle" className="viz-label">{title}</text>
      {M.map((r, i) =>
        r.map((v, j) => (
          <g key={`${i}-${j}`} onClick={() => setHot(mode === "batch" ? j : i)} style={{ cursor: "pointer" }}>
            <rect x={x0 + j * cw} y={20 + i * ch} width={cw - 2} height={ch - 2} fill={inGroup(i, j) ? "var(--accent-soft)" : "var(--bg)"} stroke={inGroup(i, j) ? "var(--accent)" : "var(--border)"} />
            <text x={x0 + j * cw + cw / 2 - 1} y={20 + i * ch + 15} textAnchor="middle" className="viz-label">{v.toFixed(2)}</text>
          </g>
        )),
      )}
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(["batch", "layer", "rms"] as Mode[]).map((m) => (
          <button key={m} type="button" className="seg" aria-pressed={mode === m} onClick={() => { setMode(m); setHot(0); }}>
            {m === "batch" ? "BatchNorm" : m === "layer" ? "LayerNorm" : "RMSNorm"}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${20 + 3 * ch + 6}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Input batch and normalised output">
        {grid(X, 4, "input: rows are examples")}
        {grid(Y, 4 + 4 * cw + gap, "output")}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "batch"
          ? "BatchNorm normalises each feature (a column) using the statistics of the batch, so every column of the output has mean 0 and variance 1, and one example's output depends on the others in its batch."
          : mode === "layer"
            ? "LayerNorm normalises each example (a row) on its own, using the mean and variance of its features. Rows of the output have mean 0 and variance 1, whatever else is in the batch."
            : "RMSNorm also works row by row but only divides by the root mean square, without subtracting the mean. It is cheaper, and in practice works as well as LayerNorm."}{" "}
        Tap a cell to highlight the group it is normalised with.
      </figcaption>
    </figure>
  );
}
