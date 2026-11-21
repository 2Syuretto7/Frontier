"use client";

import { useState } from "react";

const OPS = [
  "embed",
  "norm",
  "matmul",
  "softmax",
  "matmul",
  "add",
  ".item()",
  "norm",
  "matmul",
  "gelu",
  "matmul",
  "add",
  "print",
  "loss",
];
const LAUNCH = 6;

export function GraphBreakViz() {
  const [breaks, setBreaks] = useState<boolean[]>(
    OPS.map((o) => o === ".item()" || o === "print"),
  );
  const [cg, setCg] = useState(false);
  const segs: { start: number; len: number; graph: boolean }[] = [];
  OPS.forEach((_, i) => {
    const g = !breaks[i];
    const last = segs[segs.length - 1];
    if (g && last && last.graph) last.len++;
    else segs.push({ start: i, len: 1, graph: g });
  });
  const graphs = segs.filter((s) => s.graph).length;
  const eager = breaks.filter(Boolean).length;
  const captured = OPS.length - eager;
  const launches = (cg ? graphs : captured) + eager;
  const W = 340,
    cw = (W - 20) / OPS.length;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}
        role="group"
        aria-label="Operations; press one to toggle whether it breaks the graph"
      >
        {OPS.map((o, i) => (
          <button
            key={i}
            type="button"
            className={breaks[i] ? "btn" : "btn btn-primary"}
            aria-pressed={!breaks[i]}
            onClick={() => setBreaks(breaks.map((b, j) => (j === i ? !b : b)))}
          >
            {o}
          </button>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} 56`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "8px auto 0",
        }}
        role="img"
        aria-label="Captured graphs and eager operations along the step"
      >
        {segs.map((s, k) => (
          <g key={k}>
            <rect
              x={10 + s.start * cw + 1}
              y={8}
              width={s.len * cw - 2}
              height={26}
              rx={4}
              fill={s.graph ? "var(--accent)" : "var(--text-muted)"}
              opacity={s.graph ? 0.8 : 0.5}
            />
            <text
              x={10 + (s.start + s.len / 2) * cw}
              y={50}
              textAnchor="middle"
              className="viz-label"
            >
              {s.len * cw >= 40 ? (s.graph ? "graph" : "python") : ""}
            </text>
          </g>
        ))}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 6 }}>
        <button
          type="button"
          className={cg ? "btn btn-primary" : "btn"}
          aria-pressed={cg}
          onClick={() => setCg(!cg)}
        >
          CUDA graphs {cg ? "on" : "off"}
        </button>
      </div>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {graphs} graphs, {eager} eager ops, {launches} launches, about{" "}
        {launches * LAUNCH} µs of launch overhead at {LAUNCH} µs each
      </p>
      <figcaption className="viz-caption">
        Filled operations are captured by the graph tracer; outlined ones break
        the graph and run in Python. Press an operation to toggle it. In the
        strip below, coloured blocks are captured graphs and grey blocks are
        operations run eagerly. Every break splits the program into more graphs
        and returns to the interpreter. With CUDA graphs on, each captured graph
        is replayed with a single launch instead of one launch per kernel.
      </figcaption>
    </figure>
  );
}
