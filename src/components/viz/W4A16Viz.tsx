"use client";

import { useState } from "react";

const BATCHES = [1, 16, 64, 256, 1024];
const K = 8192, N = 8192, BW = 3.35e12, PEAK = 989e12, ALU = 60e12, DEQ_OPS = 4, BM = 64;

/**
 * Modelled time, in microseconds, of one 8192 by 8192 linear layer for a batch of B tokens on an H100-like GPU (3.35 TB/s,
 * 989 TFLOP/s on 16-bit tensor cores, 60 T simple operations per second). bfloat16 weights: the larger of the time to read them and
 * the time to multiply. int4 weights with a 16-bit scale per 128: reading takes a quarter as long, but every program that handles 64
 * tokens unpacks and rescales every weight at about 4 operations each, on the same cores that issue the multiplications.
 */
export function layerTimes(B: number) {
  const mm = (2 * B * K * N) / PEAK;
  const bf16 = Math.max((2 * K * N) / BW, mm);
  const deq = (K * N * DEQ_OPS * Math.ceil(B / BM)) / ALU;
  const int4 = Math.max((K * N * (0.5 + 2 / 128)) / BW, mm + deq);
  return { bf16: bf16 * 1e6, int4: int4 * 1e6 };
}

export function W4A16Viz() {
  const [k, setK] = useState(0);
  const W = 330, H = 170, X0 = 40, PW = 270, Y0 = 8, PH = 128;
  const lx = (b: number) => X0 + (Math.log2(b) / 10) * PW;
  const ly = (t: number) => Y0 + PH - ((Math.log10(t) - 0.5) / 2) * PH;
  const pts = Array.from({ length: 41 }, (_, i) => 2 ** (i / 4));
  const line = (key: "bf16" | "int4") => pts.map((b) => `${lx(b)},${ly(layerTimes(b)[key])}`).join(" ");
  const B = BATCHES[k], t = layerTimes(B);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Batch size">
          {BATCHES.map((b, i) => <button key={b} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>batch {b}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Time of a linear layer against batch size, for bfloat16 and int4 weights">
        {[10, 30, 100, 300].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={ly(v)} y2={ly(v)} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={X0 - 4} y={ly(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[1, 4, 16, 64, 256, 1024].map((b) => <text key={b} x={lx(b)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{b}</text>)}
        <polyline points={line("bf16")} style={{ fill: "none", stroke: "var(--text-muted)" }} strokeWidth={2} />
        <polyline points={line("int4")} style={{ fill: "none", stroke: "var(--accent)" }} strokeWidth={2} />
        <line x1={lx(B)} x2={lx(B)} y1={Y0} y2={Y0 + PH} stroke="var(--text-faint)" />
        <circle cx={lx(B)} cy={ly(t.bf16)} r={3.5} style={{ fill: "var(--text-muted)" }} />
        <circle cx={lx(B)} cy={ly(t.int4)} r={3.5} style={{ fill: "var(--accent)" }} />
        <text x={X0 + PW} y={Y0 + PH - 4} textAnchor="end" className="viz-label">accent: int4 weights; grey: bfloat16</text>
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">batch size (tokens); time in µs, log scales</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        batch {B}: bfloat16 {t.bf16.toFixed(1)} µs, int4 {t.int4.toFixed(1)} µs, so int4 is {(t.bf16 / t.int4).toFixed(2)}× as fast
      </div>
      <figcaption className="viz-caption">
        A modelled 8192 by 8192 layer on an H100-like GPU. Decoding a few tokens is limited by reading the weights, so 4-bit weights are
        close to four times faster. As the batch grows the layer becomes limited by arithmetic, and the work of unpacking and rescaling
        the weights, repeated by every program, makes the quantised kernel slower than the plain one.
      </figcaption>
    </figure>
  );
}
