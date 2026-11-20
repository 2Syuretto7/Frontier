"use client";

import { useState } from "react";

const P = 70e9, L = 80, H = 8192, A = 64, S = 4096, GPUS = 256, BUDGET = 80;
const TPS = [1, 2, 4, 8], PPS = [1, 4, 8], ZEROS = [0, 1, 3], RECS = ["selective", "full"];

/**
 * Peak memory, in GB, on the first pipeline stage for a 70B-parameter, 80-layer model (width 8192, 64 heads) trained on 256 GPUs
 * with sequences of 4096 tokens, one sequence per micro-batch, mixed-precision Adam, sequence parallelism with tensor parallelism,
 * and a one-forward-one-backward pipeline schedule (the first stage holds p micro-batches of activations).
 */
export function deviceMemory(t: number, p: number, zero: number, rec: string) {
  const d = GPUS / (t * p);
  const n = P / (t * p);
  const w = 2 * n * (zero === 3 ? 1 / d : 1);
  const g = 2 * n * (zero === 3 ? 1 / d : 1);
  const o = 12 * n * (zero >= 1 ? 1 / d : 1);
  const perLayer = rec === "full" ? (2 * S * H) / t : (34 * S * H) / t;
  const act = (L / p) * p * perLayer;
  const gb = (x: number) => x / 1e9;
  return { d, parts: [gb(w), gb(g), gb(o), gb(act)], total: gb(w + g + o + act) };
}

const NAMES = ["weights", "gradients", "optimiser", "activations"];

export function DeviceMemoryViz() {
  const [t, setT] = useState(3);
  const [p, setP] = useState(1);
  const [z, setZ] = useState(1);
  const [r, setR] = useState(0);
  const m = deviceMemory(TPS[t], PPS[p], ZEROS[z], RECS[r]);
  const W = 330, X0 = 80, PW = 236, MAX = 160;
  const px = (v: number) => (Math.min(v, MAX) / MAX) * PW;
  let acc = 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}>
        <div className="segmented" role="group" aria-label="Tensor parallel degree">
          {TPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={t === i} onClick={() => setT(i)}>TP {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Pipeline parallel degree">
          {PPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>PP {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="ZeRO stage">
          {ZEROS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={z === i} onClick={() => setZ(i)}>ZeRO {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Recomputation">
          {RECS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={r === i} onClick={() => setR(i)}>{v} recompute</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} 100`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Memory per GPU by component against an 80 GB budget">
        {m.parts.map((v, i) => {
          const x = X0 + px(acc);
          acc += v;
          return <rect key={i} x={x} y={20} width={Math.max(px(acc) - px(acc - v), 0)} height={24} style={{ fill: i === 3 ? "var(--accent)" : "var(--text-muted)" }} opacity={[0.9, 0.65, 0.4, 0.85][i]} />;
        })}
        {m.total > MAX && <text x={X0 + PW - 4} y={36} textAnchor="end" className="viz-label" style={{ fill: "var(--bg)" }}>off scale</text>}
        <text x={X0 - 6} y={36} textAnchor="end" className="viz-label">first stage</text>
        <line x1={X0 + px(BUDGET)} x2={X0 + px(BUDGET)} y1={14} y2={50} stroke="var(--text)" strokeDasharray="3 2" />
        <text x={X0 + px(BUDGET)} y={10} textAnchor="middle" className="viz-label">80 GB</text>
        {[0, 40, 80, 120, 160].map((v) => <text key={v} x={X0 + px(v)} y={62} textAnchor="middle" className="viz-label">{v}</text>)}
        {NAMES.map((n, i) => (
          <g key={n}>
            <rect x={8 + i * 80} y={76} width={10} height={10} style={{ fill: i === 3 ? "var(--accent)" : "var(--text-muted)" }} opacity={[0.9, 0.65, 0.4, 0.85][i]} />
            <text x={22 + i * 80} y={85} className="viz-label">{n}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        data parallel {m.d}; {m.parts.map((v, i) => `${NAMES[i]} ${v.toFixed(1)}`).join(", ")}; total {m.total.toFixed(1)} GB {m.total <= BUDGET ? "fits" : "does not fit"}
      </div>
      <figcaption className="viz-caption">
        A 70B-parameter model on 256 GPUs with 80 GB each, one 4096-token sequence per micro-batch. Tensor and pipeline parallelism
        divide the parameters each GPU holds; ZeRO divides model state further across the remaining data-parallel replicas. Activations
        on the first pipeline stage do not shrink with more stages, because that stage holds as many micro-batches in flight as there are
        stages.
      </figcaption>
    </figure>
  );
}
