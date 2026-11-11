"use client";

import { useState } from "react";

const START = [41, 7, 88, 23, 56, 12, 95, 34, 67, 3, 78, 50];

type Snap = { a: number[]; lo: number; hi: number; p: number; note: string; done: boolean };

function trace(k: number): Snap[] {
  const a = [...START];
  let lo = 0, hi = a.length;
  const out: Snap[] = [{ a: [...a], lo, hi, p: -1, note: `Find the item of rank ${k} (0-based) among ${a.length}. Range [0, ${hi}).`, done: false }];
  let work = 0;
  for (;;) {
    const pivot = a[hi - 1];
    let i = lo;
    for (let j = lo; j < hi - 1; j++) if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
    [a[i], a[hi - 1]] = [a[hi - 1], a[i]];
    work += hi - lo - 1;
    if (i === k) {
      out.push({ a: [...a], lo, hi, p: i, note: `Partition around ${pivot}: it lands at ${i}, which is k. Done after ${work} comparisons; sorting would cost about ${Math.round(a.length * Math.log2(a.length))}.`, done: true });
      return out;
    }
    const [nlo, nhi] = i < k ? [i + 1, hi] : [lo, i];
    out.push({ a: [...a], lo: nlo, hi: nhi, p: i, note: `Partition around ${pivot}: it lands at ${i}. k = ${k} is ${i < k ? "right" : "left"} of it, so keep only [${nlo}, ${nhi}). ${work} comparisons so far.`, done: false });
    lo = nlo; hi = nhi;
    if (hi - lo === 1) {
      out.push({ a: [...a], lo, hi, p: lo, note: `One item left: a[${lo}] = ${a[lo]} has rank ${k}. Done after ${work} comparisons.`, done: true });
      return out;
    }
  }
}

/** Quickselect: partition as in quicksort, then recurse into the one side that holds rank k. */
export function QuickselectViz() {
  const [k, setK] = useState(5);
  const [t, setT] = useState(0);
  const snaps = trace(k);
  const s = snaps[Math.min(t, snaps.length - 1)];
  const C = 40, n = s.a.length, W = n * C + 10;
  const sorted = [...START].sort((x, y) => x - y);
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 92`} role="img" aria-label={`Array ${s.a.join(", ")}; live range ${s.lo} to ${s.hi}`}>
        {s.a.map((v, i) => {
          const live = i >= s.lo && i < s.hi;
          const fixed = s.a[i] === sorted[i] && !live;
          return (
            <g key={i}>
              <rect x={5 + i * C + 2} y={8} width={C - 4} height={C - 4} rx={5}
                className={live ? "viz-cell is-on" : "viz-cell"}
                style={i === s.p ? { strokeWidth: 3 } : live ? undefined : { opacity: fixed ? 0.6 : 0.35 }} />
              <text x={5 + i * C + C / 2} y={8 + C / 2 + 2} textAnchor="middle" className="viz-label">{v}</text>
              <text x={5 + i * C + C / 2} y={64} textAnchor="middle" className="plot-tick">{i}</text>
            </g>
          );
        })}
        <path d={`M ${5 + k * C + C / 2} 70 l 0 16`} className="plot-curve" />
        <text x={5 + k * C + C / 2 + (k > n - 2 ? -8 : 8)} y={86} textAnchor={k > n - 2 ? "end" : "start"} className="plot-tick">k</text>
      </svg>
      <div className="viz-sliders">
        <label><span>Rank <span className="mono">k = {k}</span></span><input type="range" min={0} max={START.length - 1} value={k} onChange={(e) => { setK(Number(e.target.value)); setT(0); }} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={s.done}>Next partition</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} {s.done && `Check: sorted, the list has ${sorted[k]} at index ${k}.`}
      </figcaption>
    </figure>
  );
}
