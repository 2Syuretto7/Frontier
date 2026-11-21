"use client";

import { useState } from "react";

type Level = "none" | "pointwise" | "epilogue";
const OPS = ["matmul", "add bias", "gelu", "scale"];
const MB = 32;
const BW = 3.35;

function groups(lv: Level): number[][] {
  if (lv === "none") return [[0], [1], [2], [3]];
  if (lv === "pointwise") return [[0], [1, 2, 3]];
  return [[0, 1, 2, 3]];
}

export function FusionGroupsViz() {
  const [lv, setLv] = useState<Level>("none");
  const gs = groups(lv);
  const traffic = gs.reduce((a, g) => a + (g[0] === 0 ? 2 * MB : MB) + MB, 0);
  const W = 330,
    H = 70,
    x0 = 10,
    bw = 70,
    gap = 10,
    y = 20,
    bh = 34;
  const colors = [
    "var(--accent)",
    "var(--success)",
    "var(--danger)",
    "var(--text-muted)",
  ];
  return (
    <figure className="viz">
      <div
        role="group"
        aria-label="Fusion"
        className="viz-controls"
        style={{ marginTop: 0, gap: 6, flexWrap: "wrap" }}
      >
        {(
          [
            ["none", "no fusion"],
            ["pointwise", "fuse pointwise"],
            ["epilogue", "fuse into matmul"],
          ] as [Level, string][]
        ).map(([l, label]) => (
          <button
            key={l}
            type="button"
            className={l === lv ? "btn btn-primary" : "btn"}
            aria-pressed={l === lv}
            onClick={() => setLv(l)}
          >
            {label}
          </button>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Four operations grouped into kernels"
      >
        {gs.map((g, gi) => {
          const xa = x0 + g[0] * (bw + gap) - 4;
          const xb = x0 + g[g.length - 1] * (bw + gap) + bw + 4;
          return (
            <rect
              key={gi}
              x={xa}
              y={y - 8}
              width={xb - xa}
              height={bh + 16}
              rx={6}
              fill={colors[gi]}
              opacity={0.15}
              stroke={colors[gi]}
            />
          );
        })}
        {OPS.map((op, i) => (
          <g key={op}>
            <rect
              x={x0 + i * (bw + gap)}
              y={y}
              width={bw}
              height={bh}
              rx={4}
              fill="var(--surface)"
              stroke="var(--border)"
            />
            <text
              x={x0 + i * (bw + gap) + bw / 2}
              y={y + bh / 2 + 4}
              textAnchor="middle"
              className="viz-label"
            >
              {op}
            </text>
          </g>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {gs.length} kernels, {traffic} MB of memory traffic; at {BW} TB/s that
        alone takes {(((traffic * 1.048576e6) / (BW * 1e12)) * 1e6).toFixed(1)}{" "}
        µs
      </p>
      <figcaption className="viz-caption">
        y = scale · gelu(x W + b) with 4096 × 4096 BF16 tensors, 32 MB each.
        Each kernel reads its inputs from memory and writes its output. Fusing
        the three pointwise operations removes two round trips; fusing them into
        the matrix multiplication&apos;s epilogue applies them to each output
        tile while it is still on chip, so only x, W and y touch memory.
      </figcaption>
    </figure>
  );
}
