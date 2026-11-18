"use client";

import { useState } from "react";

/** Bytes per parameter for mixed-precision Adam: bf16 weights and grads, fp32 master weights and two moments. */
export const PER_PARAM = { weights: 2, grads: 2, optimizer: 12 };

/** Gigabytes per GPU for P parameters on n GPUs under ZeRO stage 0 to 3. */
export function perGpu(P: number, n: number, stage: number) {
  return {
    weights: (PER_PARAM.weights * P) / (stage >= 3 ? n : 1) / 1e9,
    grads: (PER_PARAM.grads * P) / (stage >= 2 ? n : 1) / 1e9,
    optimizer: (PER_PARAM.optimizer * P) / (stage >= 1 ? n : 1) / 1e9,
  };
}

const MODELS = [
  { label: "1.3 B", P: 1.3e9 },
  { label: "7 B", P: 7e9 },
  { label: "70 B", P: 70e9 },
];
const ACT = 20, GPU = 80, GPUS = 8;
const PARTS = [
  { key: "weights", label: "weights", colour: "var(--accent)", opacity: 0.9 },
  { key: "grads", label: "gradients", colour: "var(--accent)", opacity: 0.55 },
  { key: "optimizer", label: "optimiser", colour: "var(--danger)", opacity: 0.7 },
] as const;

export function ZeroShardViz() {
  const [m, setM] = useState(1);
  const P = MODELS[m].P;
  const stages = [0, 1, 2, 3].map((s) => perGpu(P, GPUS, s));
  const totals = stages.map((g) => g.weights + g.grads + g.optimizer + ACT);
  const ymax = Math.max(GPU * 1.25, ...totals);
  const W = 320, H = 170, X0 = 34, PW = W - 42, PH = 140, BW = PW / 4;
  const sy = (v: number) => 8 + PH - (v / ymax) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">model</span>
        {MODELS.map((x, i) => (
          <button key={x.label} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{x.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Memory per GPU under ZeRO stages 0 to 3">
        {stages.map((g, s) => {
          let base = 0;
          const x = X0 + s * BW + BW * 0.18, w = BW * 0.64;
          const segs = PARTS.map((p) => {
            const v = g[p.key], y0 = base;
            base += v;
            return <rect key={p.key} x={x} y={sy(y0 + v)} width={w} height={Math.max(sy(y0) - sy(y0 + v), 0)} fill={p.colour} fillOpacity={p.opacity} />;
          });
          return (
            <g key={s}>
              {segs}
              <rect x={x} y={sy(base + ACT)} width={w} height={sy(base) - sy(base + ACT)} fill="var(--text-muted)" fillOpacity={0.4} />
              <text x={x + w / 2} y={sy(base + ACT) - 4} textAnchor="middle" className="viz-label">{(base + ACT).toFixed(0)}</text>
              <text x={x + w / 2} y={H + 12} textAnchor="middle" className="viz-label">{`stage ${s}`}</text>
            </g>
          );
        })}
        <line x1={X0} y1={sy(GPU)} x2={X0 + PW} y2={sy(GPU)} stroke="var(--danger)" strokeDasharray="4 3" />
        <text x={X0 - 4} y={sy(GPU) + 4} textAnchor="end" className="viz-label">80</text>
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`fits in 80 GB: ${totals.map((t, s) => (t <= GPU ? `stage ${s}` : null)).filter(Boolean).join(", ") || "no stage on 8 GPUs"}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Memory per GPU for mixed-precision Adam training on 8 GPUs, with 20 GB of activations (grey) on top. Stage 0 is
        plain data parallelism: every GPU holds bf16 weights and gradients (2 + 2 bytes per parameter) and 12 bytes of
        fp32 optimiser state. ZeRO stage 1 shards the optimiser state across the GPUs, stage 2 also the gradients, and
        stage 3 the weights as well, so per-GPU model state falls from 16 bytes per parameter to 16/8.
      </figcaption>
    </figure>
  );
}
