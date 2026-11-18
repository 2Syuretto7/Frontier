"use client";

import { useState } from "react";

const L = 32, S = 4096, D = 4096, H = 32, P = 6.74e9, GPUS = 8, CAP = 80e9;
const MODES = [
  { key: "none", name: "store everything" },
  { key: "selective", name: "selective recompute" },
  { key: "full", name: "full recompute" },
] as const;

/** Activation bytes per sample for the whole model (bf16, no tensor parallelism), by recomputation strategy. */
export function actPerSample(mode: string) {
  const sbd = S * D;
  if (mode === "full") return L * 2 * sbd;
  return L * sbd * (34 + (mode === "none" ? (5 * H * S) / D : 0));
}

export function ActivationMemoryViz() {
  const [b, setB] = useState(2);
  const state = (16 * P) / GPUS;
  const W = 330, X0 = 112, PW = W - X0 - 10, rh = 26, Hh = MODES.length * rh + 22;
  const top = 200e9;
  const sx = (v: number) => X0 + (Math.min(v, top) / top) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="am-b">micro-batch per GPU: {b}</label>
        <input id="am-b" type="range" min={1} max={16} step={1} value={b} onChange={(e) => setB(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Memory per GPU for three recomputation strategies">
        {MODES.map((m, k) => {
          const act = actPerSample(m.key) * b;
          const y = 4 + k * rh;
          const total = state + act;
          return (
            <g key={m.key}>
              <text x={X0 - 6} y={y + 14} textAnchor="end" className="viz-label" style={{ fontSize: 10 }}>{m.name}</text>
              <rect x={X0} y={y} width={sx(state) - X0} height={rh - 8} fill="var(--text-muted)" />
              <rect x={sx(state)} y={y} width={Math.max(sx(total) - sx(state), 0.5)} height={rh - 8} fill={total > CAP ? "var(--danger)" : "var(--accent)"} />
              <text x={Math.min(sx(total) + 3, W - 40)} y={y + 14} className="viz-label" style={{ fontSize: 9 }}>{total > top ? `${(total / 1e9).toFixed(0)} GB ›` : `${(total / 1e9).toFixed(0)} GB`}</text>
            </g>
          );
        })}
        <line x1={sx(CAP)} x2={sx(CAP)} y1={0} y2={MODES.length * rh} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={sx(CAP)} y={Hh - 4} textAnchor="middle" className="viz-label" style={{ fontSize: 9 }}>80 GB</text>
      </svg>
      <figcaption className="viz-caption">
        Memory per GPU for a 7-billion-parameter model with 4096-token sequences, its 108 GB of weights, gradients and
        Adam state sharded over 8 GPUs (grey, 13.5 GB). Storing every activation costs about 104 GB per sequence, more than
        the GPU holds even for one. Recomputing only the attention core (selective) cuts it to 18 GB, so three sequences
        fit; recomputing whole layers keeps only each layer&apos;s input, 1 GB per sequence, at the price of a fourth
        forward pass.
      </figcaption>
    </figure>
  );
}
