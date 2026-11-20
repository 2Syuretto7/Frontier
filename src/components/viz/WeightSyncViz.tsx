"use client";

import { useState } from "react";

const R = 8,
  F = 3; // an 8 x 8 weight matrix, trained with FSDP over 3 ranks
const SHARD = Math.ceil((R * R) / F); // 22 elements each, the last padded by 2
const owner = (r: number, c: number) => Math.floor((r * R + c) / SHARD);

/** Elements each generator rank must receive from each trainer rank when the matrix is split for tensor parallelism. */
export function transfers(axis: "cols" | "rows", tp: number) {
  const m = Array.from({ length: tp }, () => Array(F).fill(0));
  for (let r = 0; r < R; r++)
    for (let c = 0; c < R; c++) {
      const g = Math.floor(((axis === "cols" ? c : r) * tp) / R);
      m[g][owner(r, c)]++;
    }
  return m;
}

const OPAC = [0.25, 0.55, 0.9];

export function WeightSyncViz() {
  const [axis, setAxis] = useState<"cols" | "rows">("cols");
  const [tp, setTp] = useState(2);
  const m = transfers(axis, tp);
  const links = m.flat().filter((x) => x > 0).length;
  const S = 17,
    X0 = 10,
    Y0 = 22,
    MX = X0 + R * S + 40,
    CS = 26;
  const W = 340,
    H = Y0 + R * S + 8;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div
          className="segmented"
          role="group"
          aria-label="Tensor parallel split"
        >
          {(["cols", "rows"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className="seg"
              aria-pressed={axis === a}
              onClick={() => setAxis(a)}
            >
              {a === "cols" ? "split columns" : "split rows"}
            </button>
          ))}
        </div>
        <div
          className="segmented"
          role="group"
          aria-label="Generator tensor parallel degree"
        >
          {[2, 4].map((t) => (
            <button
              key={t}
              type="button"
              className="seg"
              aria-pressed={tp === t}
              onClick={() => setTp(t)}
            >
              TP {t}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Weight matrix coloured by trainer shard, with generator splits and the transfer table"
      >
        <text x={X0} y={12} className="viz-label">
          trainer shards (shade)
        </text>
        {Array.from({ length: R * R }, (_, k) => {
          const r = Math.floor(k / R),
            c = k % R;
          return (
            <rect
              key={k}
              x={X0 + c * S}
              y={Y0 + r * S}
              width={S - 1}
              height={S - 1}
              style={{ fill: "var(--accent)", fillOpacity: OPAC[owner(r, c)] }}
            />
          );
        })}
        {Array.from({ length: tp - 1 }, (_, j) => {
          const p = ((j + 1) * R) / tp;
          return axis === "cols" ? (
            <line
              key={j}
              x1={X0 + p * S - 0.5}
              y1={Y0 - 3}
              x2={X0 + p * S - 0.5}
              y2={Y0 + R * S + 2}
              stroke="var(--danger)"
              strokeWidth={2.5}
            />
          ) : (
            <line
              key={j}
              x1={X0 - 3}
              y1={Y0 + p * S - 0.5}
              x2={X0 + R * S + 2}
              y2={Y0 + p * S - 0.5}
              stroke="var(--danger)"
              strokeWidth={2.5}
            />
          );
        })}
        <text x={MX} y={12} className="viz-label">
          elements sent
        </text>
        {Array.from({ length: F }, (_, f) => (
          <text
            key={f}
            x={MX + 30 + f * CS + CS / 2}
            y={Y0 + 10}
            textAnchor="middle"
            className="viz-label"
          >
            {`T${f}`}
          </text>
        ))}
        {m.map((row, g) => (
          <g key={g}>
            <text
              x={MX + 26}
              y={Y0 + 18 + (g + 1) * CS - 8}
              textAnchor="end"
              className="viz-label"
            >
              {`G${g}`}
            </text>
            {row.map((x, f) => (
              <g key={f}>
                <rect
                  x={MX + 30 + f * CS}
                  y={Y0 + 14 + g * CS}
                  width={CS - 3}
                  height={CS - 3}
                  style={{
                    fill: x ? "var(--accent-soft)" : "var(--bg-subtle)",
                  }}
                  stroke="var(--border)"
                />
                <text
                  x={MX + 30 + f * CS + (CS - 3) / 2}
                  y={Y0 + 14 + g * CS + CS / 2 + 2}
                  textAnchor="middle"
                  className="viz-label"
                >
                  {x || ""}
                </text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {links} trainer-to-generator links; each generator rank receives{" "}
        {(R * R) / tp} elements
      </div>
      <figcaption className="viz-caption">
        The trainer stores the 8 by 8 matrix flattened and cut into three equal
        pieces (shades), the last padded. The generator splits it across tensor
        parallel ranks by columns or by rows (red lines). The table shows how
        many elements each generator rank G needs from each trainer rank T.
        Splitting by columns cuts across every trainer shard, so every pair must
        talk; splitting by rows lines up better with the row-major layout.
      </figcaption>
    </figure>
  );
}
