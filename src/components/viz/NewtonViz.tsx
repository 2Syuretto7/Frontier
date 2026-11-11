"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; df: (x: number) => number; v: View; x0: number; note: string }[] = [
  { name: "x² − 2", f: (x) => x * x - 2, df: (x) => 2 * x, v: { xmin: -1, xmax: 4, ymin: -3, ymax: 10, w: 520, h: 280 }, x0: 3, note: "The root is √2 ≈ 1.414214. Watch the number of correct digits roughly double at each step." },
  { name: "cos x − x", f: (x) => Math.cos(x) - x, df: (x) => -Math.sin(x) - 1, v: { xmin: -1, xmax: 3, ymin: -4, ymax: 2, w: 520, h: 280 }, x0: 2.5, note: "No algebra solves cos x = x, but Newton’s method finds the root 0.739085 in a few steps." },
  { name: "x³ − 2x + 2", f: (x) => x ** 3 - 2 * x + 2, df: (x) => 3 * x * x - 2, v: { xmin: -2.5, xmax: 2, ymin: -4, ymax: 6, w: 520, h: 280 }, x0: 0, note: "Starting at 0, the iterates jump to 1, back to 0, and cycle for ever. Try a start below −1 instead." },
];

/** Newton's method: follow the tangent line down to the axis, and repeat. */
export function NewtonViz() {
  const [k, setK] = useState(0);
  const F = FNS[k];
  const [x0, setX0] = useState(F.x0);
  const [n, setN] = useState(0);
  const { X, Y } = scales(F.v);
  const xs = [x0];
  for (let i = 0; i < 6; i++) { const x = xs[i]; const d = F.df(x); xs.push(d === 0 ? x : x - F.f(x) / d); }
  const pick = (i: number) => { setK(i); setX0(FNS[i].x0); setN(0); };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}><span className="mono">f(x) = {g.name}</span></button>)}
      </div>
      <Axes v={F.v} label={`Newton's method on ${F.name}`}>
        <path d={curvePath(F.v, F.f, 500)} className="plot-curve" />
        {xs.slice(0, n).map((x, i) => (
          <g key={i}>
            <line x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(F.f(x))} className="plot-mirror" />
            <line x1={X(x)} y1={Y(F.f(x))} x2={X(xs[i + 1])} y2={Y(0)} className="plot-line" />
          </g>
        ))}
        {xs.slice(0, n + 1).map((x, i) => <circle key={i} cx={X(x)} cy={Y(0)} r={i === n ? 5 : 3.5} className={i === n ? "plot-hot" : "plot-point"} />)}
      </Axes>
      <div className="viz-sliders">
        <label>Start x₀ = <span className="mono">{fmtNum(x0)}</span><input type="range" min={F.v.xmin + 0.1} max={F.v.xmax - 0.1} step={0.05} value={x0} onChange={(e) => { setX0(Number(e.target.value)); setN(0); }} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setN(0)} disabled={n === 0}>Reset</button>
        <button type="button" className="btn btn-primary" onClick={() => setN(Math.min(6, n + 1))} disabled={n === 6}>Take a step</button>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <thead><tr><th>step</th><th>x</th><th>f(x)</th></tr></thead>
        <tbody>{xs.slice(0, n + 1).map((x, i) => <tr key={i}><td>{i}</td><td className="mono">{Number.isFinite(x) ? x.toFixed(8) : "?"}</td><td className="mono">{Number.isFinite(x) ? F.f(x).toExponential(2) : "?"}</td></tr>)}</tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Each step replaces the curve by its tangent line and jumps to where the tangent crosses zero:{" "}
        x<sub>n+1</sub> = x<sub>n</sub> − f(x<sub>n</sub>) / f′(x<sub>n</sub>). {F.note}
      </figcaption>
    </figure>
  );
}
