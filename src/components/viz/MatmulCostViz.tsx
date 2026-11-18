"use client";

import { useState } from "react";

const N = 4096, K = 4096, PEAK = 989e12, BW = 3.35e12;

/** FLOPs, bytes (bf16) and the two lower bounds on time for an m × 4096 by 4096 × 4096 product on an H100. */
export function matmulCost(m: number) {
  const flops = 2 * m * N * K;
  const bytes = 2 * (m * K + K * N + m * N);
  return { flops, bytes, tc: flops / PEAK, tm: bytes / BW };
}

function fmtT(s: number) {
  return s >= 1e-3 ? `${(s * 1e3).toFixed(2)} ms` : `${(s * 1e6).toFixed(1)} µs`;
}

function fmtN(x: number) {
  const u = ["", "K", "M", "G", "T"];
  let i = 0;
  while (x >= 1000 && i < 4) { x /= 1000; i++; }
  return `${x >= 100 ? x.toFixed(0) : x.toPrecision(3)}${u[i]}`;
}

export function MatmulCostViz() {
  const [e, setE] = useState(0);
  const m = 2 ** e;
  const { flops, bytes, tc, tm } = matmulCost(m);
  const top = Math.max(tc, tm);
  const W = 320, X0 = 96, PW = W - X0 - 70, rh = 26, H = 2 * rh + 8;
  const bars: [string, number, string][] = [
    ["compute bound", tc, "var(--accent)"],
    ["memory bound", tm, "var(--danger)"],
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="mm-m">rows m: {m}</label>
        <input id="mm-m" type="range" min={0} max={14} step={1} value={e} onChange={(ev) => setE(Number(ev.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Compute and memory time bounds for a matrix product">
        {bars.map(([name, t, col], k) => (
          <g key={name}>
            <text x={X0 - 6} y={6 + k * rh + 13} textAnchor="end" className="viz-label" style={{ fontSize: 10 }}>{name}</text>
            <rect x={X0} y={4 + k * rh} width={Math.max((t / top) * PW, 1)} height={rh - 8} fill={col} opacity={t === top ? 1 : 0.45} />
            <text x={X0 + (t / top) * PW + 4} y={6 + k * rh + 13} className="viz-label" style={{ fontSize: 10 }}>{fmtT(t)}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${fmtN(flops)} FLOPs, ${fmtN(bytes)}B moved: ${tc >= tm ? "compute" : "memory"} bound`}
      </div>
      <figcaption className="viz-caption">
        An m × 4096 matrix times a 4096 × 4096 weight in bfloat16 on an H100: the time to do the arithmetic at 989 TFLOPS
        and the time to move the three matrices at 3.35 TB/s. Neither can be beaten, so the larger is a lower bound. With
        one row, as when generating one token, the 34 MB weight must be read for 34 million FLOPs and memory wins by a
        factor of about 300. The FLOPs grow with m but the weight is read once, so from about 512 rows on, arithmetic is the
        limit.
      </figcaption>
    </figure>
  );
}
