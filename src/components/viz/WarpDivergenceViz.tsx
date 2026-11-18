"use client";

import { useState } from "react";

const WARPS = 4, LANES = 32, N = WARPS * LANES, COST = 4;

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PATTERNS = ["x[i] > 0, random x", "i % 2 == 0", "i < 48", "warp-uniform", "x[i] > 0, rare"];

/** Branch condition per thread for each pattern, and the cycles a SIMT machine issues when both paths cost COST. */
export function divergence(p: number) {
  const r = rand(11);
  const conds = Array.from({ length: N }, (_, i) =>
    p === 0 ? r() < 0.5 : p === 1 ? i % 2 === 0 : p === 2 ? i < 48 : p === 3 ? Math.floor(i / LANES) % 2 === 0 : r() < 0.03,
  );
  let cycles = 0;
  for (let w = 0; w < WARPS; w++) {
    const ws = conds.slice(w * LANES, (w + 1) * LANES);
    cycles += (ws.some((c) => c) ? COST : 0) + (ws.some((c) => !c) ? COST : 0);
  }
  return { conds, cycles, eff: (N * COST) / (cycles * LANES) };
}

export function WarpDivergenceViz() {
  const [p, setP] = useState(0);
  const { conds, cycles, eff } = divergence(p);
  const cs = 9.5, X0 = 46, W = X0 + LANES * cs + 4, rh = 16, H = WARPS * rh + 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Branch condition">
          {PATTERNS.map((name, i) => (
            <button key={name} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>{name}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Which lanes of four warps take the branch">
        {Array.from({ length: WARPS }, (_, w) => {
          const ws = conds.slice(w * LANES, (w + 1) * LANES);
          const div = ws.some((c) => c) && ws.some((c) => !c);
          return (
            <g key={w}>
              <text x={X0 - 4} y={4 + w * rh + 11} textAnchor="end" className="viz-label" style={{ fontSize: 9, fill: div ? "var(--danger)" : undefined }}>{`warp ${w}`}</text>
              {ws.map((c, l) => (
                <rect key={l} x={X0 + l * cs} y={4 + w * rh} width={cs - 1} height={rh - 3} fill={c ? "var(--accent)" : "var(--accent-soft)"} stroke="var(--border)" strokeWidth={0.5} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${cycles} cycles issued for 4 warps (16 if no warp diverged); lane efficiency ${(eff * 100).toFixed(0)}%`}
      </div>
      <figcaption className="viz-caption">
        Four warps of 32 threads run <code>if</code> with a cost of 4 cycles on either side. Dark lanes take the branch,
        light lanes do not. A warp whose lanes disagree runs both sides, one after the other, with the other lanes masked
        off. Random conditions and <code>i % 2</code> make every warp diverge and halve the throughput; when the condition
        is the same across each warp, nothing is lost. Even a rare condition costs a lot: a single lane in a warp is enough
        to make it run both sides.
      </figcaption>
    </figure>
  );
}
