"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { symEig } from "./la";
import { Axes, paramPath, scales, type View } from "./Plot";

const V: View = { xmin: -3, xmax: 3, ymin: -3, ymax: 3, w: 360, h: 360 };

/** Level sets of the quadratic form xᵀSx: ellipses when S is positive definite, hyperbolas when it is indefinite. */
export function QuadFormViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(2);
  const { values: [l1, l2], vectors } = symEig([[a, b], [b, c]]);
  const q1 = [vectors[0][0], vectors[1][0]], q2 = [vectors[0][1], vectors[1][1]];
  const at = (u: number, v: number): [number, number] => [u * q1[0] + v * q2[0], u * q1[1] + v * q2[1]];
  const paths: string[] = [];
  const eps = 1e-9;
  for (const lev of [0.5, 1, 2, 4]) {
    if (l1 > eps && l2 > eps) paths.push(paramPath(V, (t) => at(Math.sqrt(lev / l1) * Math.cos(t), Math.sqrt(lev / l2) * Math.sin(t)), 0, 2 * Math.PI, 160));
    else if (l1 > eps && l2 < -eps) {
      for (const sg of [1, -1]) paths.push(paramPath(V, (t) => at(sg * Math.sqrt(lev / l1) * Math.cosh(t), Math.sqrt(lev / -l2) * Math.sinh(t)), -3, 3, 160));
    } else if (l1 > eps) {
      for (const sg of [1, -1]) paths.push(paramPath(V, (t) => at(sg * Math.sqrt(lev / l1), t), -6, 6, 2));
    }
  }
  const { X, Y } = scales(V);
  const kind = l2 > eps ? "positive definite" : l2 > -eps && l1 > eps ? "positive semidefinite but not definite" : l1 > eps ? "indefinite" : "negative semidefinite";
  const s = (label: string, v: number, set: (x: number) => void, min: number) => (
    <label>{label} = <span className="mono">{fmtNum(v)}</span><input type="range" min={min} max={3} step={0.25} value={v} onChange={(e) => set(Number(e.target.value))} /></label>
  );
  return (
    <figure className="viz">
      <Axes v={V} label="Level curves of the quadratic form">
        {paths.map((d, i) => <path key={i} d={d} className="plot-curve" />)}
        <circle cx={X(0)} cy={Y(0)} r={3} className="plot-point" />
      </Axes>
      <div className="viz-sliders">{s("a", a, setA, 0.25)}{s("b", b, setB, -3)}{s("c", c, setC, -2)}</div>
      <figcaption className="viz-caption" aria-live="polite">
        f(x, y) = {fmtNum(a)}x² + {fmtNum(2 * b)}xy + {fmtNum(c)}y², with S = [[{fmtNum(a)}, {fmtNum(b)}], [{fmtNum(b)}, {fmtNum(c)}]].
        Eigenvalues {fmtNum(Number(l1.toFixed(3)))} and {fmtNum(Number(l2.toFixed(3)))}; pivots {fmtNum(a)} and {fmtNum(Number((c - (b * b) / a).toFixed(3)))}; ac − b² = {fmtNum(Number((a * c - b * b).toFixed(4)))}.
        S is {kind}. {kind === "positive definite" ? "Every level curve is an ellipse: the origin is the bottom of a bowl." : kind === "indefinite" ? "The level curves are hyperbolas: the origin is a saddle, up in one direction and down in another." : "The bowl has a flat direction, so the level curves are pairs of parallel lines."}
      </figcaption>
    </figure>
  );
}
