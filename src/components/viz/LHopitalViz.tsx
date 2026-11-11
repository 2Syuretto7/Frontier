"use client";

import { useState } from "react";
import { fmtNum } from "./format";

type Pair = { f: string; g: string; F: (x: number) => number; G: (x: number) => number; dF: (x: number) => number; dG: (x: number) => number; L: string };

const PAIRS: Pair[] = [
  { f: "sin 3x", g: "sin 5x", F: (x) => Math.sin(3 * x), G: (x) => Math.sin(5 * x), dF: (x) => 3 * Math.cos(3 * x), dG: (x) => 5 * Math.cos(5 * x), L: "3/5" },
  { f: "√(1 + x) − 1", g: "x", F: (x) => Math.sqrt(1 + x) - 1, G: (x) => x, dF: (x) => 1 / (2 * Math.sqrt(1 + x)), dG: () => 1, L: "1/2" },
  { f: "1 − cos x", g: "x²", F: (x) => 1 - Math.cos(x), G: (x) => x * x, dF: Math.sin, dG: (x) => 2 * x, L: "1/2" },
];

const W = 520, H = 260;

/** Two functions that both vanish at 0, seen under a microscope: their ratio approaches the ratio of their slopes. */
export function LHopitalViz() {
  const [k, setK] = useState(0);
  const [e, setE] = useState(0);
  const P = PAIRS[k];
  const w = 0.5 * 10 ** -e;
  let m = 0;
  for (let i = 0; i <= 200; i++) { const x = -w + (2 * w * i) / 200; m = Math.max(m, Math.abs(P.F(x)), Math.abs(P.G(x))); }
  m = m * 1.15 || 1;
  const X = (x: number) => ((x + w) / (2 * w)) * W;
  const Y = (y: number) => H / 2 - (y / m) * (H / 2);
  const path = (f: (x: number) => number) => Array.from({ length: 301 }, (_, i) => { const x = -w + (2 * w * i) / 300; return `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)}`; }).join(" ");
  const h = w / 2;
  const n4 = (t: number) => fmtNum(Number(t.toPrecision(5)));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Pair of functions">
        {PAIRS.map((p, i) => (
          <button key={p.f} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => { setK(i); setE(0); }}>
            <span className="mono">({p.f}) / ({p.g})</span>
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The graphs of ${P.f} and ${P.g} near 0`} className="plot">
        <line x1={0} y1={Y(0)} x2={W} y2={Y(0)} className="viz-axis" />
        <line x1={X(0)} y1={0} x2={X(0)} y2={H} className="viz-axis" />
        <line x1={X(h)} y1={0} x2={X(h)} y2={H} className="plot-mirror" />
        <path d={path(P.F)} className="plot-curve" />
        <path d={path(P.G)} className="plot-curve-2" />
        <text x={X(h) + 6} y={14} className="viz-label">x = {n4(h)}</text>
      </svg>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Zoom in towards 0 (window from −{n4(w)} to {n4(w)})
          <input type="range" className="viz-range" min={0} max={3} step={0.25} value={e} onChange={(ev) => setE(Number(ev.target.value))} />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>f(x) / g(x) at the marked x, with f = {P.f} (solid) and g = {P.g} (dashed)</td><td className="mono">{n4(P.F(h) / P.G(h))}</td></tr>
          <tr><td>f′(x) / g′(x) at the same x</td><td className="mono">{n4(P.dF(h) / P.dG(h))}</td></tr>
          <tr><td>the limit</td><td className="mono">{P.L}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {k === 2
          ? "Both functions are 0 at 0, and both graphs are flat there, so the ratio of the slopes is again 0/0. Apply the rule a second time: the second derivatives are cos x and 2, whose ratio tends to 1/2. As you zoom, the two curves keep the same shape relative to each other."
          : "Both functions are 0 at 0, so the quotient there is 0/0, which means nothing. Zoom in: each graph looks more and more like a straight line through the origin, and the ratio of the heights becomes the ratio of the slopes."}
      </figcaption>
    </figure>
  );
}
