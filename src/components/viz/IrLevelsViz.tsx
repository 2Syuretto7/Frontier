"use client";

import { useState } from "react";

type Level = "graph" | "loops" | "fused";

const TEXT: Record<Level, string> = {
  graph: `%t = matmul(%x, %w)        : [M, N]
%u = add(%t, %b)           : [M, N]
%y = relu(%u)              : [M, N]`,
  loops: `for i in range(M):
  for j in range(N):
    acc = 0
    for p in range(K):
      acc += x[i][p] * w[p][j]
    t[i][j] = acc
for i in range(M):
  for j in range(N):
    u[i][j] = t[i][j] + b[j]
for i in range(M):
  for j in range(N):
    y[i][j] = max(u[i][j], 0)`,
  fused: `for i in range(M):
  for j in range(N):
    acc = 0
    for p in range(K):
      acc += x[i][p] * w[p][j]
    y[i][j] = max(acc + b[j], 0)`,
};

const NOTE: Record<Level, string> = {
  graph:
    "Three operations on whole tensors. Fusion, layout and sharding decisions are easy to state here, because each node is one meaningful operation.",
  loops:
    "The same program lowered one operation at a time: three loop nests, with t and u written to memory and read back. Tiling and vectorisation are stated here.",
  fused:
    "After fusion at the loop level, the bias and activation run while the result is still in a register, and t and u never exist in memory.",
};

export function IrLevelsViz() {
  const [lv, setLv] = useState<Level>("graph");
  const MN = 4096 * 4096;
  const traffic = lv === "fused" ? 1 : 5;
  return (
    <figure className="viz">
      <div
        role="group"
        aria-label="IR level"
        className="viz-controls"
        style={{ marginTop: 0, gap: 6, flexWrap: "wrap" }}
      >
        {(
          [
            ["graph", "graph IR"],
            ["loops", "loop IR"],
            ["fused", "loop IR, fused"],
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
      <pre
        style={{
          margin: "8px 0",
          fontSize: 12.5,
          overflowX: "auto",
          color: "var(--text)",
        }}
      >
        {TEXT[lv]}
      </pre>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {lv === "graph"
          ? "3 nodes"
          : `${TEXT[lv].split("\n").length} lines; M×N-sized arrays written or read after the matmul: ${traffic} (${((traffic * MN * 2) / 1e6).toFixed(0)} MB in BF16 at M = N = 4096)`}
      </p>
      <figcaption className="viz-caption">{NOTE[lv]}</figcaption>
    </figure>
  );
}
