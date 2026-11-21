"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MAX = 2048;
type Mode = "pad" | "pack";

export function SftPackingViz() {
  const [mode, setMode] = useState<Mode>("pack");
  const lens = useMemo(() => {
    const r = rand(53);
    return Array.from({ length: 14 }, () => 120 + Math.floor(r() * r() * 1700));
  }, []);
  const rows: number[][] = [];
  if (mode === "pad") lens.forEach((_, i) => rows.push([i]));
  else {
    const room: number[] = [];
    lens.forEach((n, i) => {
      const b = room.findIndex((r) => r >= n);
      if (b >= 0) {
        rows[b].push(i);
        room[b] -= n;
      } else {
        rows.push([i]);
        room.push(MAX - n);
      }
    });
  }
  const used = lens.reduce((a, b) => a + b, 0);
  const fill = used / (rows.length * MAX);
  const W = 340,
    rh = 12,
    gap = 3,
    x0 = 4,
    x1 = W - 4;
  const H = rows.length * (rh + gap) + 4;
  const sx = (v: number) => (v / MAX) * (x1 - x0);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}
        role="group"
        aria-label="Batching mode"
      >
        {(
          [
            ["pad", "one per row, padded"],
            ["pack", "packed, first fit"],
          ] as [Mode, string][]
        ).map(([m, l]) => (
          <button
            key={m}
            type="button"
            className={m === mode ? "btn btn-primary" : "btn"}
            aria-pressed={m === mode}
            onClick={() => setMode(m)}
          >
            {l}
          </button>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "10px auto 0",
        }}
        role="img"
        aria-label="Conversations laid out in rows of 2048 tokens"
      >
        {rows.map((row, r) => {
          let off = 0;
          return (
            <g key={r}>
              <rect
                x={x0}
                y={2 + r * (rh + gap)}
                width={x1 - x0}
                height={rh}
                fill="var(--bg-subtle)"
                stroke="var(--border)"
              />
              {row.map((i) => {
                const x = x0 + sx(off);
                off += lens[i];
                return (
                  <rect
                    key={i}
                    x={x + 0.5}
                    y={2 + r * (rh + gap)}
                    width={sx(lens[i]) - 1}
                    height={rh}
                    fill={i % 2 ? "var(--accent)" : "var(--code-function)"}
                    opacity={0.8}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {rows.length} rows of {MAX}; {(100 * fill).toFixed(1)}% of positions
        hold real tokens
      </p>
      <figcaption className="viz-caption">
        Fourteen conversations of varying length. Padding each to a full row
        wastes most of the compute on padding; packing several into a row, with
        an attention mask that keeps each conversation from seeing the others,
        fills the rows and finishes an epoch in far fewer steps.
      </figcaption>
    </figure>
  );
}
