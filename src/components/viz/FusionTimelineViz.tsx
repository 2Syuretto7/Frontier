"use client";

import { useState } from "react";

/** The epilogue after a matmul: add bias, GELU, dropout mask, add residual. Tensor passes are full-size reads plus writes. */
export const OPS = [
  { name: "+ bias", passes: 2 },
  { name: "gelu", passes: 2 },
  { name: "× mask", passes: 3 },
  { name: "+ residual", passes: 3 },
];
const FUSED_PASSES = 4; // read x, mask, residual; write the result
export const LAUNCH_US = 5;
export const BANDWIDTH = 2e12; // bytes per second
const SIZES = [
  { label: "4 K elements", n: 4096 },
  { label: "1 M elements", n: 1 << 20 },
  { label: "64 M elements", n: 1 << 26 },
];

/** Microseconds for each kernel: a fixed launch cost plus the bytes it moves at full bandwidth, in bfloat16. */
export function kernels(fused: boolean, n: number) {
  const us = (passes: number) => LAUNCH_US + (passes * n * 2 * 1e6) / BANDWIDTH;
  return fused ? [{ name: "fused", t: us(FUSED_PASSES) }] : OPS.map((o) => ({ name: o.name, t: us(o.passes) }));
}

export function FusionTimelineViz() {
  const [s, setS] = useState(1);
  const n = SIZES[s].n;
  const eager = kernels(false, n), fused = kernels(true, n);
  const te = eager.reduce((a, k) => a + k.t, 0), tf = fused[0].t;
  const W = 320, X0 = 52, PW = W - X0 - 8, LH = 30;
  const sx = (t: number) => X0 + (t / te) * PW;
  const lane = (ks: { name: string; t: number }[], y: number, colour: string) => {
    let t0 = 0;
    return ks.map((k) => {
      const x = sx(t0), launch = (LAUNCH_US / te) * PW;
      t0 += k.t;
      const w = Math.max(sx(t0) - x - 1, 1);
      return (
        <g key={k.name}>
          <rect x={x} y={y} width={Math.min(launch, w)} height={LH - 8} fill="var(--text-muted)" fillOpacity={0.5} />
          <rect x={x + Math.min(launch, w)} y={y} width={Math.max(w - launch, 0)} height={LH - 8} fill={colour} fillOpacity={0.8} />
          {w > 34 && <text x={x + w / 2} y={y + LH / 2} textAnchor="middle" className="viz-label" style={{ fill: "var(--text)" }}>{k.name}</text>}
        </g>
      );
    });
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SIZES.map((z, i) => (
          <button key={z.label} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{z.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${2 * LH + 8}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Kernel timelines for eager and fused execution of a matmul epilogue">
        <text x={X0 - 6} y={4 + LH / 2} textAnchor="end" className="viz-label">eager</text>
        <text x={X0 - 6} y={4 + LH + LH / 2} textAnchor="end" className="viz-label">fused</text>
        {lane(eager, 4, "var(--danger)")}
        {lane(fused, 4 + LH, "var(--accent)")}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`eager ${te.toFixed(1)} µs in 4 kernels, fused ${tf.toFixed(1)} µs in 1: ${(te / tf).toFixed(2)}× faster`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The four elementwise operations after a matrix multiply, on bfloat16 tensors, with each kernel costing a 5 µs launch
        (grey) plus its memory traffic at 2 TB/s (coloured). Run eagerly, each operation reads its inputs from memory and
        writes its output back: 10 full-tensor passes. Fused into one kernel the intermediates stay in registers: 4 passes.
        Small tensors are dominated by launches, so fusion saves about 4×; large ones by bandwidth, where it saves 2.5×.
      </figcaption>
    </figure>
  );
}
