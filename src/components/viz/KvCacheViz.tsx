"use client";

import { useState } from "react";

const LAYERS = 32, HEADS = 32, DH = 128, DC = 512, DR = 64, GPU = 80, WEIGHTS = 16;

type Scheme = "MHA" | "GQA-8" | "MQA" | "MLA";
const SCHEMES: Scheme[] = ["MHA", "GQA-8", "MQA", "MLA"];

/** Bytes of cache per token, all layers, in bf16. */
export function bytesPerToken(s: Scheme) {
  if (s === "MLA") return LAYERS * (DC + DR) * 2;
  const kv = s === "MHA" ? HEADS : s === "GQA-8" ? 8 : 1;
  return 2 * LAYERS * kv * DH * 2;
}

const CONTEXTS = [8192, 32768, 131072];

export function KvCacheViz() {
  const [ctx, setCtx] = useState(32768);
  const [sel, setSel] = useState<Scheme>("GQA-8");
  const free = GPU - WEIGHTS;
  const gb = SCHEMES.map((s) => (bytesPerToken(s) * ctx) / 1e9);
  const W = 330, H = 150, X0 = 46, PW = 270, BH = 22, GAP = 8, Y0 = 8;
  const max = Math.max(free * 1.15, gb[0]);
  const px = (v: number) => X0 + (Math.min(v, max) / max) * PW;
  const i = SCHEMES.indexOf(sel);
  const seqs = Math.floor(free / gb[i]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Attention scheme">
          {SCHEMES.map((s) => (
            <button key={s} className="seg" aria-pressed={sel === s} onClick={() => setSel(s)}>{s}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Context length">
          {CONTEXTS.map((c) => (
            <button key={c} className="seg" aria-pressed={ctx === c} onClick={() => setCtx(c)}>{c / 1024}K</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Key-value cache size of one sequence under four attention schemes">
        {SCHEMES.map((s, j) => (
          <g key={s}>
            <text x={X0 - 6} y={Y0 + j * (BH + GAP) + BH / 2 + 4} textAnchor="end" className="viz-label">{s}</text>
            <rect x={X0} y={Y0 + j * (BH + GAP)} width={Math.max(1, px(gb[j]) - X0)} height={BH} fill={s === sel ? "var(--accent)" : "var(--code-function)"} opacity={s === sel ? 1 : 0.55} />
            <text x={Math.min(px(gb[j]) + 4, X0 + PW - 2)} y={Y0 + j * (BH + GAP) + BH / 2 + 4} textAnchor={px(gb[j]) + 40 > X0 + PW ? "end" : "start"} className="viz-label">{gb[j] < 1 ? gb[j].toFixed(2) : gb[j].toFixed(1)} GB</text>
          </g>
        ))}
        <line x1={px(free)} x2={px(free)} y1={Y0 - 4} y2={Y0 + 4 * (BH + GAP)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <text x={px(free)} y={H - 2} textAnchor="end" className="viz-label">memory left beside the weights</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {sel}: {(bytesPerToken(sel) / 1024).toFixed(0)} KiB per token; one {ctx / 1024}K sequence needs {gb[i].toFixed(2)} GB; {seqs} such
        sequences fit in the {free} GB left on an {GPU} GB accelerator
      </div>
      <figcaption className="viz-caption">
        The key-value cache of one sequence for an 8-billion-parameter model with 32 layers and 32 query heads of width 128,
        stored in bf16. With full multi-head attention a single long sequence fills the accelerator. Sharing each key and value
        head among four query heads (GQA-8) cuts the cache fourfold, one shared head (MQA) by 32, and caching a 576-wide latent per layer (MLA) by about 14 here.
        The number of sequences that fit sets the batch size, and the batch size sets the throughput.
      </figcaption>
    </figure>
  );
}
