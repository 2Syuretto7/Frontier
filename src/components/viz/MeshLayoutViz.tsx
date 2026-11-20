"use client";

import { useState } from "react";

const NODES = 4, PER = 8;
const SIZES: Record<string, number> = { dp: 2, pp: 2, tp: 8 };
const ORDERS: Record<string, string[]> = { good: ["dp", "pp", "tp"], bad: ["tp", "pp", "dp"] };

/** Coordinates of a rank when dims are listed outermost first, the last varying fastest. */
export function coordsOf(rank: number, order: string[]) {
  const c: Record<string, number> = {};
  for (let i = order.length - 1; i >= 0; i--) {
    c[order[i]] = rank % SIZES[order[i]];
    rank = Math.floor(rank / SIZES[order[i]]);
  }
  return c;
}

export function groupIndex(rank: number, order: string[], dim: string) {
  const c = coordsOf(rank, order);
  return order.filter((d) => d !== dim).reduce((g, d) => g * SIZES[d] + c[d], 0);
}

export function MeshLayoutViz() {
  const [dim, setDim] = useState("tp");
  const [ord, setOrd] = useState("good");
  const order = ORDERS[ord];
  const n = NODES * PER;
  const nGroups = n / SIZES[dim];
  const spanning = Array.from({ length: nGroups }, (_, g) => {
    const nodes = new Set<number>();
    for (let r = 0; r < n; r++) if (groupIndex(r, order, dim) === g) nodes.add(Math.floor(r / PER));
    return nodes.size > 1;
  }).filter(Boolean).length;
  const W = 330, X0 = 50, CS = 33, Y0 = 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Dimension to show">
          {["tp", "pp", "dp"].map((d) => <button key={d} type="button" className="seg" aria-pressed={dim === d} onClick={() => setDim(d)}>{d} groups</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Rank order">
          <button type="button" className="seg" aria-pressed={ord === "good"} onClick={() => setOrd("good")}>tp innermost</button>
          <button type="button" className="seg" aria-pressed={ord === "bad"} onClick={() => setOrd("bad")}>dp innermost</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + NODES * CS + 4}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Thirty-two GPUs in four nodes coloured by process group">
        {Array.from({ length: NODES }, (_, nd) => (
          <g key={nd}>
            <text x={X0 - 6} y={Y0 + nd * CS + CS / 2 + 3} textAnchor="end" className="viz-label">node {nd}</text>
            <rect x={X0 - 2} y={Y0 + nd * CS - 2} width={PER * CS + 2} height={CS} style={{ fill: "none", stroke: "var(--border)" }} />
            {Array.from({ length: PER }, (_, j) => {
              const r = nd * PER + j;
              const g = groupIndex(r, order, dim);
              return (
                <g key={j}>
                  <rect x={X0 + j * CS} y={Y0 + nd * CS} width={CS - 4} height={CS - 6} style={{ fill: "var(--accent)" }} opacity={0.15 + (0.8 * g) / Math.max(1, nGroups - 1)} />
                  <text x={X0 + j * CS + (CS - 4) / 2} y={Y0 + nd * CS + (CS - 6) / 2 + 4} textAnchor="middle" className="mono" style={{ fontSize: 9, fill: "var(--text)" }}>{r}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {nGroups} {dim} group{nGroups > 1 ? "s" : ""} of {SIZES[dim]} GPUs; {spanning} of them span more than one node
      </div>
      <figcaption className="viz-caption">
        Thirty-two GPUs, eight per node, arranged as data 2 × pipeline 2 × tensor 8. GPUs of the same shade form one process group
        for the chosen dimension. With the tensor dimension varying fastest, every tensor-parallel group sits inside one node, where
        its per-layer all-reduces use the fast links; reversing the order scatters it across all four nodes.
      </figcaption>
    </figure>
  );
}
