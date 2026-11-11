"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";

type Ext = { value: number | null; at: number | null; text: string };
type Case = {
  name: string; f: (x: number) => number; a: number; b: number; closedA: boolean; closedB: boolean;
  v: View; extra?: [number, number]; max: Ext; min: Ext; note: string;
};

const W = 520, H = 250;
const CASES: Case[] = [
  {
    name: "x(2 − x) on [0, 2]", f: (x) => x * (2 - x), a: 0, b: 2, closedA: true, closedB: true,
    v: { xmin: -0.5, xmax: 2.5, ymin: -0.5, ymax: 1.5, w: W, h: H },
    max: { value: 1, at: 1, text: "maximum 1, attained at x = 1" }, min: { value: 0, at: 0, text: "minimum 0, attained at x = 0 and x = 2" },
    note: "Continuous on a closed, bounded interval: both extremes are attained, as the theorem promises.",
  },
  {
    name: "x on (0, 1)", f: (x) => x, a: 0, b: 1, closedA: false, closedB: false,
    v: { xmin: -0.5, xmax: 1.5, ymin: -0.5, ymax: 1.5, w: W, h: H },
    max: { value: 1, at: null, text: "supremum 1, never attained" }, min: { value: 0, at: null, text: "infimum 0, never attained" },
    note: "Continuous and bounded, but the interval is open. The values creep towards 0 and 1 without reaching them, because the endpoints are missing.",
  },
  {
    name: "1/x on (0, 1]", f: (x) => 1 / x, a: 0, b: 1, closedA: false, closedB: true,
    v: { xmin: -0.5, xmax: 1.5, ymin: -0.5, ymax: 6, w: W, h: H },
    max: { value: null, at: null, text: "no maximum: the values are unbounded" }, min: { value: 1, at: 1, text: "minimum 1, attained at x = 1" },
    note: "Continuous, but the interval is not closed: near the missing endpoint 0, the values grow without bound.",
  },
  {
    name: "A jump on [0, 2]", f: (x) => (x < 1 ? x : x === 1 ? NaN : (x - 1) / 2), a: 0, b: 2, closedA: true, closedB: true,
    v: { xmin: -0.5, xmax: 2.5, ymin: -0.5, ymax: 1.5, w: W, h: H }, extra: [1, 0],
    max: { value: 1, at: null, text: "supremum 1, never attained" }, min: { value: 0, at: 0, text: "minimum 0, attained at x = 0 and x = 1" },
    note: "A closed, bounded interval, but f(1) = 0 breaks continuity. The values approach 1 from the left of x = 1 and never reach it.",
  },
];

/** The extreme value theorem, and what goes wrong when each of its hypotheses is dropped. */
export function EVTViz() {
  const [c, setC] = useState(0);
  const C = CASES[c];
  const { X, Y } = scales(C.v);
  const end = (x: number, closed: boolean) => {
    const y = C.f(x);
    if (!Number.isFinite(y) || y > C.v.ymax) return null;
    return <circle cx={X(x)} cy={Y(y)} r={5} style={closed ? { fill: "var(--accent)" } : { fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />;
  };
  const both = C.max.at !== null && C.min.at !== null;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function and interval">
        {CASES.map((g, i) => (
          <button key={g.name} type="button" className={i === c ? "btn btn-primary" : "btn"} aria-pressed={i === c} onClick={() => setC(i)}>{g.name}</button>
        ))}
      </div>
      <Axes v={C.v} label={C.name}>
        {C.max.value !== null && <line x1={0} x2={C.v.w} y1={Y(C.max.value)} y2={Y(C.max.value)} className="plot-ghost" />}
        {C.min.value !== null && <line x1={0} x2={C.v.w} y1={Y(C.min.value)} y2={Y(C.min.value)} className="plot-ghost" />}
        <path d={curvePath(C.v, (x) => (x > C.a && x < C.b ? C.f(x) : NaN), 1200)} className="plot-curve" />
        {end(C.a, C.closedA)}
        {end(C.b, C.closedB)}
        {C.name.startsWith("A jump") && <circle cx={X(1)} cy={Y(1)} r={5} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />}
        {C.extra && <circle cx={X(C.extra[0])} cy={Y(C.extra[1])} r={5} style={{ fill: "var(--accent)" }} />}
        {C.max.at !== null && C.max.value !== null && <circle cx={X(C.max.at)} cy={Y(C.max.value)} r={7} className="plot-hot" />}
        {C.min.at !== null && C.min.value !== null && <circle cx={X(C.min.at)} cy={Y(C.min.value)} r={7} className="plot-hot" />}
      </Axes>
      <ul style={{ margin: "10px 0 0", fontSize: 14 }}>
        <li>Top: {C.max.text}.</li>
        <li>Bottom: {C.min.text}.</li>
      </ul>
      <p className={`viz-verdict ${both ? "viz-verdict-right" : "viz-verdict-wrong"}`} style={{ margin: "8px 0 0" }}>
        {both ? "Both a maximum and a minimum are attained." : "At least one extreme is not attained."}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        Filled dots belong to the graph; open circles do not. Red dots mark extremes that are attained. {C.note}
      </figcaption>
    </figure>
  );
}
