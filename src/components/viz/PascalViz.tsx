"use client";

import { useState } from "react";

/** Pascal's triangle: each entry is the sum of the two above it. Shading the odd entries reveals a pattern of triangles. */
export function PascalViz() {
  const [rows, setRows] = useState(8);
  const [odd, setOdd] = useState(false);
  const tri: number[][] = [[1]];
  for (let i = 1; i < rows; i++) {
    const prev = tri[i - 1];
    tri.push(Array.from({ length: i + 1 }, (_, j) => (j === 0 || j === i ? 1 : prev[j - 1] + prev[j])));
  }
  const s = Math.min(46, 600 / rows);
  const h = s * 0.82;
  const font = Math.max(7, Math.min(13, s * 0.3));
  const last = tri[rows - 1];

  return (
    <figure className="viz">
      <svg viewBox={`0 0 620 ${rows * h + 20}`} role="img" aria-label={`The first ${rows} rows of Pascal's triangle`}>
        {tri.map((row, i) => row.map((v, j) => {
          const cx = 310 + (j - i / 2) * s, cy = 10 + i * h;
          const on = odd ? v % 2 === 1 : i === rows - 1;
          return (
            <g key={`${i}-${j}`}>
              <rect x={cx - s / 2 + 1} y={cy} width={s - 2} height={h - 2} rx={4} className={on ? "viz-cell is-on" : "viz-cell"} />
              <text x={cx} y={cy + h / 2 + font / 3} textAnchor="middle" className="plot-tick" style={{ fontSize: font }}>{v}</text>
            </g>
          );
        }))}
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Rows <span className="mono">{rows}</span></span>
          <input type="range" min={2} max={16} step={1} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className={odd ? "btn btn-primary" : "btn"} aria-pressed={odd} onClick={() => setOdd(!odd)}>Shade the odd numbers</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {odd
          ? <>The odd entries form triangles inside triangles, a pattern that repeats at every scale. Try 16 rows.</>
          : <>Row {rows - 1} (counting the top as row 0) is <span className="mono">{last.join(", ")}</span>: the coefficients of{" "}
            <span className="mono">(1 + x)<sup>{rows - 1}</sup></span>. They add to <span className="mono">2<sup>{rows - 1}</sup> = {2 ** (rows - 1)}</span>.</>}
      </figcaption>
    </figure>
  );
}
