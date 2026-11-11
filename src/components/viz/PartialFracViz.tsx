"use client";

import { useState } from "react";
import { Axes, curvePath, type View } from "./Plot";

const V: View = { xmin: -4, xmax: 4, ymin: -4, ymax: 4, w: 520, h: 300 };

/** 3/((x − 1)(x + 2)) is the sum of two simple fractions, 1/(x − 1) and −1/(x + 2), each blowing up at one root. */
export function PartialFracViz() {
  const [show, setShow] = useState(true);
  const f = (x: number) => 3 / ((x - 1) * (x + 2));
  const p = (x: number) => 1 / (x - 1), q = (x: number) => -1 / (x + 2);
  const cut = (g: (x: number) => number, poles: number[]) => (x: number) => (poles.some((r) => Math.abs(x - r) < 0.02) ? NaN : g(x));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"} the two pieces</button>
      </div>
      <Axes v={V} label="The graph of 3 over (x minus 1)(x plus 2), and its two partial fractions">
        {show && <path d={curvePath(V, cut(p, [1]), 800)} className="plot-ghost" />}
        {show && <path d={curvePath(V, cut(q, [-2]), 800)} className="plot-curve-2" />}
        <path d={curvePath(V, cut(f, [1, -2]), 1200)} className="plot-curve" />
      </Axes>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is 3 / ((x − 1)(x + 2)). {show ? "The dotted curve is 1/(x − 1) and the dashed one is −1/(x + 2). Near x = 1 the solid curve follows the dotted one, near x = −2 the dashed one, and at every x it is exactly their sum. Each piece integrates to a logarithm." : "It blows up at x = 1 and x = −2, the roots of the denominator. Show the pieces to see where each blow-up comes from."}
      </figcaption>
    </figure>
  );
}
