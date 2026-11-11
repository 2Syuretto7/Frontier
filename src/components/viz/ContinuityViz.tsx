"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";

type Kind = {
  name: string;
  f: (x: number) => number;
  /** Open circles (holes) and filled dots (actual values) at the point a = 1. */
  holes: [number, number][];
  dots: [number, number][];
  verdict: string;
  fix?: { label: string; dots: [number, number][]; verdict: string };
};

const V: View = { xmin: -1, xmax: 3, ymin: -1, ymax: 4, w: 520, h: 260 };
const KINDS: Kind[] = [
  {
    name: "Continuous", f: (x) => 0.5 * x * x + 0.5, holes: [], dots: [[1, 1]],
    verdict: "The limit at 1 exists, f(1) is defined, and they are equal. You can draw the graph through x = 1 without lifting your pen.",
  },
  {
    name: "Removable", f: (x) => (x === 1 ? NaN : x + 1), holes: [[1, 2]], dots: [[1, 3.2]],
    verdict: "The limit at 1 is 2, but f(1) = 3.2. The limit exists; it just disagrees with the value.",
    fix: { label: "Redefine f(1) = 2", dots: [[1, 2]], verdict: "Changing a single value repairs it: now f(1) equals the limit, and f is continuous at 1. That is why this kind is called removable." },
  },
  {
    name: "Jump", f: (x) => (x < 1 ? 1 : x > 1 ? 3 : NaN), holes: [[1, 1]], dots: [[1, 3]],
    verdict: "The one-sided limits are 1 and 3. They differ, so there is no limit at 1, and no choice of f(1) can make f continuous there.",
  },
  {
    name: "Infinite", f: (x) => (x === 1 ? NaN : 1 / Math.abs(x - 1) - 0.5), holes: [], dots: [[1, 0]],
    verdict: "The values blow up near 1: the limit is ∞. Whatever f(1) is, f is not continuous there.",
  },
  {
    name: "Oscillating", f: (x) => (x === 1 ? NaN : 1.5 + Math.sin(1 / (x - 1))), holes: [], dots: [[1, 1.5]],
    verdict: "The values swing between 0.5 and 2.5 ever faster near 1, approaching nothing. No limit, so no continuity.",
  },
];

/** Kinds of discontinuity at a point, and the one kind that can be repaired. */
export function ContinuityViz() {
  const [k, setK] = useState(0);
  const [fixed, setFixed] = useState(false);
  const K = KINDS[k];
  const { X, Y } = scales(V);
  const dots = fixed && K.fix ? K.fix.dots : K.dots;
  const holes = fixed && K.fix ? [] : K.holes;
  const pick = (i: number) => { setK(i); setFixed(false); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Kind of behaviour at x = 1">
        {KINDS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>{g.name}</button>
        ))}
      </div>
      <Axes v={V} label={`${K.name} behaviour at x = 1`}>
        <line x1={X(1)} x2={X(1)} y1={0} y2={V.h} className="plot-mirror" />
        <path d={curvePath(V, K.f, K.name === "Oscillating" ? 6000 : 800)} className="plot-curve" />
        {holes.map(([x, y]) => <circle key={`h${x}${y}`} cx={X(x)} cy={Y(y)} r={5} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />)}
        {dots.map(([x, y]) => <circle key={`d${x}${y}`} cx={X(x)} cy={Y(y)} r={5} className="plot-hot" />)}
      </Axes>
      {K.fix && (
        <div className="viz-controls">
          <button type="button" className={fixed ? "btn btn-primary" : "btn"} aria-pressed={fixed} onClick={() => setFixed(!fixed)}>{K.fix.label}</button>
        </div>
      )}
      <p className={`viz-verdict ${k === 0 || fixed ? "viz-verdict-right" : "viz-verdict-wrong"}`} style={{ margin: "8px 0 0" }}>
        {k === 0 || fixed ? "Continuous at 1." : "Not continuous at 1."}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        The red dot is the value f(1); an open circle is a point missing from the graph. {fixed && K.fix ? K.fix.verdict : K.verdict}
      </figcaption>
    </figure>
  );
}
