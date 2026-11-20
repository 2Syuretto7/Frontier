"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 16, K = 2, H = 4096;

/** log10 of the binomial coefficient C(n, k). */
export function log10Comb(n: number, k: number) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log10(n - k + i) - Math.log10(i);
  return s;
}

function pick(n: number, k: number, seed: number) {
  const r = rand(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return new Set(idx.slice(0, k));
}

export function FineGrainViz() {
  const [m, setM] = useState(4);
  const [shared, setShared] = useState(1);
  const n = N * m - shared, k = K * m - shared, w = H / m;
  const chosen = pick(n, k, 7 + m);
  const W = 330, Hh = 120, X0 = 6, PW = 318;
  const cols = 32, rows = Math.ceil((n + shared) / cols);
  const bw = PW / Math.min(cols, n + shared), bh = Math.min(22, 80 / rows);
  const lc = log10Comb(n, k);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Granularity">
          {[1, 2, 4, 8].map((v) => (
            <button key={v} className="seg" aria-pressed={m === v} onClick={() => setM(v)}>split ×{v}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Shared experts">
          {[0, 1].map((v) => (
            <button key={v} className="seg" aria-pressed={shared === v} onClick={() => setShared(v)}>{v} shared</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Experts of a mixture layer, with those used by one token highlighted">
        {Array.from({ length: n + shared }, (_, i) => {
          const r = Math.floor(i / cols), c = i % cols;
          const isShared = i < shared;
          const on = isShared || chosen.has(i - shared);
          return (
            <rect key={i} x={X0 + c * bw + 1} y={8 + r * (bh + 4)} width={bw - 2} height={bh} rx={2}
              style={{ fill: isShared ? "var(--accent)" : on ? "var(--code-function)" : "var(--border)" }} />
          );
        })}
        <text x={X0} y={Hh - 18} className="viz-label">each box: one expert of hidden width {w}</text>
        <text x={X0} y={Hh - 4} className="viz-label">{shared ? "highlighted: used by one token; first box: shared by all" : "highlighted: the experts one token uses"}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {n} routed experts, top-{k}{shared ? " plus 1 shared" : ""}; active width {(k + shared) * w} (same compute in every setting); about 10^
        {lc.toFixed(1)} possible expert sets per token
      </div>
      <figcaption className="viz-caption">
        Sixteen experts with top-2 routing, then each expert split into m narrower ones with m times as many chosen, so the
        parameters and the compute per token stay fixed. The number of distinct combinations a token can use explodes, which
        lets experts specialise more narrowly and recombine more freely. Turning one routed slot into a shared expert, used by
        every token, gives common knowledge a fixed home so the routed experts need not each relearn it.
      </figcaption>
    </figure>
  );
}
