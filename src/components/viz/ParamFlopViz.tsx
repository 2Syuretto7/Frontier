"use client";

import { useState } from "react";

const V = 50257;
const MODELS = [
  { name: "small", d: 768, L: 12 },
  { name: "medium", d: 1024, L: 24 },
  { name: "large", d: 1280, L: 36 },
  { name: "XL", d: 1600, L: 48 },
];
const CTXS = [1024, 8192, 65536];
const PARTS = ["embeddings", "attention projections", "MLPs", "attention scores"];
const COLORS = ["var(--text-muted)", "var(--accent)", "var(--success)", "var(--danger)"];

/** Parameter and training-FLOP-per-token breakdowns of a tied GPT with vocabulary V, width d, depth L and context T. */
export function breakdown(d: number, L: number, T: number) {
  const params = [V * d + T * d, 4 * L * d * d, 8 * L * d * d, 0];
  const flops = [2 * V * d, 8 * L * d * d, 16 * L * d * d, 4 * L * T * d].map((f) => 3 * f);
  return { params, flops };
}

function fmt(x: number) {
  if (x >= 1e9) return `${(x / 1e9).toFixed(2)} G`;
  return `${(x / 1e6).toFixed(1)} M`;
}

export function ParamFlopViz() {
  const [mi, setMi] = useState(0);
  const [ti, setTi] = useState(0);
  const { d, L } = MODELS[mi], T = CTXS[ti];
  const { params, flops } = breakdown(d, L, T);
  const W = 320, X0 = 10, PW = W - 20, bh = 26;
  const bar = (vals: number[], y: number) => {
    const tot = vals.reduce((a, b) => a + b, 0);
    let x = X0;
    return vals.map((v, i) => {
      const w = (v / tot) * PW;
      const r = <rect key={i} x={x} y={y} width={w} height={bh} fill={COLORS[i]} />;
      x += w;
      return r;
    });
  };
  const pct = (vals: number[]) => { const t = vals.reduce((a, b) => a + b, 0); return vals.map((v) => `${((100 * v) / t).toFixed(0)}%`); };
  const pp = pct(params), fp = pct(flops);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">GPT-2 shape</span>
        {MODELS.map((m, i) => (
          <button key={m.name} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">context T</span>
        {CTXS.map((c, i) => (
          <button key={c} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{c}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 110`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Share of parameters and of training FLOPs per token in each part of the model">
        <text x={X0} y={14} className="viz-label">{`parameters: ${fmt(params.reduce((a, b) => a + b, 0))}`}</text>
        {bar(params, 20)}
        <text x={X0} y={68} className="viz-label">{`training FLOPs per token: ${fmt(flops.reduce((a, b) => a + b, 0))}`}</text>
        {bar(flops, 74)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 13, margin: "6px 0" }}>
        {PARTS.map((p, i) => (
          <span key={p}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: COLORS[i], marginRight: 4 }} />
            {`${p}: ${pp[i]} of parameters, ${fp[i]} of FLOPs`}
          </span>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Parameters and training FLOPs per token for GPT-2-shaped models with tied embeddings, counting 6 FLOPs per weight
        per token and the attention scores separately. In the small model the embedding table is almost a third of the
        parameters but costs FLOPs only in the unembedding; as models grow, the MLPs and attention projections take over. At
        short contexts the cost is within about 15% of 6 times the parameter count, but the attention scores grow with T, and at 65536
        tokens they dominate even for the largest shape.
      </figcaption>
    </figure>
  );
}
