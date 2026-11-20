"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 512, E = 16;

/** Top-1 expert of each token: uniform, or skewed towards low-numbered experts. */
export function assign(skew: number) {
  const r = rand(53);
  const w = Array.from({ length: E }, (_, i) => Math.exp(-skew * i));
  const s = w.reduce((a, b) => a + b, 0);
  const cum: number[] = [];
  w.reduce((acc, v, i) => ((cum[i] = acc + v / s), acc + v / s), 0);
  return Array.from({ length: T }, () => {
    const u = r();
    const i = cum.findIndex((c) => u < c);
    return i < 0 ? E - 1 : i;
  });
}

export function ExpertCapacityViz() {
  const [cf, setCf] = useState(1.25);
  const [skew, setSkew] = useState(0);
  const choice = useMemo(() => assign(skew), [skew]);
  const cap = Math.ceil((cf * T) / E);
  const counts = new Array<number>(E).fill(0);
  choice.forEach((e) => counts[e]++);
  const dropped = counts.reduce((s, c) => s + Math.max(0, c - cap), 0);
  const used = counts.reduce((s, c) => s + Math.min(c, cap), 0);
  const W = 330, H = 160, X0 = 26, PW = 296, Y0 = 8, PH = 125, YM = 90;
  const bw = PW / E;
  const py = (v: number) => Y0 + PH - (Math.min(v, YM) / YM) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Capacity factor">
          {[1, 1.25, 1.5, 2].map((v) => (
            <button key={v} className="seg" aria-pressed={cf === v} onClick={() => setCf(v)}>CF {v}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Router skew">
          {[0, 0.05, 0.12].map((v, i) => (
            <button key={v} className="seg" aria-pressed={skew === v} onClick={() => setSkew(v)}>{["balanced", "mild skew", "strong skew"][i]}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Tokens per expert against the capacity limit">
        {[0, 30, 60, 90].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {counts.map((c, i) => (
          <g key={i}>
            <rect x={X0 + i * bw + 2} y={py(Math.min(c, cap))} width={bw - 4} height={py(0) - py(Math.min(c, cap))} fill="var(--code-function)" />
            {c > cap ? <rect x={X0 + i * bw + 2} y={py(c)} width={bw - 4} height={py(cap) - py(c)} style={{ fill: "var(--danger)" }} /> : null}
            {c < cap ? <rect x={X0 + i * bw + 2} y={py(cap)} width={bw - 4} height={py(c) - py(cap)} fill="none" stroke="var(--text-muted)" strokeDasharray="2 2" /> : null}
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={py(cap)} y2={py(cap)} stroke="var(--text)" strokeWidth={1.2} />
        <text x={X0} y={H - 2} className="viz-label">tokens per expert; red: dropped; dashed: padding</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        capacity {cap} per expert: {dropped} of {T} tokens dropped ({((100 * dropped) / T).toFixed(1)}%), {(100 * (1 - used / (cap * E))).toFixed(1)}% of
        slots wasted on padding
      </div>
      <figcaption className="viz-caption">
        512 tokens routed top-1 to 16 experts, each with a fixed buffer of capacity factor × 512/16 slots. Tokens beyond an
        expert&apos;s capacity skip the layer and pass through only on the residual stream; unused slots are still computed as
        padding. Even with a perfectly balanced router, random fluctuations overflow some experts at a capacity factor of 1, and
        a skewed router makes the trade far worse: raising the factor cuts drops only by paying for more padding.
      </figcaption>
    </figure>
  );
}
