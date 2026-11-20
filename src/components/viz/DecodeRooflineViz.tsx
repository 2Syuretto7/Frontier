"use client";

import { useState } from "react";

const PARAMS = 8e9,
  BYTES = 2; // an 8B-parameter model in 16-bit weights
const PEAK = 400e12,
  BW = 2e12; // accelerator: 400 TFLOP/s, 2 TB/s
const BATCHES = [1, 16, 128, 1024];

/** Seconds per decode step at a given batch size: the slower of weight reads and arithmetic. */
export function stepTime(batch: number) {
  return Math.max((2 * PARAMS * batch) / PEAK, (PARAMS * BYTES) / BW);
}

export function DecodeRooflineViz() {
  const [bi, setBi] = useState(1);
  const b = BATCHES[bi];
  const W = 330,
    X0 = 40,
    Y0 = 8,
    PW = 280,
    PH = 120;
  const lx = (v: number) => X0 + (Math.log2(v) / 11) * PW; // batch 1 to 2048
  const tps = (v: number) => v / stepTime(v);
  const ly = (v: number) => Y0 + PH - ((Math.log10(v) - 2) / 3) * PH; // 100 to 1e5 tokens/s
  const pts = Array.from({ length: 111 }, (_, i) => 2 ** (i / 10))
    .map((v) => `${lx(v)},${ly(tps(v))}`)
    .join(" ");
  const t = stepTime(b);
  const bound =
    (2 * PARAMS * b) / PEAK > (PARAMS * BYTES) / BW
      ? "compute-bound"
      : "memory-bound";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">batch</span>
        <div className="segmented" role="group" aria-label="Decode batch size">
          {BATCHES.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={bi === j}
              onClick={() => setBi(j)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + PH + 18}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Decode throughput against batch size"
      >
        {[2, 3, 4, 5].map((e) => (
          <g key={e}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={ly(10 ** e)}
              y2={ly(10 ** e)}
              stroke="var(--border)"
            />
            <text
              x={X0 - 5}
              y={ly(10 ** e) + 4}
              textAnchor="end"
              className="viz-label"
            >{`1e${e}`}</text>
          </g>
        ))}
        <polyline
          points={pts}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <circle
          cx={lx(b)}
          cy={ly(tps(b))}
          r={5}
          style={{ fill: "var(--text)" }}
        />
        {[1, 32, 1024].map((v) => (
          <text
            key={v}
            x={lx(v)}
            y={Y0 + PH + 13}
            textAnchor="middle"
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        step {(1000 * t).toFixed(1)} ms;{" "}
        {Math.round(b / t).toLocaleString("en-IN")} tokens/s in total; {bound}
      </div>
      <figcaption className="viz-caption">
        Decode throughput, in tokens per second on a log scale, of an
        8B-parameter model with 16-bit weights on an accelerator with 400
        TFLOP/s and 2 TB/s. Each step reads every weight once whatever the
        batch, so throughput grows in proportion to the batch until arithmetic,
        not memory, becomes the limit, and then levels off.
      </figcaption>
    </figure>
  );
}
