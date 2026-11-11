"use client";

import { useState } from "react";

type F = { name: string; type: string; size: number; align: number };
const FIELDS: F[] = [
  { name: "flag", type: "char", size: 1, align: 1 },
  { name: "score", type: "double", size: 8, align: 8 },
  { name: "id", type: "short", size: 2, align: 2 },
  { name: "count", type: "int", size: 4, align: 4 },
  { name: "tag", type: "char", size: 1, align: 1 },
];

function layout(fs: F[]) {
  let pos = 0, al = 1;
  const cells: { f: F | null; at: number }[] = [];
  for (const f of fs) {
    const start = Math.ceil(pos / f.align) * f.align;
    for (let i = pos; i < start; i++) cells.push({ f: null, at: i });
    for (let i = 0; i < f.size; i++) cells.push({ f, at: start + i });
    pos = start + f.size;
    al = Math.max(al, f.align);
  }
  const size = Math.ceil(pos / al) * al;
  for (let i = pos; i < size; i++) cells.push({ f: null, at: i });
  return { cells, size, al };
}

/** C struct layout: each field starts at a multiple of its alignment, so field order decides how much padding the struct carries. */
export function StructLayoutViz() {
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3, 4]);
  const fs = order.map((i) => FIELDS[i]);
  const { cells, size } = layout(fs);
  const pad = cells.filter((c) => !c.f).length;
  const move = (k: number) => { if (k === 0) return; const o = [...order]; [o[k - 1], o[k]] = [o[k], o[k - 1]]; setOrder(o); };
  const C = 28, perRow = 16, rows = Math.ceil(size / perRow), W = perRow * C + 10;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {fs.map((f, k) => (
          <button key={f.name} type="button" className="btn mono" onClick={() => move(k)} disabled={k === 0} aria-label={`Move ${f.name} earlier`}>
            {k > 0 ? "↑ " : ""}{f.type} {f.name}
          </button>
        ))}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setOrder([...order].sort((a, b) => FIELDS[b].align - FIELDS[a].align))}>Sort by alignment</button>
        <button type="button" className="btn" onClick={() => setOrder([0, 1, 2, 3, 4])}>Reset</button>
      </div>
      <svg viewBox={`0 0 ${W} ${rows * (C + 18) + 6}`} role="img" aria-label={`Struct of ${size} bytes with ${pad} bytes of padding`}>
        {cells.map(({ f, at }) => {
          const r = Math.floor(at / perRow), c = at % perRow;
          const first = f && (at === 0 || cells[at - 1].f !== f);
          return (
            <g key={at}>
              <rect x={5 + c * C + 1} y={6 + r * (C + 18)} width={C - 2} height={C - 2} rx={3} className={f ? "viz-cell is-on" : "viz-cell"} style={f ? undefined : { strokeDasharray: "3 3", opacity: 0.6 }} />
              {first && <text x={5 + c * C + 3} y={6 + r * (C + 18) + C + 11} className="plot-tick" style={{ fontSize: 9 }}>{f.name}</text>}
              {c === 0 && <text x={5 + c * C + C / 2} y={6 + r * (C + 18) + C / 2 + 4} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>{at}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Click a field to move it one place earlier. Size <span className="mono">{size}</span> bytes, of which <span className="mono">{pad}</span> are padding (dashed). The fields need only {FIELDS.reduce((s, f) => s + f.size, 0)}. Each field starts at a multiple of its own size here, and the whole struct is padded to a multiple of 8 so that arrays of it keep every double aligned.
      </figcaption>
    </figure>
  );
}
