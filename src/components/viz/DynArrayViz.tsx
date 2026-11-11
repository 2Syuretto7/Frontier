"use client";

import { useState } from "react";

type Rule = { name: string; grow: (cap: number) => number; note: string };

const RULES: Rule[] = [
  { name: "Double", grow: (c) => 2 * c, note: "Copies happen at 1, 2, 4, 8, …, and each is paid for by the cheap appends since the last one: the average stays below 3." },
  { name: "× 1.5", grow: (c) => Math.max(c + 1, Math.floor(c * 1.5)), note: "Resizes are more frequent but each is smaller. Any constant factor above 1 keeps the average bounded, here near 1 + 1/(1.5 − 1) = 3." },
  { name: "+ 8", grow: (c) => c + 8, note: "Growing by a constant means a copy every 8 appends, each of the whole array: the average grows in proportion to n, so the total is quadratic." },
];

/** Appending to a dynamic array: each append costs 1, plus a copy of every element when the array is full. */
export function DynArrayViz() {
  const [r, setR] = useState(0);
  const [n, setN] = useState(64);
  const rule = RULES[r];
  const costs: number[] = [];
  let cap = 1, size = 0, total = 0;
  for (let i = 0; i < n; i++) {
    let c = 1;
    if (size === cap) { c += size; cap = rule.grow(cap); }
    size++; total += c; costs.push(c);
  }
  const W = 560, H = 150, bw = W / n;
  const mx = Math.max(...costs);
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Growth rule">
        {RULES.map((x, i) => (
          <button key={x.name} type="button" className="seg" aria-pressed={r === i} onClick={() => setR(i)}>{x.name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} role="img" aria-label={`Cost of each of ${n} appends; the largest is ${mx}`}>
        {costs.map((c, i) => {
          const h = (c / mx) * H;
          return <rect key={i} x={i * bw + bw * 0.1} y={H - h} width={Math.max(bw * 0.8, 0.8)} height={Math.max(h, 1)} className={c > 1 ? "viz-cell is-on" : "viz-cell"} />;
        })}
        <line x1={0} x2={W} y1={H - ((total / n) / mx) * H} y2={H - ((total / n) / mx) * H} className="plot-line" />
        <text x={W} y={H + 16} textAnchor="end" className="plot-tick">append number 1 to {n}; the line is the average cost</text>
      </svg>
      <div className="viz-sliders">
        <label><span>Appends <span className="mono">n = {n}</span></span><input type="range" min={8} max={256} step={8} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Total cost <span className="mono">{total}</span> for {n} appends, an average of <span className="mono">{(total / n).toFixed(2)}</span> per
        append; the most expensive single append cost <span className="mono">{mx}</span>, and the final capacity is <span className="mono">{cap}</span>. {rule.note}
      </figcaption>
    </figure>
  );
}
