"use client";

import { useState } from "react";

const R = 3, Cc = 4;

type Op = { label: string; code: string; view: boolean; cells: number[][] };

/** Each operation on a 3 x 4 tensor x: whether the result is a view, and the storage address of each result element. */
export const OPS: Op[] = [
  { label: "x[1:]", code: "x[1:]", view: true, cells: [[4, 5, 6, 7], [8, 9, 10, 11]] },
  { label: "x[:, ::2]", code: "x[:, ::2]", view: true, cells: [[0, 2], [4, 6], [8, 10]] },
  { label: "x.t()", code: "x.t()", view: true, cells: [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]] },
  { label: "x[[0, 2]]", code: "x[[0, 2]]", view: false, cells: [[0, 1, 2, 3], [8, 9, 10, 11]] },
  { label: "x[x > 6]", code: "x[x > 6]", view: false, cells: [[7, 8, 9, 10, 11]] },
  { label: "x.t().reshape(12)", code: "x.t().reshape(12)", view: false, cells: [[0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]] },
];

export function ViewAliasViz() {
  const [oi, setOi] = useState(0);
  const op = OPS[oi];
  const used = new Set(op.cells.flat());
  const cw = 24, W = 300;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {OPS.map((o, i) => (
          <button key={o.label} type="button" className="seg mono" aria-pressed={i === oi} onClick={() => setOi(i)}>{o.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 150`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Which storage a result tensor uses: the original's or a new copy">
        <text x={0} y={12} className="viz-label">storage of x (values 0 to 11)</text>
        {Array.from({ length: R * Cc }, (_, a) => (
          <g key={a}>
            <rect x={a * cw} y={18} width={cw - 2} height={22} fill={op.view && used.has(a) ? "var(--accent)" : "none"} fillOpacity={0.35} stroke="var(--border)" />
            <text x={a * cw + cw / 2 - 1} y={33} textAnchor="middle" className="viz-label">{a}</text>
          </g>
        ))}
        <text x={0} y={62} className="viz-label">{op.view ? "result: a view into the same storage" : "result: new storage holding copies"}</text>
        {op.cells.map((row, i) => row.map((a, j) => (
          <g key={`${i}-${j}`}>
            <rect x={j * cw} y={68 + i * 20} width={cw - 2} height={18} fill={op.view ? "none" : "var(--danger)"} fillOpacity={0.3} stroke={op.view ? "var(--accent)" : "var(--border)"} strokeDasharray={op.view ? "3 2" : undefined} />
            <text x={j * cw + cw / 2 - 1} y={81 + i * 20} textAnchor="middle" className="viz-label">{a}</text>
          </g>
        )))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`y = ${op.code}; y[0] += 100 ${op.view ? "also changes x" : "leaves x alone"}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        x = torch.arange(12.).reshape(3, 4). Basic slicing and transposes return views: the result has its own shape,
        strides and offset but points into x&apos;s storage (highlighted). Indexing with a list or a mask, and a reshape that
        cannot be expressed with strides, allocate new storage and copy the values, so later writes do not reach x.
      </figcaption>
    </figure>
  );
}
