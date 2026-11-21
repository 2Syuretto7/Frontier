"use client";

import { useState } from "react";

const G = 8,
  INTRA = 450,
  INTER = 50;

export function HierAllReduceViz() {
  const [m, setM] = useState(16);
  const [size, setSize] = useState(20);
  const n = m * G;
  const flat = ((2 * (n - 1)) / n) * (size / INTER);
  const inside = ((2 * (G - 1)) / G) * (size / INTRA);
  const across = m > 1 ? ((2 * (m - 1)) / m) * (size / G / INTER) : 0;
  const hier = inside + across;
  const maxT = Math.max(flat, hier);
  const W = 330,
    x0 = 90,
    pw = 200;
  const sx = (t: number) => (t / maxT) * pw;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          nodes of 8 GPUs: {m}{" "}
          <input
            type="range"
            min={1}
            max={64}
            value={m}
            onChange={(e) => setM(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          gradient size: {size} GB{" "}
          <input
            type="range"
            min={1}
            max={100}
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} 90`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="All-reduce time for a flat ring and a hierarchical scheme"
      >
        <text x={x0 - 6} y={26} textAnchor="end" className="viz-label">
          flat ring
        </text>
        <rect
          x={x0}
          y={12}
          width={sx(flat)}
          height={22}
          fill="var(--danger)"
          opacity={0.75}
        />
        <text x={x0 - 6} y={66} textAnchor="end" className="viz-label">
          hierarchical
        </text>
        <rect
          x={x0}
          y={52}
          width={sx(inside)}
          height={22}
          fill="var(--success)"
          opacity={0.8}
        />
        <rect
          x={x0 + sx(inside)}
          y={52}
          width={sx(across)}
          height={22}
          fill="var(--accent)"
          opacity={0.8}
        />
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Flat ring {flat.toFixed(3)} s; hierarchical {hier.toFixed(3)} s (
        {inside.toFixed(3)} s inside nodes, {across.toFixed(3)} s across them).
      </p>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--success)" }}>NVLink inside a node</span>
        <span style={{ color: "var(--accent)" }}>network between nodes</span>
      </div>
      <figcaption className="viz-caption">
        GPUs inside a node share 450 GB/s links; each GPU has its own 50 GB/s
        network card. A flat ring crosses the network at every node boundary and
        runs at network speed. The hierarchical scheme reduces inside each node
        first, so each GPU sends only an eighth of the gradients across the
        network, in parallel on all eight cards.
      </figcaption>
    </figure>
  );
}
