"use client";

import { useState } from "react";
import { pow10 } from "./format";
import { scales, type View } from "./Plot";

const V: View = { xmin: -16, xmax: 0, ymin: -16, ymax: 1, w: 520, h: 280 };

/** Errors of forward and central differences for the derivative of sin at 1, against the step h, on log scales. */
export function DiffErrorViz() {
  const [show, setShow] = useState<"both" | "forward" | "central">("both");
  const { X, Y } = scales(V);
  const exact = Math.cos(1);
  const pts = (kind: "forward" | "central") => {
    const out: [number, number][] = [];
    for (let e = -16; e <= -0.01; e += 0.25) {
      const h = 10 ** e;
      const d = kind === "forward" ? (Math.sin(1 + h) - Math.sin(1)) / h : (Math.sin(1 + h) - Math.sin(1 - h)) / (2 * h);
      const err = Math.abs(d - exact);
      out.push([e, err > 0 ? Math.log10(err) : -16]);
    }
    return out;
  };
  const path = (p: [number, number][]) => p.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(Math.max(V.ymin, y)).toFixed(1)}`).join(" ");
  const ticks = [-16, -12, -8, -4, 0];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Formula">
        {(["both", "forward", "central"] as const).map((s) => <button key={s} type="button" className={s === show ? "btn btn-primary" : "btn"} aria-pressed={s === show} onClick={() => setShow(s)}>{s}</button>)}
      </div>
      <svg viewBox={`-40 -8 ${V.w + 50} ${V.h + 40}`} className="plot" role="img" aria-label="Error of finite differences against step size on log scales">
        {ticks.map((t) => <g key={`x${t}`}><line x1={X(t)} x2={X(t)} y1={0} y2={V.h} className="plot-grid" /><text x={X(t)} y={V.h + 14} textAnchor="middle" className="plot-tick">{pow10(t)}</text></g>)}
        {ticks.map((t) => <g key={`y${t}`}><line x1={0} x2={V.w} y1={Y(t)} y2={Y(t)} className="plot-grid" /><text x={-4} y={Y(t) + 4} textAnchor="end" className="plot-tick">{pow10(t)}</text></g>)}
        {show !== "central" && <path d={path(pts("forward"))} className="plot-curve" />}
        {show !== "forward" && <path d={path(pts("central"))} className="plot-curve-2" />}
        <text x={V.w / 2} y={V.h + 30} textAnchor="middle" className="plot-tick">step h</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Error in estimating the derivative of sin at 1, on log scales. Reading from the right, the forward difference (solid)
        falls with slope 1, an error proportional to h, and the central difference (dashed) with slope 2, proportional to h², as
        Taylor&rsquo;s theorem predicts. Then rounding error takes over: computers store about 16 significant digits, and
        dividing a tiny difference by a tiny h magnifies the rounding. The best h is near 10⁻⁸ for the forward difference and
        10⁻⁵ for the central one.
      </figcaption>
    </figure>
  );
}
