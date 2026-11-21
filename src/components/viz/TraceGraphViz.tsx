"use client";

import { useState } from "react";

type Node = { op: string; label: string };

export function TraceGraphViz() {
  const [n, setN] = useState(2);
  const [flag, setFlag] = useState(false);
  const nodes: Node[] = [
    { op: "input", label: "x" },
    { op: "input", label: "w" },
    { op: "input", label: "b" },
  ];
  let cur = "x";
  for (let i = 0; i < n; i++) {
    nodes.push({ op: "mul", label: `t${2 * i} = ${cur} * w` });
    nodes.push({ op: "add", label: `t${2 * i + 1} = t${2 * i} + b` });
    cur = `t${2 * i + 1}`;
  }
  if (flag) nodes.push({ op: "relu", label: `out = relu(${cur})` });
  const W = 330,
    rh = 20,
    x0 = 10,
    y0 = 6;
  const H = y0 + nodes.length * rh + 6;
  return (
    <figure className="viz">
      <pre
        style={{
          margin: "0 0 8px",
          fontSize: 13,
          overflowX: "auto",
          color: "var(--text)",
        }}
      >
        {`def f(x, w, b, n, flag):
    for _ in range(n):
        x = x * w + b
    if flag:
        x = relu(x)
    return x`}
      </pre>
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          n = {n}{" "}
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="flag"
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              className={v === flag ? "btn btn-primary" : "btn"}
              aria-pressed={v === flag}
              onClick={() => setFlag(v)}
            >
              flag = {v ? "True" : "False"}
            </button>
          ))}
        </div>
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
        aria-label="The traced graph as a list of operations"
      >
        {nodes.map((nd, i) => (
          <g key={i}>
            <rect
              x={x0}
              y={y0 + i * rh}
              width={W - 2 * x0}
              height={rh - 4}
              rx={3}
              fill={nd.op === "input" ? "var(--surface)" : "var(--accent)"}
              opacity={nd.op === "input" ? 1 : 0.18}
              stroke="var(--border)"
            />
            <text x={x0 + 8} y={y0 + i * rh + 12} className="viz-label">
              {nd.op === "input" ? `input ${nd.label}` : nd.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {nodes.length} nodes; guards: n == {n}, flag is{" "}
        {flag ? "True" : "False"}
      </p>
      <figcaption className="viz-caption">
        Tracing runs the function once and records only the tensor operations
        that execute. The loop disappears, unrolled into n copies of its body,
        and the branch disappears, replaced by whichever side ran. The Python
        values that steered them become guards: a call with a different n or
        flag must be traced again.
      </figcaption>
    </figure>
  );
}
