"use client";

import { useState } from "react";

const VALS = [3, 8, 1, 6, 4];

type Snap = { next: (number | null)[]; prev: number | null; cur: number | null; note: string };

function trace(): Snap[] {
  const next: (number | null)[] = VALS.map((_, i) => (i + 1 < VALS.length ? i + 1 : null));
  const out: Snap[] = [{ next: [...next], prev: null, cur: 0, note: "Start: prev is None and cur is the head." }];
  let prev: number | null = null, cur: number | null = 0;
  while (cur !== null) {
    const nxt: number | null = next[cur];
    next[cur] = prev;
    out.push({ next: [...next], prev: cur, cur: nxt, note: `Save cur.next, point node ${VALS[cur]} back at ${prev === null ? "None" : VALS[prev]}, then step prev and cur forward.` });
    prev = cur; cur = nxt;
  }
  out[out.length - 1].note += ` cur is None, so prev, node ${VALS[prev!]}, is the new head.`;
  return out;
}

/** Reversing a singly linked list in place with three pointers: each step turns one arrow round. */
export function ReverseListViz() {
  const snaps = trace();
  const [t, setT] = useState(0);
  const s = snaps[t];
  const C = 104, W = VALS.length * C + 20, Y = 60;
  const x = (i: number) => 30 + i * C;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 130`} role="img" aria-label={`Linked list reversal, step ${t} of ${snaps.length - 1}`}>
        <defs>
          <marker id="rl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="plot-arrow" />
          </marker>
        </defs>
        {s.next.map((n, i) => {
          if (n === null) return <text key={`n${i}`} x={x(i) + 30} y={Y - 26} textAnchor="middle" className="plot-tick">→ None</text>;
          const fwd = n > i;
          const x1 = fwd ? x(i) + 46 : x(i) - 6, x2 = fwd ? x(n) - 8 : x(n) + 48;
          return <path key={`n${i}`} d={`M ${x1} ${Y + (fwd ? -6 : 6)} L ${x2} ${Y + (fwd ? -6 : 6)}`} className={fwd ? "plot-line" : "plot-curve"} markerEnd="url(#rl-arrow)" />;
        })}
        {VALS.map((v, i) => (
          <g key={i}>
            <rect x={x(i)} y={Y - 20} width={40} height={40} rx={6} className={s.prev === i ? "viz-cell is-on" : "viz-cell"} />
            <text x={x(i) + 20} y={Y + 5} textAnchor="middle" className="viz-label">{v}</text>
            {s.prev === i && <text x={x(i) + 20} y={Y + 42} textAnchor="middle" className="plot-tick">prev</text>}
            {s.cur === i && <text x={x(i) + 20} y={Y + 58} textAnchor="middle" className="plot-tick">cur</text>}
          </g>
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={t >= snaps.length - 1}>Next step</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} Each step changes exactly one pointer, so reversing n nodes takes n steps and no extra memory.
      </figcaption>
    </figure>
  );
}
