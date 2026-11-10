"use client";

import { useState } from "react";

/** Every natural number is reached from 0 by adding one, again and again. */
export function SuccessorViz() {
  const [n, setN] = useState(0);
  const W = 640, x0 = 32, step = 48, y = 60, top = 10;
  const ticks = Array.from({ length: top + 1 }, (_, i) => i);
  const notation = n === 0 ? "0" : `${"S(".repeat(n)}0${")".repeat(n)}`;

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 110`} role="img" aria-label={`The number ${n} on a number line`}>
        <line x1={x0} y1={y} x2={x0 + top * step + 16} y2={y} className="viz-axis" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x0 + t * step} y1={y - 6} x2={x0 + t * step} y2={y + 6} className="viz-axis" />
            <text x={x0 + t * step} y={y + 28} textAnchor="middle" className={t === n ? "viz-label is-on" : "viz-label"}>{t}</text>
          </g>
        ))}
        {ticks.slice(0, n).map((t) => (
          <path key={`a${t}`} d={`M${x0 + t * step + 4} ${y - 10} Q${x0 + t * step + step / 2} ${y - 34} ${x0 + (t + 1) * step - 4} ${y - 10}`}
            className="viz-link" fill="none" />
        ))}
        <circle cx={x0 + n * step} cy={y} r={9} className="viz-node is-paired" style={{ transition: "cx 200ms cubic-bezier(0.2,0,0,1)" }} />
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setN((v) => Math.min(top, v + 1))} disabled={n === top}>
          Add one
        </button>
        <button type="button" className="btn" onClick={() => setN(0)} disabled={n === 0}>Back to 0</button>
      </div>
      <figcaption className="viz-caption mono" aria-live="polite">{n} = {notation}</figcaption>
    </figure>
  );
}
