"use client";

import { useState } from "react";

// an 8B model in 16 bits on one GPU: 16 GB of weights, 3.35 TB/s, 128 KiB of cache per token, 4,096-token contexts
const WB = 16e9,
  KV = 131072,
  CTX = 4096,
  BW = 3.35e12,
  MEM = 62e9,
  PRICE = 2;
const SLOS = [10, 15, 20]; // ms per output token

export const stepMs = (b: number) => ((WB + b * CTX * KV) / BW) * 1000;
export const memCap = Math.floor(MEM / (CTX * KV));

/** Largest batch meeting the time-per-token target and fitting in memory, with its throughput and cost. */
export function operatingPoint(sloMs: number) {
  const bSlo = Math.floor(((sloMs / 1000) * BW - WB) / (CTX * KV));
  const b = Math.min(bSlo, memCap);
  const tps = b / (stepMs(b) / 1000);
  return {
    b,
    bSlo,
    tps,
    perUser: 1000 / stepMs(b),
    cost: (PRICE / (tps * 3600)) * 1e6,
  };
}

export function LatencyThroughputViz() {
  const [si, setSi] = useState(1);
  const op = operatingPoint(SLOS[si]);
  const W = 340,
    H = 200,
    X0 = 44,
    Y0 = 12,
    X1 = W - 10,
    Y1 = H - 26,
    BMAX = 140;
  const tMax = 6000;
  const sx = (b: number) => X0 + (b / BMAX) * (X1 - X0);
  const sy = (v: number) => Y1 - (v / tMax) * (Y1 - Y0);
  const pts = Array.from({ length: BMAX }, (_, i) => i + 1)
    .map((b) => `${sx(b)},${sy(b / (stepMs(b) / 1000))}`)
    .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Time per output token target"
        >
          {SLOS.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              {s} ms
            </button>
          ))}
        </div>
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
        aria-label="Decode throughput against batch size, with latency and memory limits"
      >
        <rect
          x={sx(memCap)}
          y={Y0}
          width={X1 - sx(memCap)}
          height={Y1 - Y0}
          style={{ fill: "var(--bg-subtle)" }}
        />
        <text
          x={(sx(memCap) + X1) / 2}
          y={Y1 - 8}
          textAnchor="middle"
          className="viz-label"
        >
          cache full
        </text>
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--border-strong)" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--border-strong)" />
        <polyline
          points={pts}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <line
          x1={sx(op.bSlo)}
          y1={Y0}
          x2={sx(op.bSlo)}
          y2={Y1}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <circle
          cx={sx(op.b)}
          cy={sy(op.tps)}
          r={5}
          style={{ fill: "var(--accent)" }}
          stroke="var(--text)"
        />
        {[0, 2000, 4000, 6000].map((v) => (
          <text
            key={v}
            x={X0 - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v / 1000}k
          </text>
        ))}
        {[0, 35, 70, 105, 140].map((b) => (
          <text
            key={b}
            x={sx(b)}
            y={Y1 + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {b}
          </text>
        ))}
        <text x={X1} y={H - 1} textAnchor="end" className="viz-label">
          batch size
        </text>
        <text x={X0 + 4} y={Y0 + 8} className="viz-label">
          tokens/s
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        batch {op.b}: {Math.round(op.tps)} tokens/s in all,{" "}
        {op.perUser.toFixed(1)} per user, ${op.cost.toFixed(3)} per million
      </div>
      <figcaption className="viz-caption">
        Each decode step reads the weights once and every sequence&apos;s cache,
        so step time grows linearly with the batch and throughput (curve) rises
        towards a ceiling while each user&apos;s speed falls. A target time per
        token allows batches up to the dashed line; memory for the cache allows
        batches up to the shaded region. The operating point (dot) is the
        largest batch meeting both; at $2 per GPU-hour its cost per million
        output tokens falls as the target loosens.
      </figcaption>
    </figure>
  );
}
