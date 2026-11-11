"use client";

import { useState } from "react";

const N = 8;
function rows(seed: number) {
  let s = seed * 2654435761 >>> 0;
  return Array.from({ length: N }, () => Array.from({ length: N }, () => { s = (Math.imul(s ^ (s >>> 13), 1103515245) + 12345) >>> 0; return (s >>> 16) & 1; }));
}

/** Cantor's diagonal argument: any list of infinite 0-1 sequences misses the sequence built by flipping the diagonal. */
export function DiagonalViz() {
  const [seed, setSeed] = useState(3);
  const [g, setG] = useState(() => rows(3));
  const [sel, setSel] = useState<number | null>(2);
  const d = g.map((r, i) => 1 - r[i]);
  const C = 40, X0 = 70, Y0 = 34;
  const flip = (i: number, j: number) => setG(g.map((r, a) => r.map((v, b) => (a === i && b === j ? 1 - v : v))));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => { const s = seed + 1; setSeed(s); setG(rows(s)); }}>A new list</button>
      </div>
      <svg viewBox={`0 0 620 ${Y0 + (N + 2) * C + 20}`} role="img" aria-label="A list of binary sequences and the diagonal sequence that differs from each">
        {Array.from({ length: N }, (_, j) => <text key={j} x={X0 + j * C + C / 2} y={Y0 - 10} textAnchor="middle" className="plot-tick">{j + 1}</text>)}
        <text x={X0 + N * C + 14} y={Y0 - 10} className="plot-tick">position</text>
        {g.map((r, i) => (
          <g key={i}>
            <text x={X0 - 12} y={Y0 + i * C + C / 2 + 5} textAnchor="end" className={sel === i ? "viz-label is-on" : "viz-label"} style={{ cursor: "pointer" }} onClick={() => setSel(i)}>s{String.fromCharCode(0x2081 + i)}</text>
            {r.map((v, j) => {
              const diag = i === j;
              const hot = sel === i && diag;
              return (
                <g key={j} onClick={() => flip(i, j)} style={{ cursor: "pointer" }}>
                  <rect x={X0 + j * C + 3} y={Y0 + i * C + 3} width={C - 6} height={C - 6} rx={5} className={diag ? "viz-cell is-on" : "viz-cell"} style={hot ? { stroke: "var(--danger)", strokeWidth: 2.5 } : sel === i ? { strokeWidth: 2 } : undefined} />
                  <text x={X0 + j * C + C / 2} y={Y0 + i * C + C / 2 + 5} textAnchor="middle" className={diag ? "viz-label is-on" : "viz-label"}>{v}</text>
                </g>
              );
            })}
            <text x={X0 + N * C + 14} y={Y0 + i * C + C / 2 + 5} className="plot-tick">&hellip;</text>
          </g>
        ))}
        <text x={X0 + N * C / 2} y={Y0 + N * C + 16} textAnchor="middle" className="plot-tick">&#8942;</text>
        <text x={X0 - 12} y={Y0 + (N + 1) * C + C / 2 + 5} textAnchor="end" className="viz-label" style={{ fill: "var(--danger)" }}>d</text>
        {d.map((v, j) => (
          <g key={j}>
            <rect x={X0 + j * C + 3} y={Y0 + (N + 1) * C + 3} width={C - 6} height={C - 6} rx={5} className="viz-cell" style={{ stroke: "var(--danger)", strokeWidth: sel === j ? 2.5 : 1 }} />
            <text x={X0 + j * C + C / 2} y={Y0 + (N + 1) * C + C / 2 + 5} textAnchor="middle" className="viz-label" style={{ fill: "var(--danger)" }}>{v}</text>
          </g>
        ))}
        <text x={X0 + N * C + 14} y={Y0 + (N + 1) * C + C / 2 + 5} className="plot-tick">&hellip;</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded diagonal holds the 1st digit of s₁, the 2nd of s₂, and so on. The sequence d flips every diagonal digit.{" "}
        {sel !== null && <>Compare d with s{String.fromCharCode(0x2081 + sel)}: in position {sel + 1}, s{String.fromCharCode(0x2081 + sel)} has {g[sel][sel]} and d has {d[sel]}, so they differ. </>}
        Click a row name to compare, or any digit to change it: d changes too, and still differs from every row. So no list, however long, contains every 0-1 sequence.
      </figcaption>
    </figure>
  );
}
