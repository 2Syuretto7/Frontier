"use client";

import { useState } from "react";

const INPUTS: Record<string, number[]> = {
  Shuffled: [3, 8, 2, 5, 1, 4, 7, 6],
  Sorted: [1, 2, 3, 4, 5, 6, 7, 8],
  "Many equal": [4, 4, 1, 4, 7, 4, 2, 4],
};

type Snap = { a: number[]; i: number; j: number; note: string; done: boolean };

function trace(start: number[]): Snap[] {
  const a = [...start], hi = a.length - 1, pivot = a[hi];
  let i = 0;
  const out: Snap[] = [{ a: [...a], i, j: 0, note: `The pivot is the last item, ${pivot}. Items before i are smaller than it.`, done: false }];
  for (let j = 0; j < hi; j++) {
    if (a[j] < pivot) {
      [a[i], a[j]] = [a[j], a[i]];
      i++;
      out.push({ a: [...a], i, j: j + 1, note: `${a[i - 1]} < ${pivot}: swap it to position ${i - 1} and advance i.`, done: false });
    } else out.push({ a: [...a], i, j: j + 1, note: `${a[j]} ≥ ${pivot}: leave it; it belongs to the right part.`, done: false });
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  out.push({ a: [...a], i, j: hi, note: `Swap the pivot into position ${i}. Left of it: ${i} smaller items; right: ${hi - i} others.`, done: true });
  return out;
}

/** Lomuto partition, one comparison at a time: a pointer i marks the end of the region of items smaller than the pivot. */
export function PartitionStepViz() {
  const [name, setName] = useState("Shuffled");
  const snaps = trace(INPUTS[name]);
  const [t, setT] = useState(0);
  const s = snaps[Math.min(t, snaps.length - 1)];
  const C = 60, n = s.a.length;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Input">
        {Object.keys(INPUTS).map((k) => <button key={k} type="button" className="seg" aria-pressed={name === k} onClick={() => { setName(k); setT(0); }}>{k}</button>)}
      </div>
      <svg viewBox={`0 0 ${n * C + 10} 110`} role="img" aria-label={`Array ${s.a.join(", ")}`}>
        {s.a.map((v, k) => (
          <g key={k}>
            <rect x={5 + k * C + 3} y={10} width={C - 6} height={C - 6} rx={6}
              className={s.done ? (k === s.i ? "viz-cell is-on" : "viz-cell") : k < s.i ? "viz-cell is-on" : "viz-cell"}
              style={k === n - 1 && !s.done ? { strokeWidth: 3 } : undefined} />
            <text x={5 + k * C + C / 2} y={10 + C / 2 + 2} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        {!s.done && <text x={5 + s.i * C + C / 2} y={88} textAnchor="middle" className="plot-tick">i</text>}
        {!s.done && s.j < n - 1 && <text x={5 + s.j * C + C / 2} y={104} textAnchor="middle" className="plot-tick">j</text>}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={t >= snaps.length - 1}>Next comparison</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} {s.done && (s.i === 0 || s.i === n - 1 ? "The split is as lopsided as possible: recursing on n − 1 items each time costs Θ(n²) in all." : name === "Many equal" ? "Equal items all went right; with many duplicates the splits stay lopsided, which a three-way partition fixes." : "A balanced split: recursing on two halves gives Θ(n log n).")}
      </figcaption>
    </figure>
  );
}
