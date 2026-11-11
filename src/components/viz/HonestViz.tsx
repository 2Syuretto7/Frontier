"use client";

import { useState } from "react";

const MODELS = [{ name: "baseline", mean: 91.2, sd: 0.5 }, { name: "new method", mean: 92.0, sd: 0.6 }];
const W = 360, H = 220, PAD = { l: 44, b: 30, t: 10 };

/** The same two numbers drawn honestly and dishonestly: a truncated axis and missing error bars. */
export function HonestViz() {
  const [zero, setZero] = useState(false);
  const [bars, setBars] = useState(false);
  const lo = zero ? 0 : 90.5, hi = zero ? 100 : 93;
  const Y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const ticks = zero ? [0, 25, 50, 75, 100] : [90.5, 91, 91.5, 92, 92.5, 93];
  const hA = Y(lo) - Y(MODELS[0].mean), hB = Y(lo) - Y(MODELS[1].mean);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setZero(!zero)}>{zero ? "Truncate the axis" : "Start the axis at 0"}</button>
        <button type="button" className="btn" onClick={() => setBars(!bars)}>{bars ? "Hide" : "Show"} spread over 5 seeds</button>
      </div>
      <div style={{ maxWidth: 420, margin: "12px auto 0" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="Accuracy of two models as a bar chart">
          {ticks.map((t) => <g key={t}><line x1={PAD.l} x2={W - 10} y1={Y(t)} y2={Y(t)} className="plot-grid" /><text x={PAD.l - 6} y={Y(t) + 4} textAnchor="end" className="plot-tick">{t}</text></g>)}
          {MODELS.map((m, i) => {
            const x = PAD.l + 40 + i * 140;
            return (
              <g key={m.name}>
                <rect x={x} y={Y(m.mean)} width={80} height={Y(lo) - Y(m.mean)} className={i ? "hb-bar is-new" : "hb-bar"} />
                {bars && <g className="hb-err"><line x1={x + 40} x2={x + 40} y1={Y(m.mean + 2 * m.sd)} y2={Y(m.mean - 2 * m.sd)} /><line x1={x + 30} x2={x + 50} y1={Y(m.mean + 2 * m.sd)} y2={Y(m.mean + 2 * m.sd)} /><line x1={x + 30} x2={x + 50} y1={Y(m.mean - 2 * m.sd)} y2={Y(m.mean - 2 * m.sd)} /></g>}
                <text x={x + 40} y={H - 10} textAnchor="middle" className="plot-tick">{m.name}: {m.mean}%</text>
              </g>
            );
          })}
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={Y(lo)} className="viz-axis" />
        </svg>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(hB / hA).toFixed(2)}×</b><span>how much taller the new bar looks</span></div>
        <div className="ml-stat"><b>{(MODELS[1].mean / MODELS[0].mean).toFixed(3)}×</b><span>actual ratio of the accuracies</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {zero ? "Starting at zero, bar lengths are proportional to the values, and the gain looks as small as it is." : "With the axis starting at 90.5, the new bar looks far taller, though the accuracies differ by under 1%. Bars encode values by length, so their axis must start at zero."}{" "}
        {bars ? "The whiskers span two standard deviations across five random seeds. They overlap, so this difference may be noise." : "A single run hides how much results vary between seeds."}
      </figcaption>
    </figure>
  );
}
