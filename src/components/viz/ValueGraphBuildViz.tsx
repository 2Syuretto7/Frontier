"use client";

import { useState } from "react";

type Obj = { name: string; data: number; op: string; prev: string[]; x: number; y: number };
const LINES = ["a = Value(2.0)", "b = Value(-3.0)", "c = a * b", "d = c + a", "e = d * d"];
const OBJS: Obj[] = [
  { name: "a", data: 2, op: "", prev: [], x: 50, y: 50 },
  { name: "b", data: -3, op: "", prev: [], x: 50, y: 150 },
  { name: "c", data: -6, op: "*", prev: ["a", "b"], x: 150, y: 100 },
  { name: "d", data: -4, op: "+", prev: ["c", "a"], x: 240, y: 60 },
  { name: "e", data: 16, op: "*", prev: ["d"], x: 300, y: 150 },
];
const W = 360, H = 200;

/** Running Python lines that create Value objects; each operation records its inputs and builds the graph. */
export function ValueGraphBuildViz() {
  const [k, setK] = useState(2);
  const shown = OBJS.slice(0, k);
  const pos = Object.fromEntries(OBJS.map((o) => [o.name, o]));
  const cur = shown[shown.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setK(Math.min(LINES.length, k + 1))} disabled={k >= LINES.length}>Run next line</button>
        <button type="button" className="btn" onClick={() => setK(0)}>Reset</button>
      </div>
      <pre className="mono" style={{ fontSize: 13, margin: "8px 0", overflowX: "auto" }}>
        {LINES.map((l, i) => (
          <div key={l} style={{ color: i < k ? "var(--text)" : "var(--text-faint)", fontWeight: i === k - 1 ? 700 : 400 }}>
            {i === k - 1 ? "▶ " : "  "}
            {l}
          </div>
        ))}
      </pre>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The Value objects created so far and their links">
        <defs>
          <marker id="vg-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {shown.flatMap((o) =>
          [...new Set(o.prev)].map((p) => {
            const s = pos[p];
            const dx = o.x - s.x, dy = o.y - s.y, L = Math.hypot(dx, dy);
            return (
              <line key={`${p}-${o.name}`} x1={s.x + (dx / L) * 30} y1={s.y + (dy / L) * 22} x2={o.x - (dx / L) * 32} y2={o.y - (dy / L) * 24} stroke="var(--text-muted)" strokeWidth={1.4} markerEnd="url(#vg-head)" />
            );
          }),
        )}
        {shown.map((o) => (
          <g key={o.name}>
            <rect x={o.x - 32} y={o.y - 20} width={64} height={40} rx={7} fill={o === cur ? "var(--accent-soft)" : "var(--bg)"} stroke={o === cur ? "var(--accent)" : "var(--text-faint)"} />
            <text x={o.x} y={o.y - 4} textAnchor="middle" className="viz-label">{o.name}{o.op ? ` (${o.op})` : ""}</text>
            <text x={o.x} y={o.y + 12} textAnchor="middle" className="viz-label">data {o.data}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {k === 0
          ? "Run the lines one at a time."
          : cur.op
            ? `${LINES[k - 1]} computes ${cur.data} and also remembers its inputs (_prev = {${[...new Set(cur.prev)].join(", ")}}) and the operation "${cur.op}". ${cur.name === "e" ? "d * d has the same input twice, so _prev, a set, holds d once; the backward pass must still count both uses." : cur.name === "d" ? "a now feeds two nodes: c and d." : ""}`
            : `${cur.name} is a leaf: a number with no inputs. Its grad starts at 0.`}{" "}
        Arrows point from inputs to results; the backward pass will walk them in reverse.
      </figcaption>
    </figure>
  );
}
