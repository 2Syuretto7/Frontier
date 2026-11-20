"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 4, P = 12, LR = 0.5;
const S = P / N;

const PHASES = [
  { key: "grads", label: "backward" },
  { key: "rs", label: "reduce-scatter" },
  { key: "update", label: "update shard" },
  { key: "ag", label: "all-gather" },
] as const;

/** Four ranks, twelve parameters. Each rank's gradient differs; reduce-scatter leaves rank r the mean of its slice. */
export function zeroData() {
  const rng = rand(11);
  const w = Array.from({ length: P }, () => Math.round(rng() * 8) / 2);
  const g = Array.from({ length: N }, () => Array.from({ length: P }, () => Math.round(rng() * 8 - 4)));
  for (let i = 0; i < P; i++) {
    const s = g[0][i] + g[1][i] + g[2][i];
    const v = (((-s) % N) + N) % N;
    g[3][i] = v > 1 ? v - N : v;                                 // keep every mean a whole number
  }
  const mean = w.map((_, i) => g.reduce((s, row) => s + row[i], 0) / N);
  const neww = w.map((x, i) => x - LR * mean[i]);
  return { w, g, mean, neww };
}

export function ZeroStepViz() {
  const [ph, setPh] = useState(0);
  const d = zeroData();
  const W = 330, X0 = 50, CW = (W - X0 - 6) / P, RH = 24, Y0 = 8;
  const cell = (r: number, i: number): { v: number | null; kind: "grad" | "mean" | "w" | "faint" } => {
    const mine = Math.floor(i / S) === r;
    if (ph === 0) return { v: d.g[r][i], kind: "grad" };
    if (ph === 1) return mine ? { v: d.mean[i], kind: "mean" } : { v: null, kind: "faint" };
    if (ph === 2) return mine ? { v: d.neww[i], kind: "w" } : { v: d.w[i], kind: "faint" };
    return { v: d.neww[i], kind: "w" };
  };
  const sent = [0, (N - 1) * S, (N - 1) * S, 2 * (N - 1) * S][ph];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Phase of the step">
          {PHASES.map((p, j) => <button key={p.key} type="button" className="seg" aria-pressed={ph === j} onClick={() => setPh(j)}>{p.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + N * RH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Buffers on four ranks during a ZeRO step">
        {Array.from({ length: N }, (_, r) => (
          <g key={r}>
            <text x={X0 - 6} y={Y0 + r * RH + 15} textAnchor="end" className="viz-label">rank {r}</text>
            {Array.from({ length: P }, (_, i) => {
              const c = cell(r, i);
              const fill = c.kind === "faint" ? "var(--bg-subtle)" : c.kind === "w" ? "var(--accent)" : c.kind === "mean" ? "var(--accent)" : "var(--surface)";
              const op = c.kind === "mean" ? 0.35 : c.kind === "w" ? 0.8 : 1;
              return (
                <g key={i}>
                  <rect x={X0 + i * CW} y={Y0 + r * RH} width={CW - 1} height={RH - 3} style={{ fill, stroke: "var(--border)" }} opacity={op} />
                  {c.v !== null && (
                    <text x={X0 + i * CW + (CW - 1) / 2} y={Y0 + r * RH + 14} textAnchor="middle" className="mono"
                      style={{ fontSize: 8, fill: c.kind === "w" ? "var(--bg)" : c.kind === "faint" ? "var(--text-faint)" : "var(--text)" }}>
                      {Number.isInteger(c.v) ? c.v : c.v.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
        {[1, 2, 3].map((k) => <line key={k} x1={X0 + k * S * CW - 0.5} x2={X0 + k * S * CW - 0.5} y1={Y0 - 3} y2={Y0 + N * RH} stroke="var(--text-muted)" strokeDasharray="2 2" />)}
        <text x={X0} y={Y0 + N * RH + 12} className="viz-label">shard 0</text>
        <text x={X0 + 3 * S * CW} y={Y0 + N * RH + 12} className="viz-label">shard 3</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {["each rank holds its own full gradient", "each rank holds only the mean gradient for its shard", "each rank updates its shard; other weights are stale", "every rank holds the full updated weights"][ph]}; elements sent per rank so far: {sent}
      </div>
      <figcaption className="viz-caption">
        Four ranks share twelve parameters, three per shard. Reduce-scatter gives each rank the averaged gradient for its own shard
        only, the rank applies the optimiser to that shard with the optimiser state it alone keeps, and all-gather shares the updated
        weights. The two collectives move the same data as one all-reduce.
      </figcaption>
    </figure>
  );
}
