"use client";

import { useState } from "react";

/** The recursion tree of merge sort: halve until size 1; each level merges n items in total, and there are about log₂ n levels. */
export function MergeTreeViz() {
  const [e, setE] = useState(3);
  const n = 2 ** e;
  const W = 560, rowH = 38;
  const levels = Array.from({ length: e + 1 }, (_, d) => ({ d, count: 2 ** d, size: n / 2 ** d }));
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${(e + 1) * rowH + 10}`} role="img" aria-label={`Merge sort recursion tree for n = ${n}`}>
        {levels.map(({ d, count, size }) => {
          const w = (W - 120) / count;
          return (
            <g key={d}>
              {Array.from({ length: count }, (_, k) => (
                <g key={k}>
                  <rect x={4 + k * w + 1} y={5 + d * rowH} width={Math.max(2, w - 2)} height={rowH - 12} rx={4} className={d === e ? "viz-cell is-on" : "viz-cell"} />
                  {w > 22 && <text x={4 + k * w + w / 2} y={5 + d * rowH + (rowH - 12) / 2 + 4} textAnchor="middle" className="plot-tick">{size}</text>}
                </g>
              ))}
              <text x={W - 6} y={5 + d * rowH + (rowH - 12) / 2 + 4} textAnchor="end" className="viz-label">{count} × {size} = {n}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-sliders">
        <label><span>Items <span className="mono">n = 2^{e} = {n}</span></span><input type="range" min={1} max={6} value={e} onChange={(ev) => setE(Number(ev.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        T(n) = 2T(n/2) + n. Level d has 2ᵈ subproblems of size n/2ᵈ, so merging at every level costs {n} in total. There are{" "}
        log₂ {n} = {e} levels of merging, so the work is about <span className="mono">n log₂ n = {n * e}</span>, against{" "}
        <span className="mono">n(n − 1)/2 = {(n * (n - 1)) / 2}</span> comparisons for insertion sort in the worst case.
      </figcaption>
    </figure>
  );
}
