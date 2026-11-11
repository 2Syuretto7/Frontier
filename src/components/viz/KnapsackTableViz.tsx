"use client";

import { useState } from "react";

const ITEMS: { name: string; w: number; v: number }[] = [
  { name: "tent", w: 5, v: 60 },
  { name: "stove", w: 3, v: 50 },
  { name: "camera", w: 4, v: 70 },
  { name: "book", w: 2, v: 30 },
];
const CAP = 9;

function table() {
  const best = Array.from({ length: ITEMS.length + 1 }, () => Array(CAP + 1).fill(0));
  ITEMS.forEach(({ w, v }, k) => {
    const i = k + 1;
    for (let c = 0; c <= CAP; c++) best[i][c] = Math.max(best[i - 1][c], w <= c ? best[i - 1][c - w] + v : -1);
  });
  return best;
}

/** The 0/1 knapsack table filled row by row: each cell is the better of skipping the item or taking it. */
export function KnapsackTableViz() {
  const best = table();
  const cells = ITEMS.length * (CAP + 1);
  const [t, setT] = useState(0);
  const filled = (i: number, c: number) => i === 0 || (i - 1) * (CAP + 1) + c < t;
  const cur = t > 0 && t <= cells ? { i: Math.floor((t - 1) / (CAP + 1)) + 1, c: (t - 1) % (CAP + 1) } : null;
  const done = t >= cells;
  // reconstruction once done
  const taken = new Set<number>();
  const path = new Set<string>();
  if (done) {
    let c = CAP;
    for (let i = ITEMS.length; i > 0; i--) {
      path.add(`${i},${c}`);
      if (best[i][c] !== best[i - 1][c]) { taken.add(i - 1); c -= ITEMS[i - 1].w; }
    }
    path.add(`0,${c}`);
  }
  const CW = 40, RH = 30, LW = 120, W = LW + (CAP + 1) * CW + 10, H = (ITEMS.length + 2) * RH + 10;
  const src = cur ? [`${cur.i - 1},${cur.c}`, ITEMS[cur.i - 1].w <= cur.c ? `${cur.i - 1},${cur.c - ITEMS[cur.i - 1].w}` : ""] : [];
  let note = "Row i, column c: the best value using the first i items with capacity c. Row 0 is all zeros.";
  if (cur) {
    const { w, v, name } = ITEMS[cur.i - 1];
    const skip = best[cur.i - 1][cur.c];
    note = w <= cur.c
      ? `Capacity ${cur.c}, ${name} (weight ${w}, value ${v}): skip it for ${skip}, or take it for ${best[cur.i - 1][cur.c - w]} + ${v} = ${best[cur.i - 1][cur.c - w] + v}. Best ${best[cur.i][cur.c]}.`
      : `Capacity ${cur.c}: the ${name} (weight ${w}) does not fit, so copy ${skip} from above.`;
  }
  if (done) note = `Best value ${best[ITEMS.length][CAP]}. Walking back up, a cell that differs from the one above means that item was taken: ${[...taken].sort().map((k) => ITEMS[k].name).join(", ")}.`;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Knapsack table">
        {Array.from({ length: CAP + 1 }, (_, c) => <text key={c} x={LW + c * CW + CW / 2} y={20} textAnchor="middle" className="plot-tick">{c}</text>)}
        {Array.from({ length: ITEMS.length + 1 }, (_, i) => (
          <g key={i}>
            <text x={LW - 8} y={RH + i * RH + 20} textAnchor="end" className="plot-tick">{i === 0 ? "nothing" : `${ITEMS[i - 1].name} ${ITEMS[i - 1].w}kg ₹${ITEMS[i - 1].v}`}</text>
            {Array.from({ length: CAP + 1 }, (_, c) => {
              const k = `${i},${c}`;
              const on = (cur && cur.i === i && cur.c === c) || path.has(k);
              return (
                <g key={c}>
                  <rect x={LW + c * CW + 2} y={RH + i * RH + 2} width={CW - 4} height={RH - 4} rx={4} className={on ? "viz-cell is-on" : "viz-cell"} style={src.includes(k) ? { strokeWidth: 3 } : undefined} />
                  {filled(i, c) && <text x={LW + c * CW + CW / 2} y={RH + i * RH + 20} textAnchor="middle" className="viz-label">{best[i][c]}</text>}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={done}>Next cell</button>
        <button type="button" className="btn" onClick={() => setT(Math.min(cells, (Math.floor(t / (CAP + 1)) + 1) * (CAP + 1)))} disabled={done}>Next row</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{note}</figcaption>
    </figure>
  );
}
