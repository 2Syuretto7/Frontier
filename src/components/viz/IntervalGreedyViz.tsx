"use client";

import { useState } from "react";

const IVS: [number, number][] = [[0, 9], [1, 4], [2, 3], [4, 7], [6, 8], [7, 11], [10, 12], [11, 14], [13, 15], [14, 16]];
const RULES: { name: string; key: (iv: [number, number]) => number }[] = [
  { name: "Earliest finish", key: ([, e]) => e },
  { name: "Earliest start", key: ([s]) => s },
  { name: "Shortest", key: ([s, e]) => e - s },
];

function run(r: number) {
  const order = IVS.map((_, i) => i).sort((a, b) => RULES[r].key(IVS[a]) - RULES[r].key(IVS[b]) || a - b);
  const steps: { i: number; ok: boolean }[] = [];
  const taken: number[] = [];
  for (const i of order) {
    const [s, e] = IVS[i];
    const ok = taken.every((j) => e <= IVS[j][0] || s >= IVS[j][1]);
    if (ok) taken.push(i);
    steps.push({ i, ok });
  }
  return steps;
}

/** Interval scheduling: three greedy rules for choosing talks; only earliest finish is always optimal. */
export function IntervalGreedyViz() {
  const [r, setR] = useState(0);
  const [t, setT] = useState(0);
  const steps = run(r);
  const best = run(0).filter((s) => s.ok).length;
  const shown = steps.slice(0, t);
  const status = new Map(shown.map((s) => [s.i, s.ok]));
  const cur = t > 0 ? steps[t - 1] : null;
  const count = shown.filter((s) => s.ok).length;
  const U = 32, X0 = 10, W = 16 * U + 20, rowH = 18;
  const done = t >= steps.length;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Greedy rule">
        {RULES.map((rule, k) => <button key={rule.name} type="button" className="seg" aria-pressed={r === k} onClick={() => { setR(k); setT(0); }}>{rule.name}</button>)}
      </div>
      <svg viewBox={`0 0 ${W} ${IVS.length * rowH + 30}`} role="img" aria-label={`Intervals; ${count} chosen so far`}>
        {Array.from({ length: 17 }, (_, x) => (
          <g key={x}>
            <line x1={X0 + x * U} y1={4} x2={X0 + x * U} y2={IVS.length * rowH + 8} className="plot-grid" />
            {x % 2 === 0 && <text x={X0 + x * U} y={IVS.length * rowH + 24} textAnchor="middle" className="plot-tick">{x}</text>}
          </g>
        ))}
        {IVS.map(([s, e], i) => {
          const st = status.get(i);
          return (
            <rect key={i} x={X0 + s * U + 1} y={6 + i * rowH} width={(e - s) * U - 2} height={rowH - 6} rx={4}
              className={st ? "viz-cell is-on" : "viz-cell"}
              style={{ opacity: st === false ? 0.3 : 1, strokeWidth: cur && cur.i === i ? 3 : undefined }} />
          );
        })}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={done}>Next interval</button>
        <button type="button" className="btn" onClick={() => setT(steps.length)} disabled={done}>Finish</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {cur ? `[${IVS[cur.i][0]}, ${IVS[cur.i][1]}) ${cur.ok ? "fits with everything chosen: take it." : "overlaps a chosen interval: skip it."} ` : `Consider intervals in order of ${RULES[r].name.toLowerCase()}, taking each one that fits. `}
        {done ? `${RULES[r].name} chose ${count}; the most possible is ${best}.${count < best ? " This rule is not optimal." : ""}` : `${count} chosen so far.`}
      </figcaption>
    </figure>
  );
}
