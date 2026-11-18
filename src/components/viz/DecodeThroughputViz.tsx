"use client";

import { useState } from "react";

const BW = 3.35e12, PEAK = 989e12, CAP = 80e9;
const MODELS = [
  { name: "7B, 32 KV heads", params: 6.74e9, layers: 32, kv: 32, hd: 128 },
  { name: "8B, 8 KV heads", params: 8.03e9, layers: 32, kv: 8, hd: 128 },
];

/** Decode step time (bf16) for a batch at a context length: the larger of the memory and compute bounds. */
export function decode(m: (typeof MODELS)[number], ctx: number, b: number) {
  const W = 2 * m.params;
  const kv = 2 * m.layers * m.kv * m.hd * ctx * 2;
  const fits = Math.floor((CAP - W) / kv);
  const t = Math.max((W + b * kv) / BW, (2 * m.params * b) / PEAK);
  return { W, kv, fits, t, rate: b / t, perSeq: 1 / t };
}

export function DecodeThroughputViz() {
  const [mi, setMi] = useState(0);
  const [lc, setLc] = useState(12);
  const ctx = 2 ** lc;
  const m = MODELS[mi];
  const { fits } = decode(m, ctx, 1);
  const maxB = 1024;
  const W = 330, H = 190, X0 = 50, Y0 = 8, PW = W - X0 - 10, PH = H - Y0 - 34;
  const pts = Array.from({ length: maxB }, (_, i) => i + 1).filter((b) => b <= Math.max(fits, 1));
  const sx = (b: number) => X0 + (Math.log2(b) / 10) * PW;
  const best = decode(m, ctx, Math.max(fits, 1));
  const top = decode(m, ctx, Math.max(Math.min(fits, maxB), 1)).rate * 1.1;
  const sy = (r: number) => Y0 + PH - (Math.min(r, top) / top) * PH;
  const path = pts.map((b, i) => `${i ? "L" : "M"}${sx(b).toFixed(1)},${sy(decode(m, ctx, b).rate).toFixed(1)}`).join("");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Model">
          {MODELS.map((mm, i) => (
            <button key={mm.name} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{mm.name}</button>
          ))}
        </div>
        <label className="viz-label" htmlFor="dt-c">context: {ctx.toLocaleString("en-IN")} tokens</label>
        <input id="dt-c" type="range" min={9} max={15} step={1} value={lc} onChange={(e) => setLc(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Decode throughput against batch size">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={W - 10} y1={sy((f * top) / 1.1)} y2={sy((f * top) / 1.1)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy((f * top) / 1.1) + 4} textAnchor="end" className="viz-label">{((f * top) / 1.1).toFixed(0)}</text>
          </g>
        ))}
        {[1, 4, 16, 64, 256, 1024].map((b) => (
          <text key={b} x={sx(b)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{b}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">batch (log); tokens per second on the vertical axis</text>
        {fits >= 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />}
        {fits >= 1 && fits <= maxB && <line x1={sx(fits)} x2={sx(fits)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeDasharray="3 3" />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {fits < 1
          ? "not even one sequence fits beside the weights"
          : `${(decode(m, ctx, 1).kv / 1e9).toFixed(2)} GB of cache per sequence; up to ${fits} sequences fit, giving ${best.rate.toFixed(0)} tokens/s in total and ${best.perSeq.toFixed(0)} per sequence`}
      </div>
      <figcaption className="viz-caption">
        Decoding on one 80 GB H100 in bf16. Each step reads the weights once for the whole batch plus every sequence&apos;s
        key-value cache, so throughput rises almost in proportion to the batch while the weights dominate, then flattens as
        the caches take over. The dashed line is where memory runs out. With 32 key-value heads and 4096-token contexts only
        about 30 sequences fit; grouped-query attention with 8 heads makes each cache a quarter as large, so four times as
        many fit and throughput keeps climbing.
      </figcaption>
    </figure>
  );
}
