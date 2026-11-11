"use client";

import { useState } from "react";
import { logFactorial } from "./calc";
import { pow10 } from "./format";
import { scales, type View } from "./Plot";

const FNS: { name: string; log10: (n: number) => number }[] = [
  { name: "log₂ n", log10: (n) => Math.log10(Math.max(1e-9, Math.log2(n))) },
  { name: "√n", log10: (n) => 0.5 * Math.log10(n) },
  { name: "n", log10: (n) => Math.log10(n) },
  { name: "n log₂ n", log10: (n) => Math.log10(n * Math.log2(n)) },
  { name: "n²", log10: (n) => 2 * Math.log10(n) },
  { name: "n³", log10: (n) => 3 * Math.log10(n) },
  { name: "2ⁿ", log10: (n) => n * Math.log10(2) },
  { name: "n!", log10: (n) => logFactorial(Math.round(n)) / Math.LN10 },
];

/** Common growth rates on a log scale, and how long each would take at a billion operations per second. */
export function GrowthRateViz() {
  const [n, setN] = useState(64);
  const V: View = { xmin: Math.log10(2), xmax: Math.log10(200), ymin: 0, ymax: 20, w: 520, h: 260 };
  const { X: Xl, Y } = scales(V);
  const X = (m: number) => Xl(Math.log10(m));
    const human = (l: number) => {
    const s = 10 ** (l - 9);
    if (s < 1e-6) return "under a microsecond";
    if (s < 1e-3) return `${(s * 1e6).toFixed(0)} μs`;
    if (s < 1) return `${(s * 1e3).toFixed(0)} ms`;
    if (s < 3600) return `${s.toFixed(0)} s`;
    if (s < 3.15e7) return `${(s / 3600).toFixed(0)} hours`;
    const yl = l - 9 - Math.log10(3.15e7);
    return yl < 6 ? `${Math.round(10 ** yl).toLocaleString("en-IN")} years` : `about ${pow10(Math.floor(yl))} years`;
  };
  return (
    <figure className="viz">
      <svg viewBox={`-30 -8 ${V.w + 90} ${V.h + 30}`} className="plot" role="img" aria-label="Growth rates on logarithmic axes">
        {[0, 5, 10, 15, 20].map((t) => <g key={t}><line x1={0} x2={V.w} y1={Y(t)} y2={Y(t)} className="plot-grid" /><text x={-4} y={Y(t) + 4} textAnchor="end" className="plot-tick">{pow10(t)}</text></g>)}
        <line x1={X(n)} x2={X(n)} y1={0} y2={V.h} className="plot-line" />
        {FNS.map((f, i) => {
          let d = ""; let last = 0, pen = false;
          for (let m = 2; m <= 200; m++) { const y = f.log10(m); if (y > 20) break; d += `${pen ? "L" : "M"}${X(m).toFixed(1)} ${Y(y).toFixed(1)} `; pen = true; last = m; }
          return <g key={f.name}><path d={d} className={i % 2 ? "plot-curve-2" : "plot-curve"} /><text x={X(last) + 4} y={Y(f.log10(last)) + 4} className="plot-tick">{f.name}</text></g>;
        })}
        <text x={V.w} y={V.h + 18} textAnchor="end" className="plot-tick">n from 2 to 200, log scale</text>
      </svg>
      <div className="viz-sliders">
        <label>n = <span className="mono">{n}</span><input type="range" min={2} max={200} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>f(n)</th><th>value at n = {n}</th><th>time at 10⁹ steps per second</th></tr></thead>
          <tbody>{FNS.map((f) => { const l = f.log10(n); return <tr key={f.name}><td style={{ whiteSpace: "nowrap" }}>{f.name}</td><td className="mono">{l < 15 ? Math.round(10 ** l).toLocaleString("en-IN") : `about ${pow10(Math.floor(l))}`}</td><td>{human(l)}</td></tr>; })}</tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both axes are logarithmic, so every power of n is a straight line whose slope is its exponent, while 2ⁿ and n! curve upward and shoot off the top. Each function in the list is
        eventually overtaken by the next, however the constants are chosen.
      </figcaption>
    </figure>
  );
}
