"use client";

import { useState } from "react";

const START = [5, 2, 9, 1, 7, 3, 8, 6];

type Snap = { a: number[]; i: number; j: number; comps: number; note: string };

function trace(start: number[]): Snap[] {
  const a = [...start];
  const out: Snap[] = [{ a: [...a], i: 1, j: -1, comps: 0, note: "The first element alone is a sorted list." }];
  let comps = 0;
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      comps++;
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        out.push({ a: [...a], i, j: j - 1, comps, note: `${a[j]} > ${a[j - 1]}, so swap them.` });
        j--;
      } else {
        out.push({ a: [...a], i, j, comps, note: `${a[j - 1]} ≤ ${a[j]}: ${a[j]} is in place, and the first ${i + 1} elements are sorted.` });
        break;
      }
    }
    if (j === 0) out.push({ a: [...a], i, j: 0, comps, note: `${a[0]} reached the front; the first ${i + 1} elements are sorted.` });
  }
  return out;
}

/** Insertion sort, one comparison at a time: the invariant is that a growing prefix is always sorted. */
export function InsertionSortViz() {
  const [rev, setRev] = useState(false);
  const start = rev ? [...START].sort((x, y) => y - x) : START;
  const snaps = trace(start);
  const [t, setT] = useState(0);
  const s = snaps[Math.min(t, snaps.length - 1)];
  const C = 56;
  const done = t >= snaps.length - 1;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Input">
        <button type="button" className="seg" aria-pressed={!rev} onClick={() => { setRev(false); setT(0); }}>Shuffled input</button>
        <button type="button" className="seg" aria-pressed={rev} onClick={() => { setRev(true); setT(0); }}>Reversed input</button>
      </div>
      <svg viewBox={`0 0 ${START.length * C + 10} 90`} role="img" aria-label={`Array ${s.a.join(", ")}`}>
        {s.a.map((v, k) => (
          <g key={k}>
            <rect x={5 + k * C + 3} y={10} width={C - 6} height={C - 6} rx={6} className={k <= s.i || done ? "viz-cell is-on" : "viz-cell"} style={k === s.j ? { strokeWidth: 3 } : undefined} />
            <text x={5 + k * C + C / 2} y={10 + C / 2 + 2} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={done}>Next comparison</button>
        <button type="button" className="btn" onClick={() => setT(snaps.length - 1)} disabled={done}>Finish</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} Comparisons so far: <span className="mono">{s.comps}</span>.{" "}
        {done && <>Finished. On {START.length} items the worst case, reversed input, needs {START.length * (START.length - 1) / 2} = n(n − 1)/2 comparisons; a nearly sorted input needs about n.</>}
      </figcaption>
    </figure>
  );
}
