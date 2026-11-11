"use client";

import { useState } from "react";

const OPS: { name: string; label: string; other: (x: number) => number; op: (x: number, y: number) => number; sym: string; note: (x: number, r: number) => string }[] = [
  { name: "x & (x − 1)", label: "x − 1", other: (x) => (x - 1) & 255, op: (a, b) => a & b, sym: "&", note: (x, r) => (x ? `Subtracting 1 flips the lowest 1 and every 0 below it, so AND clears just the lowest 1. ${r === 0 ? "Result 0: x was a power of two." : "Repeat until 0 to count the 1 bits."}` : "x = 0 has no 1 bits.") },
  { name: "x & −x", label: "−x", other: (x) => -x & 255, op: (a, b) => a & b, sym: "&", note: (x, r) => (x ? `−x is "flip and add 1", which agrees with x only at the lowest 1: this isolates it, value ${r}. Fenwick trees step by this amount.` : "x = 0 gives 0.") },
  { name: "x | (x + 1)", label: "x + 1", other: (x) => (x + 1) & 255, op: (a, b) => a | b, sym: "|", note: () => "Adding 1 turns the lowest 0 into a 1 (and the 1s below it to 0); OR sets that lowest 0 bit and keeps everything else." },
  { name: "x ^ (x >> 1)", label: "x >> 1", other: (x) => x >> 1, op: (a, b) => a ^ b, sym: "^", note: () => "The Gray code of x: consecutive values of x give codes that differ in exactly one bit." },
];

/** Classic bit tricks on an 8-bit value, shown as the two operands and the result. */
export function BitTrickViz() {
  const [x, setX] = useState(88);
  const [k, setK] = useState(0);
  const o = OPS[k];
  const y = o.other(x);
  const r = o.op(x, y) & 255;
  const C = 40, X0 = 80, W = X0 + 8 * C + 10;
  const row = (v: number, yy: number, label: string, hot: boolean) => (
    <g>
      <text x={X0 - 10} y={yy + C / 2 + 1} textAnchor="end" className="plot-tick">{label}</text>
      {Array.from({ length: 8 }, (_, i) => {
        const b = (v >> (7 - i)) & 1;
        return (
          <g key={i}>
            <rect x={X0 + i * C + 2} y={yy} width={C - 4} height={C - 6} rx={5} className={b ? "viz-cell is-on" : "viz-cell"} style={hot ? { strokeWidth: 2.5 } : undefined} />
            <text x={X0 + i * C + C / 2} y={yy + (C - 6) / 2 + 5} textAnchor="middle" className="viz-label">{b}</text>
          </g>
        );
      })}
      <text x={X0 + 8 * C + 6} y={yy + C / 2 + 1} className="plot-tick">{v}</text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Trick">
        {OPS.map((op, i) => <button key={op.name} type="button" className="seg mono" aria-pressed={k === i} onClick={() => setK(i)}>{op.name}</button>)}
      </div>
      <svg viewBox={`0 0 ${W + 30} ${3 * C + 20}`} role="img" aria-label={`${o.name} for x = ${x} gives ${r}`}>
        {row(x, 4, "x", false)}
        {row(y, C + 4, o.label, false)}
        <line x1={X0} y1={2 * C + 6} x2={X0 + 8 * C} y2={2 * C + 6} className="plot-grid" />
        {row(r, 2 * C + 12, `${o.sym} result`, true)}
      </svg>
      <div className="viz-sliders">
        <label><span>x <span className="mono">= {x}</span></span><input type="range" min={0} max={255} value={x} onChange={(e) => setX(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{o.note(x, r)}</figcaption>
    </figure>
  );
}
