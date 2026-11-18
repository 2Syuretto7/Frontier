"use client";

import { useState } from "react";

export const N = 16;

/** Peak stored layer inputs and extra forward passes when every k-th layer input is checkpointed in a chain of n layers. */
export function plan(n: number, k: number) {
  const c = Math.ceil(n / k);
  return { peak: c + Math.min(k, n) - 1, extra: n - c };
}

const KS = Array.from({ length: N }, (_, i) => i + 1);

export function CheckpointPlanViz() {
  const [k, setK] = useState(4);
  const { peak, extra } = plan(N, k);
  const W = 320, X0 = 30, PW = W - 40, PH = 100, CW = PW / N;
  const sx = (kk: number) => X0 + ((kk - 1) / (N - 1)) * PW, sy = (v: number) => 30 + PH - (v / N) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">checkpoint every</span>
        {[1, 2, 3, 4, 6, 8, 16].map((kk) => (
          <button key={kk} type="button" className="seg" aria-pressed={k === kk} onClick={() => setK(kk)}>{kk}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${PH + 52}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Which layer inputs are kept, and memory against recomputation for each interval">
        {Array.from({ length: N }, (_, i) => (
          <rect key={i} x={X0 + i * CW + 1} y={4} width={CW - 2} height={14} rx={2}
            fill={i % k === 0 ? "var(--accent)" : "var(--text-muted)"} fillOpacity={i % k === 0 ? 0.85 : 0.25} />
        ))}
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={KS.map((kk) => `${sx(kk)},${sy(plan(N, kk).peak)}`).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" points={KS.map((kk) => `${sx(kk)},${sy(plan(N, kk).extra)}`).join(" ")} />
        <circle cx={sx(k)} cy={sy(peak)} r={4} fill="var(--accent)" />
        <circle cx={sx(k)} cy={sy(extra)} r={4} fill="var(--danger)" />
        {[1, 4, 8, 12, 16].map((kk) => (
          <text key={kk} x={sx(kk)} y={PH + 46} textAnchor="middle" className="viz-label">{kk}</text>
        ))}
        {[0, 8, 16].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`peak ${peak} stored inputs (of ${N}), ${extra} extra layer forwards`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A chain of 16 layers; the strip shows which layer inputs are kept from the forward pass (solid). During the backward
        pass each segment is recomputed from its checkpoint, so memory peaks at the checkpoints plus one segment&apos;s
        inputs (solid curve) and the extra work is every layer that is not a checkpoint (dashed curve). Keeping everything
        costs 16 and no recomputation; checkpointing every fourth layer, near √16, keeps the peak at 7 for 12 extra layer
        forwards, less than one extra forward pass.
      </figcaption>
    </figure>
  );
}
