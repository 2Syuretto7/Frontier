"use client";

import { useState } from "react";

const L = 20;
const binom = (n: number, k: number) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};

/** How much each path length contributes to the gradient of a residual network, as a function of the branch gain. */
export function ResidualPathsViz() {
  const [s, setS] = useState(0.3);
  const raw = Array.from({ length: L + 1 }, (_, k) => binom(L, k) * s ** k);
  const tot = raw.reduce((a, b) => a + b, 0);
  const share = raw.map((v) => v / tot);
  const mean = share.reduce((a, v, k) => a + v * k, 0);
  const W = 320, H = 150, bw = (W - 44) / (L + 1);
  const mx = Math.max(...share);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          branch gain s = {s.toFixed(2)}
          <input type="range" min={0.05} max={3} step={0.05} value={s} onChange={(e) => setS(Number(e.target.value))} aria-label="residual branch gain" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Share of the gradient by path length">
        <line x1={34} x2={W - 10} y1={H - 22} y2={H - 22} stroke="var(--border)" />
        {share.map((v, k) => {
          const h = (v / mx) * (H - 36);
          return <rect key={k} x={34 + k * bw + 1} y={H - 22 - h} width={bw - 2} height={h} fill="var(--accent)" />;
        })}
        {[0, 5, 10, 15, 20].map((k) => <text key={k} x={34 + k * bw + bw / 2} y={H - 8} textAnchor="middle" className="viz-label">{k}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {L} blocks, 2^{L} = {2 ** L} paths; average path length {mean.toFixed(1)} blocks
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Expanding the product of (I + J) over {L} blocks gives one term per subset of blocks: a path that goes through the
        branches in that subset and skips the rest. If each branch scales the gradient by s, the paths through k branches
        contribute C({L}, k)·s^k in total. With a small gain most of the gradient travels along short paths, so the network
        trains like an ensemble of shallow ones; only a gain above 1 makes the long paths dominate.
      </figcaption>
    </figure>
  );
}
