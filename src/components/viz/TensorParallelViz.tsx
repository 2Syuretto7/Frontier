"use client";

import { useState } from "react";

const TS = [1, 2, 4, 8];
const D = 4096, TOKENS = 8192;

/** Per-rank MLP weights and the one all-reduce of a Megatron MLP with hidden size 4d, split t ways. */
export function tpMlp(t: number) {
  const weights = (8 * D * D) / t;                 // W1 is d × 4d and W2 is 4d × d
  const hidden = (TOKENS * 4 * D) / t;             // each rank's slice of the hidden activation
  const sent = t > 1 ? (2 * (t - 1)) / t * 2 * TOKENS * D : 0;   // ring all-reduce of bf16 outputs
  return { weights, hidden, sent };
}

export function TensorParallelViz() {
  const [i, setI] = useState(1);
  const t = TS[i];
  const r = tpMlp(t);
  const W = 330, H = 120;
  const shade = (k: number) => 0.25 + (0.65 * k) / Math.max(1, t - 1);
  const Xw = 26, Y0 = 22, BH = 80;
  const w1x = 52, w1w = 92, w1h = 24;
  const hx = 160, hw = 92;
  const w2x = 270, w2w = 24;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Tensor-parallel degree">
          {TS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>t = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Column-split first weight and row-split second weight of an MLP">
        <text x={8 + Xw / 2} y={14} textAnchor="middle" className="viz-label">X</text>
        <rect x={8} y={Y0} width={Xw - 6} height={BH} style={{ fill: "var(--text-muted)" }} opacity={0.5} />
        <text x={w1x + w1w / 2} y={14} textAnchor="middle" className="viz-label">W₁</text>
        {Array.from({ length: t }, (_, k) => <rect key={`a${k}`} x={w1x + (k * w1w) / t} y={Y0} width={w1w / t - 1} height={w1h} style={{ fill: "var(--accent)" }} opacity={shade(k)} />)}
        <text x={hx + hw / 2} y={14} textAnchor="middle" className="viz-label">H = gelu(XW₁)</text>
        {Array.from({ length: t }, (_, k) => <rect key={`h${k}`} x={hx + (k * hw) / t} y={Y0} width={hw / t - 1} height={BH} style={{ fill: "var(--accent)" }} opacity={shade(k)} />)}
        <text x={w2x + w2w / 2} y={14} textAnchor="middle" className="viz-label">W₂</text>
        {Array.from({ length: t }, (_, k) => <rect key={`b${k}`} x={w2x} y={Y0 + (k * BH) / t} width={w2w} height={BH / t - 1} style={{ fill: "var(--accent)" }} opacity={shade(k)} />)}
        <text x={w2x + w2w + 6} y={Y0 + BH / 2 + 4} className="viz-label">Σ</text>
        <text x={w1x + w1w / 2} y={Y0 + w1h + 13} textAnchor="middle" className="viz-label">split by columns</text>
        <text x={w2x + w2w / 2} y={Y0 + BH + 13} textAnchor="middle" className="viz-label">by rows</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        per rank: {(r.weights / 1e6).toFixed(1)} M weights, {(r.hidden / 1e6).toFixed(1)} M hidden activations; all-reduce sends {(r.sent / 1e6).toFixed(1)} MB per rank
      </div>
      <figcaption className="viz-caption">
        An MLP with d = 4096 on 8192 tokens. Splitting the first weight by columns gives each rank a slice of the hidden layer, and the
        activation function acts on each slice separately. Splitting the second weight by rows makes each rank&apos;s output a partial
        sum, so one all-reduce finishes the block. Weights and hidden activations shrink by t; the all-reduce does not.
      </figcaption>
    </figure>
  );
}
