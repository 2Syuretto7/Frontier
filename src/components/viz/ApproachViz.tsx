"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

type Fn = {
  name: string;
  f: (x: number) => number;
  a: number;
  v: View;
  /** An open circle where the graph has a hole, and a filled point for the value at a, if there is one. */
  hole?: [number, number];
  dot?: [number, number];
  left: string;
  right: string;
  verdict: string;
  samples?: number;
};

const W = 520, H = 260;
const SETS: Record<"intuitive" | "onesided", Fn[]> = {
  intuitive: [
    {
      name: "(x² − 1)/(x − 1)", f: (x) => (x === 1 ? NaN : (x * x - 1) / (x - 1)), a: 1,
      v: { xmin: -1, xmax: 3, ymin: -1, ymax: 4, w: W, h: H }, hole: [1, 2],
      left: "2", right: "2",
      verdict: "f(1) is 0/0, which is undefined. But for x ≠ 1, f(x) = x + 1, so near 1 the values are near 2. The limit is 2, though f(1) does not exist.",
    },
    {
      name: "sin x / x", f: (x) => (x === 0 ? NaN : Math.sin(x) / x), a: 0,
      v: { xmin: -6, xmax: 6, ymin: -1, ymax: 2, w: W, h: H }, hole: [0, 1],
      left: "1", right: "1",
      verdict: "Again 0/0 at x = 0, yet the values close in on 1 from both sides. The limit is 1. (Angles here are in radians.)",
    },
    {
      name: "x / |x|", f: (x) => (x === 0 ? NaN : x / Math.abs(x)), a: 0,
      v: { xmin: -3, xmax: 3, ymin: -2, ymax: 2, w: W, h: H },
      left: "−1", right: "1",
      verdict: "From the left the values are all −1; from the right they are all 1. There is no single number they approach, so there is no limit at 0.",
    },
    {
      name: "sin(1/x)", f: (x) => (x === 0 ? NaN : Math.sin(1 / x)), a: 0, samples: 4000,
      v: { xmin: -1, xmax: 1, ymin: -1.5, ymax: 1.5, w: W, h: H },
      left: "none", right: "none",
      verdict: "As x shrinks, 1/x races off, and sin(1/x) swings between −1 and 1 ever faster. It settles on nothing, so there is no limit. Move h: the values do not settle.",
    },
  ],
  onesided: [
    {
      name: "1/x", f: (x) => (x === 0 ? NaN : 1 / x), a: 0,
      v: { xmin: -4, xmax: 4, ymin: -8, ymax: 8, w: W, h: H },
      left: "−∞", right: "+∞",
      verdict: "From the right, 1/x grows without bound; from the left, it falls without bound. The one-sided limits are +∞ and −∞, and there is no two-sided limit.",
    },
    {
      name: "1/x²", f: (x) => (x === 0 ? NaN : 1 / (x * x)), a: 0,
      v: { xmin: -4, xmax: 4, ymin: -2, ymax: 10, w: W, h: H },
      left: "+∞", right: "+∞",
      verdict: "From both sides the values grow without bound, so we write lim 1/x² = ∞. This is not a number: it is a short way of saying how the limit fails to exist.",
    },
    {
      name: "x / |x|", f: (x) => (x === 0 ? NaN : x / Math.abs(x)), a: 0,
      v: { xmin: -3, xmax: 3, ymin: -2, ymax: 2, w: W, h: H },
      left: "−1", right: "1",
      verdict: "Both one-sided limits exist, −1 and 1, but they differ, so the two-sided limit does not exist.",
    },
    {
      name: "√x", f: (x) => (x < 0 ? NaN : Math.sqrt(x)), a: 0, samples: 1000,
      v: { xmin: -2, xmax: 4, ymin: -1, ymax: 2.5, w: W, h: H }, dot: [0, 0],
      left: "undefined", right: "0",
      verdict: "√x is only defined for x ≥ 0, so only the right-hand limit makes sense. It is 0, which is also √0.",
    },
  ],
};

/** Approach a point from both sides and watch the values of the function. */
export function ApproachViz({ set = "intuitive" }: { set?: "intuitive" | "onesided" }) {
  const fns = SETS[set];
  const [k, setK] = useState(0);
  const [e, setE] = useState(0);
  const F = fns[k];
  const span = F.v.xmax - F.v.xmin;
  const h = (span / 4) * 10 ** -e;
  const { X, Y } = scales(F.v);
  const xl = F.a - h, xr = F.a + h;
  const yl = F.f(xl), yr = F.f(xr);
  const inView = (y: number) => Number.isFinite(y) && y >= F.v.ymin && y <= F.v.ymax;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {fns.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            <span className="mono">{g.name}</span>
          </button>
        ))}
      </div>
      <Axes v={F.v} label={`The graph of ${F.name} near x = ${F.a}`}>
        <line x1={X(F.a)} x2={X(F.a)} y1={0} y2={F.v.h} className="plot-mirror" />
        <path d={curvePath(F.v, F.f, F.samples ?? 600)} className="plot-curve" />
        {F.hole && <circle cx={X(F.hole[0])} cy={Y(F.hole[1])} r={5} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />}
        {F.dot && <circle cx={X(F.dot[0])} cy={Y(F.dot[1])} r={5} className="plot-point" />}
        {inView(yl) && <circle cx={X(xl)} cy={Y(yl)} r={6} className="plot-hot" />}
        {inView(yr) && <circle cx={X(xr)} cy={Y(yr)} r={6} className="plot-hot" />}
      </Axes>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 200 }}>
          Distance from a: h = <span className="mono">{fmtNum(Number(h.toPrecision(3)))}</span>
          <input type="range" className="viz-range" min={0} max={3} step={0.25} value={e} onChange={(ev) => setE(Number(ev.target.value))} aria-label="How close to a" />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <thead>
          <tr><th>x</th><th>f(x)</th><th>approaching from</th><th>one-sided limit</th></tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">{fmtNum(Number(xl.toPrecision(6)))}</td>
            <td className="mono">{Number.isFinite(yl) ? fmtNum(Number(yl.toPrecision(6))) : "undefined"}</td>
            <td>the left</td><td className="mono">{F.left}</td>
          </tr>
          <tr>
            <td className="mono">{fmtNum(Number(xr.toPrecision(6)))}</td>
            <td className="mono">{Number.isFinite(yr) ? fmtNum(Number(yr.toPrecision(6))) : "undefined"}</td>
            <td>the right</td><td className="mono">{F.right}</td>
          </tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">{F.verdict}</figcaption>
    </figure>
  );
}
