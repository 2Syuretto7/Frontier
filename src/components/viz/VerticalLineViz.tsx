"use client";

import { useState } from "react";
import { Axes, curvePath, paramPath, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 6, ymin: -4.5, ymax: 4.5, w: 480, h: 360 };

type Curve = {
  name: string;
  tex: string;
  path: () => string;
  /** The y-values where the vertical line x = c meets the curve. */
  hits: (c: number) => number[];
};

const CURVES: Curve[] = [
  { name: "Parabola", tex: "y = x²/4", path: () => curvePath(V, (x) => (x * x) / 4), hits: (c) => [(c * c) / 4] },
  {
    name: "Circle", tex: "x² + y² = 9",
    path: () => paramPath(V, (t) => [3 * Math.cos(t), 3 * Math.sin(t)], 0, 2 * Math.PI),
    hits: (c) => (Math.abs(c) > 3 ? [] : Math.abs(c) === 3 ? [0] : [Math.sqrt(9 - c * c), -Math.sqrt(9 - c * c)]),
  },
  { name: "Square root", tex: "y = √x", path: () => curvePath(V, (x) => (x < 0 ? NaN : Math.sqrt(x)), 800), hits: (c) => (c < 0 ? [] : [Math.sqrt(c)]) },
  {
    name: "Sideways parabola", tex: "x = y²/2",
    path: () => paramPath(V, (t) => [(t * t) / 2, t], -4.5, 4.5),
    hits: (c) => (c < 0 ? [] : c === 0 ? [0] : [Math.sqrt(2 * c), -Math.sqrt(2 * c)]),
  },
];

/** The vertical line test: slide x = c across a curve and count where it meets it. */
export function VerticalLineViz() {
  const [k, setK] = useState(0);
  const [c, setC] = useState(1.5);
  const curve = CURVES[k];
  const { X, Y } = scales(V);
  const hits = curve.hits(c);
  const verdict =
    hits.length === 1
      ? <>The line meets the curve once, at <span className="mono">y = {fmtNum(Math.round(hits[0] * 100) / 100)}</span>.</>
      : hits.length === 0
        ? <>The line misses the curve: <span className="mono">{fmtNum(c)}</span> is not in the domain.</>
        : <>The line meets the curve <strong>twice</strong>, so this input would have two outputs.</>;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {CURVES.map((cv, i) => (
          <button key={cv.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            {cv.name}
          </button>
        ))}
      </div>
      <Axes v={V} label={`The curve ${curve.tex} with the vertical line x = ${c}`}>
        <path d={curve.path()} className="plot-curve" />
        <line x1={X(c)} y1={0} x2={X(c)} y2={V.h} className="plot-line" />
        {hits.map((y, i) => <circle key={i} cx={X(c)} cy={Y(y)} r={5.5} className={hits.length > 1 ? "plot-hot" : "plot-point"} />)}
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>Vertical line <span className="mono">x = {fmtNum(c)}</span></span>
          <input type="range" min={-5.5} max={5.5} step={0.25} value={c} onChange={(e) => setC(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{curve.tex}</span>. {verdict}{" "}
        {k === 1 || k === 3
          ? "Some vertical lines cross twice, so this curve is not the graph of a function of x."
          : "No vertical line crosses twice, so this curve is the graph of a function of x."}
      </figcaption>
    </figure>
  );
}
