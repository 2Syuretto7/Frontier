"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; v: View; note: string }[] = [
  { name: "x² on [0, 1]", f: (x) => x * x, v: { xmin: -0.1, xmax: 1.1, ymin: -0.1, ymax: 1.1, w: 520, h: 260 }, note: "The gap shrinks like 1/n: x² is integrable, with integral 1/3." },
  { name: "a step at ½", f: (x) => (x < 0.5 ? 0.25 : 0.75), v: { xmin: -0.1, xmax: 1.1, ymin: -0.1, ymax: 1.1, w: 520, h: 260 }, note: "Only the one strip that contains the jump contributes to the gap, and its width shrinks. A function with a jump can still be integrable." },
  { name: "x sin(1/x) on [0, 1]", f: (x) => (x === 0 ? 0 : x * Math.sin(1 / x)), v: { xmin: -0.1, xmax: 1.1, ymin: -0.4, ymax: 1, w: 520, h: 260 }, note: "Infinitely many wiggles near 0, but they are small there, so the gap still shrinks: this function is integrable too." },
];

const SAMPLES = 60;

/** Upper and lower sums: the tallest rectangle that fits above, and the shortest that fits below, on each strip. */
export function UpperLowerViz() {
  const [k, setK] = useState(0);
  const [n, setN] = useState(5);
  const F = FNS[k];
  const { X, Y } = scales(F.v);
  const dx = 1 / n;
  const strips = Array.from({ length: n }, (_, i) => {
    const a = i * dx;
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j <= SAMPLES; j++) { const y = F.f(a + (dx * j) / SAMPLES); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    return { a, lo, hi };
  });
  const U = strips.reduce((s, r) => s + r.hi * dx, 0);
  const L = strips.reduce((s, r) => s + r.lo * dx, 0);
  const bar = (a: number, y: number, cls: string, style?: object) => (
    <rect x={X(a)} y={Math.min(Y(y), Y(0))} width={X(a + dx) - X(a)} height={Math.abs(Y(0) - Y(y))} className={cls} style={style} />
  );

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>{g.name}</button>
        ))}
      </div>
      <Axes v={F.v} label={`Upper and lower sums with ${n} strips`}>
        {strips.map((r) => <g key={r.a}>{bar(r.a, r.hi, "", { fill: "var(--danger)", fillOpacity: 0.18, stroke: "var(--danger)", strokeWidth: n > 40 ? 0.5 : 1 })}</g>)}
        {strips.map((r) => <g key={`l${r.a}`}>{bar(r.a, r.lo, "viz-region", { strokeWidth: n > 40 ? 0.5 : 1 })}</g>)}
        <path d={curvePath(F.v, (x) => (x >= 0 && x <= 1 ? F.f(x) : NaN), 1200)} className="plot-curve" />
      </Axes>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Strips n = <span className="mono">{n}</span>
          <input type="range" className="viz-range" min={1} max={80} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>upper sum U (red outlines, to the tops)</td><td className="mono">{fmtNum(Number(U.toFixed(5)))}</td></tr>
          <tr><td>lower sum L (shaded)</td><td className="mono">{fmtNum(Number(L.toFixed(5)))}</td></tr>
          <tr><td>gap U − L</td><td className="mono">{fmtNum(Number((U - L).toFixed(5)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Every possible value for the area lies between L and U. If the gap can be made as small as we like, only one number
        is left: the integral. {F.note}
      </figcaption>
    </figure>
  );
}
