"use client";

import { useState } from "react";

const P = 70e9, H = 8192, S = 4096, NG = 1024, SEQS = 1024, PEAK = 989e12, EFF = 0.7, NVL = 450e9, IB = 50e9;
const TPS = [1, 2, 4, 8, 16], PPS = [1, 2, 4, 8];

/**
 * A modelled training step of a 70B model on 1024 GPUs with a global batch of 1024 sequences of 4096 tokens, one sequence per
 * micro-batch. Kernels run at 70% of a 989 TFLOP/s peak. Tensor-parallel all-reduces use 450 GB/s links inside an 8-GPU server and
 * 50 GB/s between servers, and are not overlapped. The pipeline bubble adds (p - 1) / m of the busy time. The data-parallel gradient
 * all-reduce runs at 50 GB/s and, when overlapped, hides behind the backward pass (two thirds of compute).
 */
export function stepTime(t: number, p: number, overlap: boolean) {
  const d = NG / (t * p), m = SEQS / d;
  const compute = (6 * P * SEQS * S) / NG / (PEAK * EFF);
  const tp = t > 1 ? (compute * 2 * (t - 1) * PEAK * EFF) / (9 * H * (t <= 8 ? NVL : IB)) : 0;
  const bubble = ((p - 1) / m) * (compute + tp);
  const n = P / (t * p);
  const dpFull = d > 1 ? (4 * n * (d - 1)) / d / IB : 0;
  const dp = overlap ? Math.max(0, dpFull - (2 / 3) * compute) : dpFull;
  const total = compute + tp + bubble + dp;
  return { d, m, parts: [compute, tp, bubble, dp], total, mfu: (compute * EFF) / total };
}

const NAMES = ["compute", "TP comm", "bubble", "DP comm"];
const OP = [0.85, 0.6, 0.35, 0.6];

export function StepTimeViz() {
  const [t, setT] = useState(3);
  const [p, setP] = useState(2);
  const [o, setO] = useState(1);
  const r = stepTime(TPS[t], PPS[p], o === 1);
  const W = 330, X0 = 8, PW = 312, MAX = 20;
  const px = (v: number) => (Math.min(v, MAX) / MAX) * PW;
  let acc = 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}>
        <div className="segmented" role="group" aria-label="Tensor parallel degree">
          {TPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={t === i} onClick={() => setT(i)}>TP {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Pipeline stages">
          {PPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>PP {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Gradient all-reduce overlap">
          {["DP exposed", "DP overlapped"].map((v, i) => <button key={v} type="button" className="seg" aria-pressed={o === i} onClick={() => setO(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} 82`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Breakdown of the time of one training step">
        {r.parts.map((v, i) => {
          const x = X0 + px(acc);
          acc += v;
          return <rect key={i} x={x} y={6} width={Math.max(X0 + px(acc) - x, 0)} height={24} style={{ fill: i === 0 ? "var(--accent)" : "var(--text-muted)" }} opacity={OP[i]} />;
        })}
        {[0, 5, 10, 15, 20].map((v) => <text key={v} x={X0 + px(v)} y={44} textAnchor={v === 0 ? "start" : v === 20 ? "end" : "middle"} className="viz-label">{v} s</text>)}
        {NAMES.map((n, i) => (
          <g key={n}>
            <rect x={8 + i * 80} y={58} width={10} height={10} style={{ fill: i === 0 ? "var(--accent)" : "var(--text-muted)" }} opacity={OP[i]} />
            <text x={22 + i * 80} y={67} className="viz-label">{n}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        DP {r.d}, {r.m} micro-batches per replica; step {r.total.toFixed(1)} s ({r.parts.map((v, i) => `${NAMES[i]} ${v.toFixed(1)}`).join(", ")}); MFU {(100 * r.mfu).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        One step of a modelled 70B training run on 1024 GPUs. Compute is fixed by the model and batch; everything else is overhead
        chosen by the configuration. Tensor parallelism is cheap inside an 8-GPU server and expensive beyond it; pipeline stages add a
        bubble that shrinks with more micro-batches; the gradient all-reduce costs little once it overlaps the backward pass. Memory is ignored here; e10.1.1 decides which configurations fit.
      </figcaption>
    </figure>
  );
}
