"use client";

import { useState } from "react";

const C = 3, H = 2, W = 3;
const FORMATS = ["contiguous (NCHW)", "channels_last (NHWC)", "transposed H and W"] as const;
const COLS = ["var(--accent)", "var(--danger)", "var(--text-muted)"];

/** Strides of a 1 x C x H x W tensor in each layout, as (N, C, H, W) element strides of the logical shape. */
export function strides(f: number): { shape: number[]; st: number[] } {
  if (f === 0) return { shape: [1, C, H, W], st: [C * H * W, H * W, W, 1] };
  if (f === 1) return { shape: [1, C, H, W], st: [C * H * W, 1, W * C, C] };
  return { shape: [1, C, W, H], st: [C * H * W, H * W, 1, W] };
}

export function contiguous(shape: number[], st: number[]) {
  let e = 1;
  for (let i = shape.length - 1; i >= 0; i--) {
    if (shape[i] === 1) continue;
    if (st[i] !== e) return false;
    e *= shape[i];
  }
  return true;
}

export function MemoryFormatViz() {
  const [f, setF] = useState(0);
  const { shape, st } = strides(f);
  const cells: { c: number; a: number; b: number; off: number }[] = [];
  for (let c = 0; c < shape[1]; c++) for (let a = 0; a < shape[2]; a++) for (let b = 0; b < shape[3]; b++) cells.push({ c, a, b, off: c * st[1] + a * st[2] + b * st[3] });
  const Wd = 300, cw = Wd / 18 - 0.4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FORMATS.map((name, i) => (
          <button key={name} type="button" className="seg" aria-pressed={i === f} onClick={() => setF(i)}>{name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${Wd} 112`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Logical index order compared with memory order">
        <text x={0} y={12} className="viz-label">logical order (c, row, col)</text>
        {cells.map((x, i) => (
          <g key={`l${i}`}>
            <rect x={i * (Wd / 18)} y={18} width={cw} height={22} fill={COLS[x.c]} fillOpacity={0.35} stroke="var(--border)" />
            <text x={i * (Wd / 18) + cw / 2} y={33} textAnchor="middle" className="viz-label" style={{ fontSize: 8 }}>{x.off}</text>
          </g>
        ))}
        <text x={0} y={66} className="viz-label">memory, address 0 to 17</text>
        {cells.map((x, i) => (
          <g key={`m${i}`}>
            <rect x={x.off * (Wd / 18)} y={72} width={cw} height={22} fill={COLS[x.c]} fillOpacity={0.35} stroke="var(--border)" />
            <text x={x.off * (Wd / 18) + cw / 2} y={87} textAnchor="middle" className="viz-label" style={{ fontSize: 8 }}>{i}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`shape (${shape.join(", ")}), strides (${st.join(", ")}), is_contiguous: ${contiguous(shape, st) ? "True" : "False"}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A 1 × 3 × 2 × 3 image tensor, coloured by channel. The top row walks the logical indices in order and shows the memory
        address each one maps to; the bottom row shows memory, each cell labelled with its logical position. Channels-last
        stores the three channels of each pixel next to each other, which is what convolution kernels on tensor cores prefer,
        but the logical shape stays NCHW and is_contiguous reports False. Transposing only swaps two strides; no data moves.
      </figcaption>
    </figure>
  );
}
