"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; df: (x: number) => number; v: View; a0: number; amin: number; amax: number }[] = [
  { name: "x²", f: (x) => x * x, df: (x) => 2 * x, v: { xmin: -1, xmax: 3, ymin: -1, ymax: 7, w: 520, h: 280 }, a0: 1, amin: -0.5, amax: 2 },
  { name: "x³ − 3x", f: (x) => x ** 3 - 3 * x, df: (x) => 3 * x * x - 3, v: { xmin: -2.5, xmax: 2.5, ymin: -4, ymax: 4, w: 520, h: 280 }, a0: 0.5, amin: -2, amax: 1.5 },
  { name: "sin x", f: Math.sin, df: Math.cos, v: { xmin: -1, xmax: 5, ymin: -2, ymax: 2, w: 520, h: 280 }, a0: 1, amin: -0.5, amax: 3.5 },
];

/** Secant lines through (a, f(a)) and (a + h, f(a + h)) turning into the tangent as h shrinks. */
export function SecantViz() {
  const [k, setK] = useState(0);
  const F = FNS[k];
  const [a, setA] = useState(F.a0);
  const [e, setE] = useState(0);
  const h = 10 ** -e;
  const { X, Y } = scales(F.v);
  const slope = (F.f(a + h) - F.f(a)) / h;
  const line = (m: number) => (x: number) => F.f(a) + m * (x - a);
  const pick = (i: number) => { setK(i); setA(FNS[i].a0); setE(0); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>
            <span className="mono">f(x) = {g.name}</span>
          </button>
        ))}
      </div>
      <Axes v={F.v} label={`The secant of ${F.name} from ${a} to ${a + h}`}>
        <path d={curvePath(F.v, line(F.df(a)), 2)} className="plot-ghost" />
        <path d={curvePath(F.v, F.f, 600)} className="plot-curve" />
        <path d={curvePath(F.v, line(slope), 2)} style={{ fill: "none", stroke: "var(--danger)", strokeWidth: 2 }} />
        <circle cx={X(a)} cy={Y(F.f(a))} r={5} className="plot-point" />
        <circle cx={X(a + h)} cy={Y(F.f(a + h))} r={5} className="plot-hot" />
      </Axes>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 160 }}>
          Point a = <span className="mono">{fmtNum(a)}</span>
          <input type="range" className="viz-range" min={F.amin} max={F.amax} step={0.05} value={a} onChange={(ev) => setA(Number(ev.target.value))} />
        </label>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 160 }}>
          Step h = <span className="mono">{fmtNum(Number(h.toPrecision(3)))}</span>
          <input type="range" className="viz-range" min={0} max={3} step={0.25} value={e} onChange={(ev) => setE(Number(ev.target.value))} aria-label="How small h is" />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>slope of the secant (red), (f(a + h) − f(a)) / h</td><td className="mono">{fmtNum(Number(slope.toFixed(4)))}</td></tr>
          <tr><td>slope of the tangent (dashed), f′(a)</td><td className="mono">{fmtNum(Number(F.df(a).toFixed(4)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The red line passes through two points of the graph. As h shrinks, the second point slides towards the first and the
        red line swings into the dashed tangent. The derivative is the limit of the secant slopes.
      </figcaption>
    </figure>
  );
}
