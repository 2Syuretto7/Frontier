"use client";

import { useState } from "react";

const PAIRS: [string, string][] = [["kitten", "sitting"], ["sunday", "saturday"], ["intention", "execution"]];

function solve(a: string, b: string) {
  const n = a.length, m = b.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const path: [number, number][] = [[n, m]];
  const ops: string[] = [];
  let i = n, j = m;
  while (i || j) {
    if (i && j && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { ops.push(a[i - 1] === b[j - 1] ? `keep ${a[i - 1]}` : `${a[i - 1]}→${b[j - 1]}`); i--; j--; }
    else if (i && d[i][j] === d[i - 1][j] + 1) { ops.push(`delete ${a[i - 1]}`); i--; }
    else { ops.push(`insert ${b[j - 1]}`); j--; }
    path.push([i, j]);
  }
  return { d, path, ops: ops.reverse() };
}

/** The edit-distance table: each cell is the cheapest of a deletion, an insertion or a match/substitution; the path back gives the alignment. */
export function EditTableViz() {
  const [k, setK] = useState(0);
  const [a, b] = PAIRS[k];
  const { d, path, ops } = solve(a, b);
  const rows = a.length;
  const [t, setT] = useState(0);
  const done = t >= rows;
  const on = new Set(done ? path.map(([i, j]) => `${i},${j}`) : []);
  const C = 30, X0 = 40, Y0 = 40, W = X0 + (b.length + 1) * C + 6, H = Y0 + (a.length + 1) * C + 6;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Word pair">
        {PAIRS.map(([x, y], q) => <button key={x} type="button" className="seg" aria-pressed={k === q} onClick={() => { setK(q); setT(0); }}>{x} → {y}</button>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Edit distance table for ${a} and ${b}`}>
        {[...b].map((ch, j) => <text key={j} x={X0 + (j + 1) * C + C / 2} y={Y0 - 10} textAnchor="middle" className="viz-label">{ch}</text>)}
        {[...a].map((ch, i) => <text key={i} x={X0 - 12} y={Y0 + (i + 1) * C + C / 2 + 4} textAnchor="middle" className="viz-label">{ch}</text>)}
        {d.map((row, i) => row.map((v, j) => {
          const shown = i === 0 || i <= t;
          return (
            <g key={`${i},${j}`}>
              <rect x={X0 + j * C + 1} y={Y0 + i * C + 1} width={C - 2} height={C - 2} rx={3} className={on.has(`${i},${j}`) ? "viz-cell is-on" : "viz-cell"} style={!done && i === t && t > 0 ? { strokeWidth: 2.5 } : undefined} />
              {shown && <text x={X0 + j * C + C / 2} y={Y0 + i * C + C / 2 + 4} textAnchor="middle" className="plot-tick">{v}</text>}
            </g>
          );
        }))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={done}>Next row</button>
        <button type="button" className="btn" onClick={() => setT(rows)} disabled={done}>Finish</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {done
          ? <>Distance {d[a.length][b.length]}. Tracing back from the corner: <span className="mono">{ops.join(", ")}</span>.</>
          : t === 0
            ? <>Row 0 and column 0 hold the cost of building a prefix from nothing: i deletions or j insertions. Cell (i, j) is the distance between the first i letters of {a} and the first j of {b}.</>
            : <>Row {t} ({a[t - 1]}): each cell takes 1 + the cell above (delete), 1 + the cell to the left (insert), or the diagonal cell, plus 1 if the letters differ.</>}
      </figcaption>
    </figure>
  );
}
