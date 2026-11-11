"use client";

import { useState } from "react";

const A = [2, 3, 3, 5, 8, 8, 8, 8, 11, 13, 13, 17, 19, 23, 23, 29];

type Snap = { lo: number; hi: number; mid: number; note: string };

function trace(x: number, right: boolean): Snap[] {
  let lo = 0, hi = A.length;
  const out: Snap[] = [{ lo, hi, mid: -1, note: `Search the half-open range [${lo}, ${hi}).` }];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const goRight = right ? A[mid] <= x : A[mid] < x;
    const cmp = right ? `${A[mid]} ≤ ${x}` : `${A[mid]} < ${x}`;
    if (goRight) { lo = mid + 1; out.push({ lo, hi, mid, note: `a[${mid}] = ${A[mid]}: ${cmp} is true, so the answer is right of ${mid}: lo = ${lo}.` }); }
    else { hi = mid; out.push({ lo, hi, mid, note: `a[${mid}] = ${A[mid]}: ${cmp} is false, so the answer is at or left of ${mid}: hi = ${hi}.` }); }
  }
  out[out.length - 1].note += ` lo = hi = ${lo}: done after ${out.length - 1} comparisons.`;
  return out;
}

/** Binary search as the search for the first index where a monotone test turns true: bisect_left and bisect_right differ only in that test. */
export function BinarySearchViz() {
  const [x, setX] = useState(8);
  const [right, setRight] = useState(false);
  const [t, setT] = useState(0);
  const snaps = trace(x, right);
  const s = snaps[Math.min(t, snaps.length - 1)];
  const C = 35, W = A.length * C + 10;
  const done = t >= snaps.length - 1;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Variant">
        <button type="button" className="seg" aria-pressed={!right} onClick={() => { setRight(false); setT(0); }}>bisect_left</button>
        <button type="button" className="seg" aria-pressed={right} onClick={() => { setRight(true); setT(0); }}>bisect_right</button>
      </div>
      <svg viewBox={`0 0 ${W} 86`} role="img" aria-label={`Sorted array; search range from ${s.lo} to ${s.hi}`}>
        {A.map((v, i) => (
          <g key={i}>
            <rect x={5 + i * C + 2} y={8} width={C - 4} height={C - 4} rx={4} className={i >= s.lo && i < s.hi ? "viz-cell is-on" : "viz-cell"} style={i === s.mid ? { strokeWidth: 3 } : i < s.lo || i >= s.hi ? { opacity: 0.4 } : undefined} />
            <text x={5 + i * C + C / 2} y={8 + C / 2 + 2} textAnchor="middle" className="viz-label">{v}</text>
            <text x={5 + i * C + C / 2} y={60} textAnchor="middle" className="plot-tick">{i}</text>
          </g>
        ))}
        {done && <path d={`M ${5 + s.lo * C} 66 l 0 18`} className="plot-curve" />}
      </svg>
      <div className="viz-sliders">
        <label><span>Target <span className="mono">x = {x}</span></span><input type="range" min={0} max={31} value={x} onChange={(e) => { setX(Number(e.target.value)); setT(0); }} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={done}>Next comparison</button>
        <button type="button" className="btn" onClick={() => setT(snaps.length - 1)} disabled={done}>Finish</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} {done && (right ? `Every item before index ${s.lo} is ≤ ${x}; inserting ${x} there keeps the order and puts it after any equal items.` : `Every item before index ${s.lo} is < ${x}; ${A[s.lo] === x ? `${x} first occurs at index ${s.lo}.` : `${x} is absent and would be inserted at index ${s.lo}.`}`)}
      </figcaption>
    </figure>
  );
}
