"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; A: (x: number) => number; Aname: string; vf: View; vA: View }[] = [
  { name: "t", f: (t) => t, A: (x) => (x * x) / 2, Aname: "x²/2", vf: { xmin: -0.3, xmax: 3.3, ymin: -0.5, ymax: 3.5, w: 520, h: 170 }, vA: { xmin: -0.3, xmax: 3.3, ymin: -0.5, ymax: 5, w: 520, h: 170 } },
  { name: "cos t", f: Math.cos, A: Math.sin, Aname: "sin x", vf: { xmin: -0.3, xmax: 6.5, ymin: -1.3, ymax: 1.3, w: 520, h: 170 }, vA: { xmin: -0.3, xmax: 6.5, ymin: -1.3, ymax: 1.3, w: 520, h: 170 } },
  { name: "t² − 2t", f: (t) => t * t - 2 * t, A: (x) => x ** 3 / 3 - x * x, Aname: "x³/3 − x²", vf: { xmin: -0.3, xmax: 3.3, ymin: -1.5, ymax: 3.5, w: 520, h: 170 }, vA: { xmin: -0.3, xmax: 3.3, ymin: -1.8, ymax: 1.5, w: 520, h: 170 } },
];

/** The area function A(x), the integral of f from 0 to x, drawn beneath f: its slope at x is f(x). */
export function FTCViz() {
  const [k, setK] = useState(0);
  const F = FNS[k];
  const [x, setX] = useState(1.5);
  const sf = scales(F.vf), sA = scales(F.vA);
  const xmax = F.vf.xmax - 0.3;
  const N = 120;
  let area = `M${sf.X(0)} ${sf.Y(0)} `;
  for (let i = 0; i <= N; i++) { const t = (x * i) / N; area += `L${sf.X(t).toFixed(1)} ${sf.Y(F.f(t)).toFixed(1)} `; }
  area += `L${sf.X(x)} ${sf.Y(0)} Z`;
  const slope = F.f(x);
  const tangent = (t: number) => F.A(x) + slope * (t - x);
  const pick = (i: number) => { setK(i); setX(Math.min(x, FNS[i].vf.xmax - 0.3)); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>
            <span className="mono">f(t) = {g.name}</span>
          </button>
        ))}
      </div>
      <p className="mono-meta" style={{ margin: "10px 0 0", textTransform: "none" }}>f(t), with the signed area from 0 to x shaded</p>
      <Axes v={F.vf} label={`The graph of ${F.name} with the area from 0 to ${fmtNum(x)} shaded`}>
        <path d={area} className="viz-region" style={{ strokeWidth: 0 }} />
        <path d={curvePath(F.vf, F.f, 500)} className="plot-curve" />
        <line x1={sf.X(x)} y1={sf.Y(0)} x2={sf.X(x)} y2={sf.Y(F.f(x))} style={{ stroke: "var(--danger)", strokeWidth: 2 }} />
        <circle cx={sf.X(x)} cy={sf.Y(F.f(x))} r={5} className="plot-hot" />
      </Axes>
      <p className="mono-meta" style={{ margin: "10px 0 0", textTransform: "none" }}>A(x) = the shaded area = {F.Aname}, with its tangent</p>
      <Axes v={F.vA} label={`The area function ${F.Aname} with its tangent at ${fmtNum(x)}`}>
        <path d={curvePath(F.vA, tangent, 2)} className="plot-ghost" />
        <path d={curvePath(F.vA, F.A, 500)} className="plot-curve" />
        <circle cx={sA.X(x)} cy={sA.Y(F.A(x))} r={5} className="plot-hot" />
      </Axes>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          x = <span className="mono">{fmtNum(x)}</span>
          <input type="range" className="viz-range" min={0} max={xmax} step={0.05} value={x} onChange={(e) => setX(Number(e.target.value))} />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>A(x), the shaded area</td><td className="mono">{fmtNum(Number(F.A(x).toFixed(4)))}</td></tr>
          <tr><td>slope of A at x, measured as (A(x + h) − A(x − h)) / 2h with h = 0.0001</td><td className="mono">{fmtNum(Number(((F.A(x + 1e-4) - F.A(x - 1e-4)) / 2e-4).toFixed(4)))}</td></tr>
          <tr><td>height of f at x (red)</td><td className="mono">{fmtNum(Number(F.f(x).toFixed(4)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Move x a little to the right and the area grows by a thin strip, whose area is about f(x) times the step. So the
        rate at which the area grows is the height f(x). Where f is negative, area below the axis counts as negative, and A
        falls.
      </figcaption>
    </figure>
  );
}
