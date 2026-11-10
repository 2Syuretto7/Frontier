"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: 0, xmax: 10, ymin: 0, ymax: 10, w: 400, h: 400 };
// Hours of revision (x) and test score out of 10 (y) for eight students.
const D: [number, number][] = [[1, 2.5], [2, 2.8], [3, 4.6], [4, 4.1], [5, 6], [6, 5.6], [7, 7.6], [8, 7.4]];
const n = D.length;
const mx = D.reduce((s, d) => s + d[0], 0) / n, my = D.reduce((s, d) => s + d[1], 0) / n;
const BEST_M = D.reduce((s, d) => s + (d[0] - mx) * (d[1] - my), 0) / D.reduce((s, d) => s + (d[0] - mx) ** 2, 0);
const BEST_C = my - BEST_M * mx;
const sse = (m: number, c: number) => D.reduce((s, [x, y]) => s + (y - (m * x + c)) ** 2, 0);

/** Fit a line by eye, then see the squares of the errors that least squares adds up. */
export function LineByEyeViz() {
  const [m, setM] = useState(0.3), [c, setC] = useState(4);
  const [showBest, setShowBest] = useState(false);
  const { X, Y } = scales(V);
  const unit = X(1) - X(0);
  const mine = sse(m, c), best = sse(BEST_M, BEST_C);

  return (
    <figure className="viz">
      <Axes v={V} label={`Your line with total squared error ${mine.toFixed(2)}`}>
        {D.map(([x, y], i) => {
          const r = y - (m * x + c);
          const side = Math.abs(r) * unit;
          return <rect key={`s${i}`} x={X(x)} y={r > 0 ? Y(y) : Y(m * x + c)} width={side} height={side} className="viz-region" style={{ opacity: 0.4 }} />;
        })}
        {showBest && <line x1={X(0)} y1={Y(BEST_C)} x2={X(10)} y2={Y(10 * BEST_M + BEST_C)} className="plot-curve-2" />}
        <line x1={X(0)} y1={Y(c)} x2={X(10)} y2={Y(10 * m + c)} className="plot-curve" />
        {D.map(([x, y], i) => <line key={`r${i}`} x1={X(x)} y1={Y(y)} x2={X(x)} y2={Y(m * x + c)} className="plot-line" />)}
        {D.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={5} className="plot-point" />)}
      </Axes>
      <div className="viz-sliders">
        <label><span>Slope <span className="mono">{fmtNum(m)}</span></span><input type="range" min={-0.5} max={1.5} step={0.05} value={m} onChange={(e) => setM(Number(e.target.value))} /></label>
        <label><span>Intercept <span className="mono">{fmtNum(c)}</span></span><input type="range" min={-2} max={7} step={0.1} value={c} onChange={(e) => setC(Number(e.target.value))} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className={showBest ? "btn btn-primary" : "btn"} aria-pressed={showBest} onClick={() => setShowBest(!showBest)}>Show the least-squares line</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Hours of revision against test score. The shaded squares have the errors as their sides, so their total area is the total
        squared error: <span className="mono">{mine.toFixed(2)}</span> for your line.{" "}
        {showBest
          ? <>The dashed least-squares line, <span className="mono">y = {BEST_M.toFixed(2)}x + {BEST_C.toFixed(2)}</span>, has the smallest possible total, <span className="mono">{best.toFixed(2)}</span>.</>
          : <>Make the squares as small as you can, then compare with the best line.</>}
      </figcaption>
    </figure>
  );
}
