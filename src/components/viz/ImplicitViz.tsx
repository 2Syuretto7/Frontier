"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, paramPath, scales, type View } from "./Plot";

type Curve = {
  name: string;
  formula: string;
  slope: string;
  p: (t: number) => [number, number];
  pieces: [number, number][];
  grad: (x: number, y: number) => [number, number];
  t0: number; tmin: number; tmax: number;
};

const r8 = Math.sqrt(8), r24 = Math.sqrt(24), s2 = Math.SQRT2;

const CURVES: Curve[] = [
  {
    name: "circle", formula: "x² + y² = 25", slope: "−x / y",
    p: (t) => [5 * Math.cos(t), 5 * Math.sin(t)], pieces: [[0, 2 * Math.PI]],
    grad: (x, y) => [2 * x, 2 * y], t0: 0.93, tmin: 0, tmax: 6.28,
  },
  {
    name: "tilted ellipse", formula: "x² + xy + y² = 12", slope: "−(2x + y) / (x + 2y)",
    p: (t) => { const u = r8 * Math.cos(t), w = r24 * Math.sin(t); return [(u + w) / s2, (u - w) / s2]; }, pieces: [[0, 2 * Math.PI]],
    grad: (x, y) => [2 * x + y, x + 2 * y], t0: 0.6, tmin: 0, tmax: 6.28,
  },
  {
    name: "folium of Descartes", formula: "x³ + y³ = 6xy", slope: "(2y − x²) / (y² − 2x)",
    p: (t) => [(6 * t) / (1 + t ** 3), (6 * t * t) / (1 + t ** 3)], pieces: [[-0.82, 60], [-12, -1.25]],
    grad: (x, y) => [3 * x * x - 6 * y, 3 * y * y - 6 * x], t0: 1, tmin: -0.6, tmax: 5,
  },
];

const v: View = { xmin: -7, xmax: 7, ymin: -7, ymax: 7, w: 360, h: 360 };

/** A point moving round a curve given by an equation, with its tangent line and the slope from implicit differentiation. */
export function ImplicitViz() {
  const [k, setK] = useState(0);
  const C = CURVES[k];
  const [t, setT] = useState(C.t0);
  const { X, Y } = scales(v);
  const [x, y] = C.p(t);
  const [fx, fy] = C.grad(x, y);
  const g = Math.hypot(fx, fy) || 1;
  const dx = fy / g, dy = -fx / g, L = 4;
  const vertical = Math.abs(fy) < 1e-3 * g;
  const pick = (i: number) => { setK(i); setT(CURVES[i].t0); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Curve">
        {CURVES.map((c, i) => (
          <button key={c.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>
            <span className="mono">{c.formula}</span>
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <Axes v={v} label={`The ${C.name} ${C.formula} with its tangent at (${fmtNum(Number(x.toFixed(2)))}, ${fmtNum(Number(y.toFixed(2)))})`}>
          {C.pieces.map(([a, b]) => <path key={a} d={paramPath(v, C.p, a, b, 900)} className="plot-curve" />)}
          <line x1={X(x - L * dx)} y1={Y(y - L * dy)} x2={X(x + L * dx)} y2={Y(y + L * dy)} style={{ stroke: "var(--danger)", strokeWidth: 2 }} />
          <circle cx={X(x)} cy={Y(y)} r={5} className="plot-hot" />
        </Axes>
      </div>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Move the point round the curve
          <input type="range" className="viz-range" min={C.tmin} max={C.tmax} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>the point (x, y)</td><td className="mono">({fmtNum(Number(x.toFixed(3)))}, {fmtNum(Number(y.toFixed(3)))})</td></tr>
          <tr><td>dy/dx by implicit differentiation, <span className="mono">{C.slope}</span></td><td className="mono">{vertical ? "undefined (vertical tangent)" : fmtNum(Number((-fx / fy).toFixed(3)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is not the graph of one function: some vertical lines meet it twice. Yet near most points it is the graph
        of a function, and the formula gives the slope of the tangent (red) there from x and y together. Where the
        denominator is 0 the tangent is vertical, and no function y(x) describes the curve nearby.
      </figcaption>
    </figure>
  );
}
