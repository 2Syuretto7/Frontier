"use client";

import { useState } from "react";

export const GPUS = [
  { name: "A100", peak: 312e12, bw: 2.0e12 },
  { name: "H100", peak: 989e12, bw: 3.35e12 },
];

const gemm = (m: number, k: number, n: number) => ({ flops: 2 * m * k * n, bytes: 2 * (m * k + k * n + m * n) });
const E = 4096 * 4096;
/** bfloat16 kernels: FLOPs and bytes moved, assuming each tensor is read or written exactly once. */
export const KERNELS = [
  { name: "GEMM 4096³", ...gemm(4096, 4096, 4096) },
  { name: "GEMM 512×4096×4096", ...gemm(512, 4096, 4096) },
  { name: "GEMV (decode)", ...gemm(1, 4096, 4096) },
  { name: "softmax", flops: 5 * E, bytes: 4 * E },
  { name: "add", flops: E, bytes: 6 * E },
];

/** Attainable FLOP/s at a given intensity, the time a kernel needs at best, and which roof bounds it. */
export function bound(k: { flops: number; bytes: number }, g: { peak: number; bw: number }) {
  const ai = k.flops / k.bytes, rate = Math.min(g.peak, ai * g.bw);
  return { ai, rate, time: k.flops / rate, by: ai * g.bw >= g.peak ? "compute" : "memory" };
}

const LX0 = -1, LX1 = 4, LY0 = 11, LY1 = 15.2;

export function RooflineViz() {
  const [gi, setG] = useState(1);
  const [ki, setK] = useState(2);
  const g = GPUS[gi];
  const W = 320, H = 180, X0 = 36, PW = W - 44, PH = 150;
  const sx = (ai: number) => X0 + ((Math.log10(ai) - LX0) / (LX1 - LX0)) * PW;
  const sy = (r: number) => 8 + ((LY1 - Math.log10(r)) / (LY1 - LY0)) * PH;
  const ridge = g.peak / g.bw;
  const sel = bound(KERNELS[ki], g);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {GPUS.map((x, i) => (
          <button key={x.name} type="button" className="seg" aria-pressed={gi === i} onClick={() => setG(i)}>{x.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ marginTop: 4, flexWrap: "wrap", gap: 8 }}>
        {KERNELS.map((k, i) => (
          <button key={k.name} type="button" className="seg" aria-pressed={ki === i} onClick={() => setK(i)}>{k.name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Roofline: attainable throughput against arithmetic intensity">
        <polyline fill="none" stroke="var(--text)" strokeWidth={2}
          points={[10 ** LX0, ridge, 10 ** LX1].map((ai) => `${sx(ai)},${sy(Math.min(g.peak, ai * g.bw))}`).join(" ")} />
        <line x1={sx(ridge)} y1={sy(g.peak)} x2={sx(ridge)} y2={8 + PH} stroke="var(--border)" strokeDasharray="3 3" />
        {KERNELS.map((k, i) => {
          const b = bound(k, g);
          return <circle key={k.name} cx={sx(b.ai)} cy={sy(b.rate)} r={i === ki ? 6 : 4} fill={b.by === "compute" ? "var(--accent)" : "var(--danger)"} fillOpacity={i === ki ? 1 : 0.5} />;
        })}
        {[-1, 0, 1, 2, 3, 4].map((l) => (
          <text key={l} x={sx(10 ** l)} y={H + 12} textAnchor="middle" className="viz-label">{`10^${l}`}</text>
        ))}
        {[12, 13, 14, 15].map((l) => (
          <text key={l} x={X0 - 4} y={sy(10 ** l) + 4} textAnchor="end" className="viz-label">{`10^${l}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${KERNELS[ki].name}: ${sel.ai.toFixed(1)} FLOP/byte, ${sel.by}-bound, at best ${(sel.rate / 1e12).toFixed(1)} TFLOP/s, ${(sel.time * 1e6).toFixed(1)} µs`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The roofline model: a kernel that does F floating-point operations while moving B bytes has arithmetic intensity
        F/B, and can run no faster than the lower of the compute peak and intensity times memory bandwidth. Left of the
        ridge (dashed, at {ridge.toFixed(0)} FLOP/byte on the {g.name}) kernels are memory-bound (red); right of it,
        compute-bound (blue). Large matrix multiplies sit to the right; elementwise work, softmax and the matrix-vector
        products of one-token decoding sit far to the left, where a faster GPU&apos;s extra FLOPs do not help.
      </figcaption>
    </figure>
  );
}
