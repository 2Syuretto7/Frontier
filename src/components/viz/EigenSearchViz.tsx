"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -6, xmax: 6, ymin: -6, ymax: 6, w: 360, h: 360 };
const A = [[4, 1], [2, 3]];
const EIG = [{ deg: 45, l: 5 }, { deg: 180 - Math.atan(2) * 180 / Math.PI, l: 2 }];

/** Turn a unit vector x round the circle and watch Ax: only along the eigenvectors does Ax point the same way as x. */
export function EigenSearchViz() {
  const [deg, setDeg] = useState(10);
  const snap = EIG.find((e) => Math.abs(e.deg - deg) < 2.5);
  const t = ((snap ? snap.deg : deg) * Math.PI) / 180;
  const x = [Math.cos(t), Math.sin(t)];
  const Ax = [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
  const { X, Y } = scales(V);
  const cross = x[0] * Ax[1] - x[1] * Ax[0];
  return (
    <figure className="viz">
      <Axes v={V} label="A unit vector x and its image Ax">
        <circle cx={X(0)} cy={Y(0)} r={X(1) - X(0)} className="plot-ghost" style={{ fill: "none" }} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(Ax[0])} y2={Y(Ax[1])} className={"plot-arrow" + (snap ? "" : " is-hot")} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(x[0])} y2={Y(x[1])} className="plot-arrow is-muted" />
        <text x={X(Ax[0]) + 6} y={Y(Ax[1]) - 6} className="viz-label is-on">Ax</text>
      </Axes>
      <div className="viz-sliders">
        <label>direction of x = <span className="mono">{snap ? snap.deg.toFixed(1) : deg}°</span><input type="range" min={0} max={180} step={1} value={deg} onChange={(e) => setDeg(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A = [[4, 1], [2, 3]]. x = ({fmtNum(Number(x[0].toFixed(3)))}, {fmtNum(Number(x[1].toFixed(3)))}), Ax = ({fmtNum(Number(Ax[0].toFixed(3)))}, {fmtNum(Number(Ax[1].toFixed(3)))}).{" "}
        {snap ? `Ax is exactly ${snap.l} times x: x is an eigenvector with eigenvalue ${snap.l}.` : `Ax points a different way from x (the cross product x₁(Ax)₂ − x₂(Ax)₁ is ${fmtNum(Number(cross.toFixed(3)))}, not 0). Keep turning: twice in half a turn it lines up.`}
      </figcaption>
    </figure>
  );
}
