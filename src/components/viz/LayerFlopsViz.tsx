"use client";

import { useState } from "react";

const MODELS = [
  { name: "7B, full attention heads", layers: 32, vocab: 32000, d: 4096, heads: 32, kv: 32, hidden: 11008 },
  { name: "70B, grouped-query attention", layers: 80, vocab: 128256, d: 8192, heads: 64, kv: 8, hidden: 28672 },
];
const PARTS = ["qkv", "attn", "out", "mlp", "logits"] as const;
const LABELS: Record<string, string> = { qkv: "Q, K, V projections", attn: "attention scores and sum", out: "output projection", mlp: "gated MLP", logits: "logits" };
const COLORS = ["var(--accent)", "var(--danger)", "var(--accent-soft)", "var(--success)", "var(--text-muted)"];

/** Forward FLOPs per token by part, for a token attending to ctx earlier positions. */
export function flopParts(m: (typeof MODELS)[number], ctx: number) {
  const hd = m.d / m.heads;
  const per: Record<string, number> = {
    qkv: m.layers * 2 * m.d * (m.d + 2 * m.kv * hd),
    attn: m.layers * 4 * ctx * m.d,
    out: m.layers * 2 * m.d * m.d,
    mlp: m.layers * 2 * m.d * m.hidden * 3,
    logits: 2 * m.d * m.vocab,
  };
  const params = m.layers * (m.d * (m.d + 2 * m.kv * hd) + m.d * m.d + 3 * m.d * m.hidden) + 2 * m.vocab * m.d;
  const total = PARTS.reduce((s, p) => s + per[p], 0);
  return { per, total, params };
}

export function LayerFlopsViz() {
  const [mi, setMi] = useState(0);
  const [lc, setLc] = useState(12);
  const ctx = 2 ** lc;
  const m = MODELS[mi];
  const { per, total, params } = flopParts(m, ctx);
  const W = 330, PW = W - 8;
  let x = 4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Model">
          {MODELS.map((mm, i) => (
            <button key={mm.name} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{mm.name}</button>
          ))}
        </div>
        <label className="viz-label" htmlFor="lf-c">context: {ctx.toLocaleString("en-IN")} tokens</label>
        <input id="lf-c" type="range" min={9} max={17} step={1} value={lc} onChange={(e) => setLc(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} 40`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Forward FLOPs per token split by part of the model">
        {PARTS.map((p, k) => {
          const w = (per[p] / total) * PW;
          const r = <rect key={p} x={x} y={6} width={w} height={26} fill={COLORS[k]} stroke="var(--bg)" />;
          x += w;
          return r;
        })}
      </svg>
      <div className="viz-label" style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 12 }}>
        {PARTS.map((p, k) => (
          <span key={p}><span style={{ display: "inline-block", width: 10, height: 10, background: COLORS[k], marginRight: 4 }} />{`${LABELS[p]} ${((per[p] / total) * 100).toFixed(1)}%`}</span>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${(total / 1e9).toFixed(1)} GFLOPs per token forward; 2N = ${((2 * params) / 1e9).toFixed(1)} GFLOPs`}
      </div>
      <figcaption className="viz-caption">
        Forward FLOPs for the token at a given position, split by where they are spent, for two Llama-shaped models with
        gated MLPs. At short contexts the weight matrices dominate and the total is close to 2 FLOPs per parameter. The
        attention term grows with the context and has no weights, so 2N undercounts it: for the 7B shape at 32 768 tokens
        it is more than half of all the work. Grouped-query attention shrinks the K and V projections but not the attention
        term.
      </figcaption>
    </figure>
  );
}
