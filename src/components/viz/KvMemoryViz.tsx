"use client";

import { useState } from "react";

const GIB = 2 ** 30;
const MEM = 96,
  WEIGHTS = 16; // GiB: accelerator memory and an 8B model in 16-bit weights
const LAYERS = 32,
  HEAD_DIM = 128;
const ATTN: [string, number][] = [
  ["32 KV heads", 32],
  ["8 KV heads", 8],
  ["2 KV heads", 2],
];
const CTX = [2048, 8192, 32768];

/** GiB of KV cache for one sequence of the given length. */
export function perSeqGiB(kvHeads: number, ctx: number) {
  return (2 * LAYERS * kvHeads * HEAD_DIM * 2 * ctx) / GIB;
}

export function KvMemoryViz() {
  const [ai, setAi] = useState(0);
  const [ci, setCi] = useState(1);
  const per = perSeqGiB(ATTN[ai][1], CTX[ci]);
  const batch = Math.floor((MEM - WEIGHTS) / per);
  const shown = Math.min(batch, 40);
  const W = 330,
    X0 = 10,
    PW = 310,
    Y0 = 6,
    BH = 34;
  const x = (g: number) => X0 + (g / MEM) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Attention layout">
          {ATTN.map(([name], j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={ai === j}
              onClick={() => setAi(j)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Context length">
          {CTX.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ci === j}
              onClick={() => setCi(j)}
            >{`${v / 1024}K`}</button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + BH + 22}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Accelerator memory split between weights and KV caches"
      >
        <rect
          x={x(0)}
          y={Y0}
          width={x(MEM) - x(0)}
          height={BH}
          rx={3}
          style={{ fill: "var(--bg-subtle)" }}
          stroke="var(--border)"
        />
        <rect
          x={x(0)}
          y={Y0}
          width={x(WEIGHTS) - x(0)}
          height={BH}
          rx={3}
          style={{ fill: "var(--text-muted)" }}
        />
        {Array.from({ length: shown }, (_, i) => {
          const g0 = WEIGHTS + i * per * (batch / shown);
          const w = x(per * (batch / shown)) - x(0);
          return (
            <rect
              key={i}
              x={x(g0) + 0.5}
              y={Y0 + 3}
              width={Math.max(w - 1, 0.8)}
              height={BH - 6}
              rx={1.5}
              style={{ fill: "var(--accent)" }}
              opacity={0.55 + 0.45 * (i % 2)}
            />
          );
        })}
        <text
          x={x(WEIGHTS / 2)}
          y={Y0 + BH + 15}
          textAnchor="middle"
          className="viz-label"
        >
          weights
        </text>
        <text
          x={x((MEM + WEIGHTS) / 2)}
          y={Y0 + BH + 15}
          textAnchor="middle"
          className="viz-label"
        >
          KV caches
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {per >= 1 ? `${per.toFixed(1)} GiB` : `${(per * 1024).toFixed(0)} MiB`}{" "}
        per sequence; at most {batch} sequences fit in {MEM} GiB
      </div>
      <figcaption className="viz-caption">
        Memory of a {MEM} GiB accelerator serving an 8B-parameter model with 32
        layers and head dimension 128. Weights take a fixed 16 GiB; each
        sequence needs its own cache of keys and values for every earlier token.
        Fewer KV heads, as in grouped-query and multi-query attention, or
        shorter contexts let far more sequences share the accelerator. When many
        sequences fit, blocks are grouped for display.
      </figcaption>
    </figure>
  );
}
