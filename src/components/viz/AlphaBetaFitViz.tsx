"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const BETA = 25e9, ALPHAS = [1e-6, 5e-6, 25e-6];
const SIZES = Array.from({ length: 10 }, (_, k) => 2 ** (10 + 2 * k));

/** Synthetic ping-pong timings with jitter, and the least-squares fit of t = alpha + n / beta. */
export function measureAndFit(alpha: number, seed = 11) {
  const r = rand(seed), g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const times = SIZES.map((n) => alpha + n / BETA + 0.1 * alpha * g());
  const k = SIZES.length, mx = SIZES.reduce((a, b) => a + b, 0) / k, my = times.reduce((a, b) => a + b, 0) / k;
  let sxy = 0, sxx = 0;
  SIZES.forEach((x, i) => { sxy += (x - mx) * (times[i] - my); sxx += (x - mx) ** 2; });
  const slope = sxy / sxx;
  return { times, a: my - slope * mx, b: 1 / slope };
}

export function AlphaBetaFitViz() {
  const [ai, setAi] = useState(1);
  const alpha = ALPHAS[ai];
  const { times, a, b } = useMemo(() => measureAndFit(alpha), [alpha]);
  const W = 330, H = 190, X0 = 56, Y0 = 10, PW = W - 64, PH = H - Y0 - 34, XMIN = 3, XMAX = 9, YMIN = 0, YMAX = 30;
  const sx = (n: number) => X0 + ((Math.log10(n) - XMIN) / (XMAX - XMIN)) * PW;
  const sy = (gbps: number) => Y0 + PH - ((Math.min(YMAX, Math.max(YMIN, gbps)) - YMIN) / (YMAX - YMIN)) * PH;
  const grid = Array.from({ length: 61 }, (_, i) => 10 ** (XMIN + ((XMAX - XMIN) * i) / 60));
  const bw = (n: number, al: number, be: number) => n / (al + n / be) / 1e9;
  const half = alpha * BETA;
  const kb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)} MB` : `${(n / 1e3).toFixed(0)} KB`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">true latency α</span>
        <div className="segmented" role="group" aria-label="Latency">
          {ALPHAS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={ai === i} onClick={() => setAi(i)}>{`${x * 1e6} µs`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Effective bandwidth against message size, measured and fitted">
        {[0, 10, 20, 30].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{`${v} GB/s`}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={sy(25)} y2={sy(25)} stroke="var(--text-muted)" strokeDasharray="5 3" />
        <path d={grid.map((n, i) => `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(bw(n, a, b)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {SIZES.map((n, i) => <circle key={n} cx={sx(n)} cy={sy(n / times[i] / 1e9)} r={2.8} fill="var(--text)" />)}
        <line x1={sx(half)} x2={sx(half)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeDasharray="3 3" />
        {[3, 5, 7, 9].map((l) => <text key={l} x={sx(10 ** l)} y={Y0 + PH + 14} textAnchor={l === 3 ? "start" : l === 9 ? "end" : "middle"} className="viz-label">{["1 KB", "100 KB", "10 MB", "1 GB"][(l - 3) / 2]}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">message size</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`fitted α = ${(a * 1e6).toFixed(2)} µs, β = ${(b / 1e9).toFixed(2)} GB/s; half bandwidth at αβ = ${kb(half)}`}
      </div>
      <figcaption className="viz-caption">
        Ping-pong timings (dots) on a link with bandwidth 25 GB/s (grey dashes) and the chosen latency, plus random jitter of a
        tenth of the latency, are fitted by least squares to t = α + n/β, and the fitted model gives the blue curve of
        achieved bandwidth n/t. A message reaches half the link&apos;s bandwidth at n = αβ (red): 125 KB when α is 5 µs, and
        625 KB when it is 25 µs. Below that size, latency dominates and merging small messages pays; above it, only bandwidth
        matters.
      </figcaption>
    </figure>
  );
}
