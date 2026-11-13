"use client";

import { useState } from "react";

const SIZES = [3, 100, 10_000, 1_000_000];

/** Graph nodes for (w * x).sum() with scalar Values against whole-array Tensors, as the vector length grows. */
export function TensorNodesViz() {
  const [i, setI] = useState(0);
  const n = SIZES[i];
  const scalar = 4 * n + 1, tensor = 4;
  const W = 340, bar = (v: number) => 10 + (Math.log10(v) / Math.log10(4_000_001)) * (W - 120);
  const fmt = (v: number) => v.toLocaleString("en-IN");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {SIZES.map((s, k) => (
          <button key={s} type="button" className="seg" aria-pressed={k === i} onClick={() => setI(k)}>n = {fmt(s)}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 90`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Number of graph nodes, on a log scale">
        <text x={0} y={22} className="viz-label">Value</text>
        <rect x={60} y={10} width={bar(scalar)} height={18} rx={3} fill="var(--danger)" opacity={0.75} />
        <text x={64 + bar(scalar)} y={24} className="viz-label">{fmt(scalar)}</text>
        <text x={0} y={62} className="viz-label">Tensor</text>
        <rect x={60} y={50} width={bar(tensor)} height={18} rx={3} fill="var(--accent)" />
        <text x={64 + bar(tensor)} y={64} className="viz-label">{tensor}</text>
        <text x={W} y={86} textAnchor="end" className="viz-label">graph nodes (log scale)</text>
      </svg>
      <pre className="mono" style={{ fontSize: 13, margin: "8px 0", overflowX: "auto" }}>
        {`Tensor graph:  w (${fmt(n)},)   x (${fmt(n)},)
                  \\       /
                 w * x  (${fmt(n)},)
                    |
                  sum   ()`}
      </pre>
      <figcaption className="viz-caption" aria-live="polite">
        With scalar Values, every element needs its own multiply node and its own add node, so the graph grows like 4n and
        the backward pass makes about 4n Python calls. A Tensor node holds a whole array: the graph has 4 nodes for any n,
        and each closure does its work in one NumPy call, which runs in compiled code.{" "}
        {n >= 1_000_000 ? "At a million elements the scalar graph would need gigabytes of Python objects." : ""}
      </figcaption>
    </figure>
  );
}
