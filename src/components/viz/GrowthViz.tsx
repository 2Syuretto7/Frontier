"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const STEPS = 20;
const W = 620, H = 250, x0 = 46, base = 214;

/** Adding the same amount each step against multiplying by the same factor each step. */
export function GrowthViz() {
  const [add, setAdd] = useState(20);
  const [pct, setPct] = useState(10);
  const lin = Array.from({ length: STEPS + 1 }, (_, n) => 100 + add * n);
  const exp = Array.from({ length: STEPS + 1 }, (_, n) => 100 * (1 + pct / 100) ** n);
  const top = Math.max(lin[STEPS], exp[STEPS]);
  const bw = (W - x0 - 10) / (STEPS + 1);
  const h = (v: number) => (v / top) * (base - 14);
  const cross = exp.findIndex((e, n) => n > 0 && e > lin[n]);
  const round = (v: number) => fmtNum(Math.round(v));

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Adding ${add} each step against growing ${pct} percent each step, over ${STEPS} steps`}>
        <line x1={x0} y1={base} x2={W - 6} y2={base} className="viz-axis" />
        {lin.map((v, n) => (
          <rect key={`l${n}`} x={x0 + n * bw + 1} y={base - h(v)} width={bw / 2 - 1.5} height={h(v)} className="viz-cell" />
        ))}
        {exp.map((v, n) => (
          <rect key={`e${n}`} x={x0 + n * bw + bw / 2} y={base - h(v)} width={bw / 2 - 1.5} height={h(v)} className="viz-cell is-on" />
        ))}
        {[0, 5, 10, 15, 20].map((n) => (
          <text key={n} x={x0 + n * bw + bw / 2} y={base + 16} textAnchor="middle" className="plot-tick">{n}</text>
        ))}
        <text x={x0 - 6} y={base - h(top) + 4} textAnchor="end" className="plot-tick">{round(top)}</text>
        <text x={x0 - 6} y={base + 4} textAnchor="end" className="plot-tick">0</text>
        <text x={W - 6} y={base + 34} textAnchor="end" className="viz-label">step n</text>
      </svg>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">add each step</span>
          <button type="button" className="btn" onClick={() => setAdd(Math.max(10, add - 10))} disabled={add <= 10} aria-label="Add less">−</button>
          <span className="mono viz-stepper-value">{add}</span>
          <button type="button" className="btn" onClick={() => setAdd(Math.min(100, add + 10))} disabled={add >= 100} aria-label="Add more">+</button>
        </span>
        <span className="viz-stepper"><span className="viz-stepper-label">grow each step</span>
          <button type="button" className="btn" onClick={() => setPct(Math.max(5, pct - 5))} disabled={pct <= 5} aria-label="Lower rate">−</button>
          <span className="mono viz-stepper-value">{pct}%</span>
          <button type="button" className="btn" onClick={() => setPct(Math.min(50, pct + 5))} disabled={pct >= 50} aria-label="Raise rate">+</button>
        </span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both start at 100. The plain bars add {add} each step, reaching <span className="mono">{round(lin[STEPS])}</span>; the shaded bars
        multiply by <span className="mono">{fmtNum(1 + pct / 100)}</span> each step, reaching <span className="mono">{round(exp[STEPS])}</span>.{" "}
        {cross > 0
          ? <>Growth by a fixed percentage starts slower, but overtakes at step {cross}, and after that the gap only widens.</>
          : <>Within {STEPS} steps the percentage growth has not yet caught up, but it always does eventually: raise the steps far enough and it wins by any margin.</>}
      </figcaption>
    </figure>
  );
}
