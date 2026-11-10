"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 6, ymin: -6, ymax: 6, w: 420, h: 420 };

function Slider({ name, value, min, max, step, set }: { name: string; value: number; min: number; max: number; step: number; set: (n: number) => void }) {
  return (
    <label>
      <span className="mono">{name} = {fmtNum(value)}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
}

const signed = (n: number) => (n < 0 ? `− ${fmtNum(-n)}` : `+ ${fmtNum(n)}`);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Two lines y = m₁x + c₁ and y = m₂x + c₂. Where they cross is the solution of the system; parallel lines give none or infinitely many. */
export function TwoLinesViz() {
  const [m1, setM1] = useState(1), [c1, setC1] = useState(1);
  const [m2, setM2] = useState(-0.5), [c2, setC2] = useState(4);
  const { X, Y } = scales(V);
  const parallel = m1 === m2;
  const x = parallel ? NaN : (c2 - c1) / (m1 - m2);
  const y = m1 * x + c1;
  const inView = !parallel && x >= V.xmin && x <= V.xmax && y >= V.ymin && y <= V.ymax;

  return (
    <figure className="viz">
      <Axes v={V} label="Two lines and their crossing point">
        <path d={curvePath(V, (t) => m1 * t + c1, 2)} className="plot-curve" />
        <path d={curvePath(V, (t) => m2 * t + c2, 2)} className="plot-curve-2" />
        {inView && <circle cx={X(x)} cy={Y(y)} r={6} className="plot-hot" />}
      </Axes>
      <div className="viz-sliders">
        <Slider name="m₁" value={m1} min={-3} max={3} step={0.5} set={setM1} />
        <Slider name="c₁" value={c1} min={-5} max={5} step={1} set={setC1} />
        <Slider name="m₂" value={m2} min={-3} max={3} step={0.5} set={setM2} />
        <Slider name="c₂" value={c2} min={-5} max={5} step={1} set={setC2} />
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Solid: <span className="mono">y = {fmtNum(m1)}x {signed(c1)}</span>. Dashed: <span className="mono">y = {fmtNum(m2)}x {signed(c2)}</span>.{" "}
        {parallel
          ? c1 === c2
            ? <>Same slope and same intercept: the lines coincide, and every point on them solves both equations. Infinitely many solutions.</>
            : <>Same slope, different intercepts: the lines are parallel and never meet. No solution.</>
          : <>Different slopes, so the lines cross exactly once, at <span className="mono">({fmtNum(r2(x))}, {fmtNum(r2(y))})</span>{inView ? "" : ", outside this window"}. One solution.</>}
      </figcaption>
    </figure>
  );
}
