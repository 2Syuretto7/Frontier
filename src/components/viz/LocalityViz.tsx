"use client";

import { useMemo, useState } from "react";

const N = 8, LINE = 4;

function run(order: "row" | "col", cap: number) {
  const cache: number[] = [];
  const steps: { i: number; j: number; miss: boolean; cache: number[] }[] = [];
  for (let x = 0; x < N; x++)
    for (let y = 0; y < N; y++) {
      const [i, j] = order === "row" ? [x, y] : [y, x];
      const ln = Math.floor((i * N + j) / LINE);
      const k = cache.indexOf(ln);
      const miss = k < 0;
      if (!miss) cache.splice(k, 1);
      else if (cache.length === cap) cache.shift();
      cache.push(ln);
      steps.push({ i, j, miss, cache: [...cache] });
    }
  return steps;
}

/** An 8 by 8 row-major matrix, four elements per cache line, read row by row or column by column through a small LRU cache. */
export function LocalityViz() {
  const [order, setOrder] = useState<"row" | "col">("col");
  const [cap, setCap] = useState(4);
  const [t, setT] = useState(N * N - 1);
  const steps = useMemo(() => run(order, cap), [order, cap]);
  const s = steps[t];
  const misses = steps.slice(0, t + 1).filter((x) => x.miss).length;
  const seen = new Set(steps.slice(0, t + 1).map((x) => x.i * N + x.j));
  const C = 32, W = N * C + 10;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Traversal order">
        <button type="button" className="seg" aria-pressed={order === "row"} onClick={() => setOrder("row")}>row by row</button>
        <button type="button" className="seg" aria-pressed={order === "col"} onClick={() => setOrder("col")}>column by column</button>
      </div>
      <div className="viz-sliders">
        <label>
          <span>Cache holds {cap} lines</span>
          <input type="range" min={2} max={16} value={cap} onChange={(e) => setCap(Number(e.target.value))} aria-label="Cache size in lines" />
        </label>
        <label>
          <span>Access {t + 1} of {N * N}</span>
          <input type="range" min={0} max={N * N - 1} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Access number" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${N * C + 10}`} role="img" aria-label={`${misses} misses after ${t + 1} accesses`} style={{ maxWidth: 360 }}>
        {Array.from({ length: N * N }, (_, e) => {
          const i = Math.floor(e / N), j = e % N, ln = Math.floor(e / LINE);
          const cached = s.cache.includes(ln);
          const cur = s.i === i && s.j === j;
          return (
            <rect key={e} x={5 + j * C + 1} y={5 + i * C + 1} width={C - 2} height={C - 2} rx={3}
              className={cached ? "viz-cell is-on" : "viz-cell"}
              style={cur ? { stroke: s.miss ? "var(--danger)" : "var(--success)", strokeWidth: 3 } : seen.has(e) ? undefined : { opacity: 0.45 }} />
          );
        })}
        <line x1={5 + (N / 2) * C} x2={5 + (N / 2) * C} y1={5} y2={5 + N * C} className="plot-grid" style={{ strokeWidth: 2 }} />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Shaded cells are the lines now in the cache; each row is two lines of four elements, split by the bar. After{" "}
        <span className="mono">{t + 1}</span> accesses: <span className="mono">{misses}</span> misses.{" "}
        {order === "row"
          ? "Row by row, each line is loaded once and its other three elements are hits: 16 misses in all."
          : cap >= N
            ? "Column by column, but the cache now holds one line per row, so the next three columns find their lines still there: each line is loaded once."
            : "Column by column, each step jumps a whole row ahead; with fewer lines than rows, a line is evicted before the next column returns to it, so every access misses."}
      </figcaption>
    </figure>
  );
}
