"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";

const f = (x: number) => x ** 3 + x - 1;
const V: View = { xmin: -1, xmax: 2, ymin: -3, ymax: 5, w: 560, h: 280 };

/** Existence by a sign change, closed in on by bisection; uniqueness because the function only increases. */
export function BisectionViz() {
  const [steps, setSteps] = useState(0);
  let a = 0, b = 1;
  for (let i = 0; i < steps; i++) {
    const c = (a + b) / 2;
    if (f(c) < 0) a = c; else b = c;
  }
  const { X, Y } = scales(V);

  return (
    <figure className="viz">
      <Axes v={V} label={`The graph of x cubed plus x minus 1, with the root trapped between ${a.toFixed(4)} and ${b.toFixed(4)}`}>
        <rect x={X(a)} y={0} width={Math.max(1.5, X(b) - X(a))} height={V.h} className="viz-region" style={{ strokeWidth: 0 }} />
        <path d={curvePath(V, f)} className="plot-curve" />
        <circle cx={X(a)} cy={Y(f(a))} r={5} className="plot-hot" />
        <circle cx={X(b)} cy={Y(f(b))} r={5} className="plot-point" />
      </Axes>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setSteps(steps + 1)} disabled={steps >= 20}>Halve the interval</button>
        <button type="button" className="btn" onClick={() => setSteps(0)} disabled={steps === 0}>Start again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">f(x) = x³ + x − 1</span> is negative at a = {a.toFixed(6)} (the red point) and positive at b = {b.toFixed(6)} (the other point), so
        its graph must cross zero in between: a root <strong>exists</strong>. Each halving keeps the half where the sign
        changes; after {steps} {steps === 1 ? "halving" : "halvings"} the root is trapped in an interval of width{" "}
        {(b - a).toPrecision(3)}. And since f only ever increases, it crosses zero once: the root is <strong>unique</strong>.
      </figcaption>
    </figure>
  );
}
