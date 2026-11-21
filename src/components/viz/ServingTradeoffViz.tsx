"use client";

import { useState } from "react";

const WEIGHTS = 0.43e9,
  KV = 16384,
  BW = 2e12,
  MEM = 24e9;

export function ServingTradeoffViz() {
  const [ctx, setCtx] = useState(1024);
  const [batch, setBatch] = useState(48);
  const step = (b: number) => ((WEIGHTS + b * ctx * KV) / BW) * 1000;
  const cap = Math.floor((MEM * 0.9 - WEIGHTS) / (KV * ctx));
  const bMax = 512;
  const W = 340,
    H = 180,
    x0 = 36,
    x1 = W - 36,
    y0 = 10,
    y1 = H - 28;
  const X = (b: number) => x0 + (b / bMax) * (x1 - x0);
  const tMax = step(bMax);
  const thrMax = (bMax * 1000) / step(bMax);
  const Yt = (v: number) => y1 - (v / tMax) * (y1 - y0);
  const Yr = (v: number) => y1 - (v / thrMax) * (y1 - y0);
  const pts = Array.from({ length: 65 }, (_, i) => 1 + i * 8);
  const lat = pts
    .map(
      (b, i) => `${i ? "L" : "M"}${X(b).toFixed(1)},${Yt(step(b)).toFixed(1)}`,
    )
    .join(" ");
  const thr = pts
    .map(
      (b, i) =>
        `${i ? "L" : "M"}${X(b).toFixed(1)},${Yr((b * 1000) / step(b)).toFixed(1)}`,
    )
    .join(" ");
  const b = Math.min(batch, cap);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          batch: {batch}{" "}
          <input
            type="range"
            min={1}
            max={bMax}
            step={1}
            value={batch}
            onChange={(e) => setBatch(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          context: {ctx}{" "}
          <input
            type="range"
            min={9}
            max={13}
            step={1}
            value={Math.log2(ctx)}
            onChange={(e) => setCtx(2 ** +e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Decode step time and throughput against batch size"
      >
        <line x1={x0} x2={x1} y1={y1} y2={y1} stroke="var(--border-strong)" />
        {cap < bMax && (
          <rect
            x={X(cap)}
            y={y0}
            width={x1 - X(cap)}
            height={y1 - y0}
            fill="var(--danger)"
            opacity={0.12}
          />
        )}
        <path d={lat} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <path
          d={thr}
          fill="none"
          stroke="var(--success)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <line
          x1={X(batch)}
          x2={X(batch)}
          y1={y0}
          y2={y1}
          stroke="var(--text-muted)"
        />
        {[0, 128, 256, 384, 512].map((v) => (
          <text
            key={v}
            x={X(v)}
            y={y1 + 16}
            textAnchor="middle"
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {batch > cap
          ? `the cache holds only ${cap} sequences at this context`
          : `step ${step(b).toFixed(2)} ms, ${Math.round((b * 1000) / step(b))} tokens/s`}
      </p>
      <figcaption className="viz-caption">
        Decoding the capstone model on one GPU with 2 TB/s of bandwidth. Each
        step reads all the weights once plus every cached token of every
        sequence. The solid line is the step time, which every user waits per
        token; the dashed line is total throughput. Batching raises throughput
        almost for free until the cache reads dominate, and the shaded region is
        where the key-value cache no longer fits in memory.
      </figcaption>
    </figure>
  );
}
