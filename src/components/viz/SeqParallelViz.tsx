"use client";

import { useState } from "react";

const T = 4;
const REGIONS = [
  { label: "norm", tp: false },
  { label: "attention", tp: true },
  { label: "add", tp: false },
  { label: "norm", tp: false },
  { label: "MLP", tp: true },
  { label: "add", tp: false },
];

/** Per-layer activation memory per rank in units of sbd, following the e7.6.2 accounting without the attention-score term. */
export function spMemory(sp: boolean) {
  return sp ? 34 / T : 10 + 24 / T;
}

export function SeqParallelViz() {
  const [sp, setSp] = useState(false);
  const W = 330, X0 = 44, CW = 44, GAP = 4, RH = 16, Y0 = 20;
  const cx = (j: number) => X0 + j * (CW + GAP);
  const between = (j: number) => cx(j) - GAP / 2;
  const marks: { x: number; label: string }[] = [];
  REGIONS.forEach((r, j) => {
    if (!r.tp) return;
    if (sp) marks.push({ x: between(j), label: "AG" });
    marks.push({ x: between(j + 1), label: sp ? "RS" : "AR" });
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Sequence parallelism">
          <button type="button" className="seg" aria-pressed={!sp} onClick={() => setSp(false)}>tensor parallel only</button>
          <button type="button" className="seg" aria-pressed={sp} onClick={() => setSp(true)}>with sequence parallel</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + T * RH + 30}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Which part of the activations each rank holds in each region of a layer">
        {REGIONS.map((r, j) => <text key={j} x={cx(j) + CW / 2} y={12} textAnchor="middle" className="viz-label">{r.label}</text>)}
        {Array.from({ length: T }, (_, k) => (
          <g key={k}>
            <text x={X0 - 6} y={Y0 + k * RH + 11} textAnchor="end" className="viz-label">rank {k}</text>
            {REGIONS.map((r, j) => {
              const x = cx(j), y = Y0 + k * RH;
              if (r.tp) return <rect key={j} x={x} y={y + 2 + (k * (RH - 4)) / T} width={CW} height={(RH - 4) / T} style={{ fill: "var(--accent)" }} />;
              if (sp) return <rect key={j} x={x + (k * CW) / T} y={y + 2} width={CW / T} height={RH - 4} style={{ fill: "var(--text-muted)" }} />;
              return <rect key={j} x={x} y={y + 2} width={CW} height={RH - 4} style={{ fill: "var(--text-muted)" }} opacity={0.75} />;
            })}
          </g>
        ))}
        {REGIONS.map((_, j) => <rect key={`o${j}`} x={cx(j)} y={Y0} width={CW} height={T * RH} style={{ fill: "none", stroke: "var(--border)" }} />)}
        {marks.map((m, i) => (
          <g key={i}>
            <line x1={m.x} x2={m.x} y1={Y0 - 2} y2={Y0 + T * RH + 4} stroke="var(--text)" strokeDasharray="2 2" />
            <text x={m.x} y={Y0 + T * RH + 16} textAnchor="middle" className="viz-label">{m.label}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        stored activations per rank per layer ≈ {spMemory(sp).toFixed(1)} sbd bytes (plus attention scores); collectives per layer: {sp ? "2 all-gathers, 2 reduce-scatters" : "2 all-reduces"}
      </div>
      <figcaption className="viz-caption">
        Each cell shows what part of a layer&apos;s activations a rank holds: across a cell is the sequence, down a cell the hidden
        dimension. Inside attention and the MLP each rank has a slice of the features. Outside them, tensor parallelism alone leaves
        every rank with the whole activation; sequence parallelism gives each rank a slice of the tokens, and the all-reduce splits
        into its two halves at the region boundaries.
      </figcaption>
    </figure>
  );
}
