"use client";

import { useMemo, useState } from "react";

const LAYERS = 32, KV_HEADS = 8, D_HEAD = 128, BYTES = 2;
const STATE_BYTES = 8192 * 128 * BYTES; // one Mamba-2-style layer: inner width 8,192 with state size 128
const GIB = 2 ** 30;

/** Layer pattern with one attention layer per `period` layers ("A"), the rest recurrent ("R"); period 0 means no attention. */
export function pattern(period: number) {
  return Array.from({ length: LAYERS }, (_, i) => (period === 1 || (period > 0 && i % period === Math.floor(period / 2)) ? "A" : "R"));
}

/** Inference memory in GiB for one sequence of `n` tokens: key-value cache of attention layers plus recurrent states. */
export function memoryGiB(pat: string[], n: number) {
  const a = pat.filter((p) => p === "A").length;
  return (a * 2 * KV_HEADS * D_HEAD * n * BYTES + (pat.length - a) * STATE_BYTES) / GIB;
}

const OPTIONS = [
  { period: 1, label: "all attention" },
  { period: 4, label: "1 in 4" },
  { period: 8, label: "1 in 8" },
  { period: 0, label: "no attention" },
];

export function HybridMemoryViz() {
  const [period, setPeriod] = useState(8);
  const pat = useMemo(() => pattern(period), [period]);
  const lens = Array.from({ length: 41 }, (_, i) => 2 ** (10 + i * 0.2));
  const W = 330, H = 230, X0 = 40, PW = 280, Y0 = 40, PH = 140, LMIN = -2, LMAX = 2;
  const px = (n: number) => X0 + ((Math.log2(n) - 10) / 8) * PW;
  const py = (g: number) => Y0 + PH - ((Math.log10(Math.max(g, 1e-3)) - LMIN) / (LMAX - LMIN)) * PH;
  const line = (p: string[]) => lens.map((n) => `${px(n).toFixed(1)},${py(memoryGiB(p, n)).toFixed(1)}`).join(" ");
  const at = 32768;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Attention layers">
          {OPTIONS.map((o) => (
            <button key={o.period} className="seg" aria-pressed={period === o.period} onClick={() => setPeriod(o.period)}>{o.label}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Layer pattern and inference memory against context length">
        {pat.map((p, i) => (
          <rect key={i} x={X0 + i * (PW / LAYERS) + 0.5} y={6} width={PW / LAYERS - 1} height={18} rx={1.5} style={{ fill: p === "A" ? "var(--code-string)" : "var(--accent)" }} opacity={p === "A" ? 1 : 0.3} />
        ))}
        <text x={X0 - 4} y={19} textAnchor="end" className="viz-label">layers</text>
        {[-2, -1, 0, 1, 2].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(10 ** e) + 3} textAnchor="end" className="viz-label">{e >= 0 ? 10 ** e : `10${["⁻³", "⁻²", "⁻¹"][e + 3]}`}</text>
          </g>
        ))}
        {OPTIONS.filter((o) => o.period !== period).map((o) => (
          <polyline key={o.period} points={line(pattern(o.period))} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        ))}
        <polyline points={line(pat)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[1024, 8192, 65536, 262144].map((n) => (
          <text key={n} x={px(n)} y={Y0 + PH + 12} textAnchor={n === 262144 ? "end" : n === 1024 ? "start" : "middle"} className="viz-label">{n >= 1024 ? `${n / 1024}K` : n}</text>
        ))}
        <text x={X0} y={H - 18} className="viz-label">context length; memory in GiB, both log scale</text>
        <text x={X0} y={H - 4} className="viz-label">solid blocks: attention layers; faint: recurrent</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {pat.filter((p) => p === "A").length} attention layers: {memoryGiB(pat, at).toFixed(3)} GiB per sequence at 32K tokens
      </div>
      <figcaption className="viz-caption">
        Inference memory for one sequence in a 32-layer model with 8 key-value heads of width 128 in its attention layers and
        a recurrent state of 2 MiB in each other layer, all in 16-bit precision. The key-value cache grows with the context and
        soon dominates whenever there are any attention layers, so the memory of a hybrid is set almost entirely by how many it
        keeps. A purely recurrent model uses constant memory but gives up exact recall.
      </figcaption>
    </figure>
  );
}
