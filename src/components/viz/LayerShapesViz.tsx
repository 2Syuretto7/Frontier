"use client";

import { useState } from "react";

type Box = { name: string; r: number; c: number; hue: string };

/** Shapes of the forward and backward matrix products of one dense layer on a batch. */
export function LayerShapesViz() {
  const [n, setN] = useState(4), [din, setDin] = useState(3), [dout, setDout] = useState(5);
  const [mode, setMode] = useState<"fwd" | "dW" | "dX">("fwd");
  const S = 9;
  const rows: Record<typeof mode, [Box, Box, Box, string]> = {
    fwd: [{ name: "X", r: n, c: din, hue: "var(--text-muted)" }, { name: "W", r: din, c: dout, hue: "var(--accent)" }, { name: "Z", r: n, c: dout, hue: "var(--text)" }, "Z = X W + b: each row of X is one example, mapped to dout outputs."],
    dW: [{ name: "Xᵀ", r: din, c: n, hue: "var(--text-muted)" }, { name: "Δ", r: n, c: dout, hue: "var(--danger)" }, { name: "∂L/∂W", r: din, c: dout, hue: "var(--accent)" }, "∂L/∂W = Xᵀ Δ: the sum over the batch of each example's outer product x δᵀ. Its shape is W's shape."],
    dX: [{ name: "Δ", r: n, c: dout, hue: "var(--danger)" }, { name: "Wᵀ", r: dout, c: din, hue: "var(--accent)" }, { name: "∂L/∂X", r: n, c: din, hue: "var(--text-muted)" }, "∂L/∂X = Δ Wᵀ: every example's delta sent back through the weights, to become the previous layer's incoming gradient."],
  };
  const [a, b, c, text] = rows[mode];
  const box = (bx: Box, x: number) => (
    <g>
      <rect x={x} y={14} width={bx.c * S} height={bx.r * S} fill="none" stroke={bx.hue} strokeWidth={1.6} />
      <text x={x + (bx.c * S) / 2} y={10} textAnchor="middle" className="viz-label">{bx.name}</text>
      <text x={x + (bx.c * S) / 2} y={bx.r * S + 28} textAnchor="middle" className="viz-label">{bx.r}×{bx.c}</text>
    </g>
  );
  const xa = 4, xb = xa + a.c * S + 22, xc = xb + b.c * S + 26;
  const W = xc + c.c * S + 6;
  const slider = (label: string, v: number, set: (v: number) => void) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {v}
      <input type="range" min={1} max={8} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={mode === "fwd"} onClick={() => setMode("fwd")}>forward</button>
        <button type="button" className="seg" aria-pressed={mode === "dW"} onClick={() => setMode("dW")}>∂L/∂W</button>
        <button type="button" className="seg" aria-pressed={mode === "dX"} onClick={() => setMode("dX")}>∂L/∂X</button>
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        {slider("N", n, setN)}
        {slider("din", din, setDin)}
        {slider("dout", dout, setDout)}
      </div>
      <svg viewBox={`0 0 ${Math.max(W, 200)} ${8 * S + 36}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Matrix shapes of one product">
        {box(a, xa)}
        <text x={xb - 12} y={14 + 4 * S} textAnchor="middle" className="viz-label">·</text>
        {box(b, xb)}
        <text x={xc - 14} y={14 + 4 * S} textAnchor="middle" className="viz-label">=</text>
        {box(c, xc)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {text} Δ = ∂L/∂Z has the shape of Z, N×dout. In every product the inner sizes match, and only one arrangement of the
        available matrices gives the required shape.
      </figcaption>
    </figure>
  );
}
