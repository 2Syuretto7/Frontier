"use client";

import { useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";

// Hours of revision and exam marks for eight students. Made up.
const DATA: [number, number][] = [[1, 48], [2, 55], [3, 53], [4, 62], [5, 66], [6, 64], [7, 74], [8, 77]];
const n = DATA.length;
const mx = DATA.reduce((s, d) => s + d[0], 0) / n, my = DATA.reduce((s, d) => s + d[1], 0) / n;
const BEST_W1 = DATA.reduce((s, d) => s + (d[0] - mx) * (d[1] - my), 0) / DATA.reduce((s, d) => s + (d[0] - mx) ** 2, 0);
const BEST_W0 = my - BEST_W1 * mx;
const sse = (w0: number, w1: number) => DATA.reduce((s, [x, y]) => s + (y - (w0 + w1 * x)) ** 2, 0);
const BEST = sse(BEST_W0, BEST_W1);
const V: View = { xmin: 0, xmax: 9, ymin: 30, ymax: 90, w: 440, h: 240 };

/** Move a line by hand and watch the sum of squared errors, then compare with the least-squares line. */
export function LeastSquaresViz() {
  const [w0, setW0] = useState(60);
  const [w1, setW1] = useState(0);
  const { X, Y } = scales(V);
  const e = sse(w0, w1);
  return (
    <figure className="viz">
      <Chart v={V} label={`The line marks = ${w0} + ${w1} times hours, with its errors`} xticks={[0, 2, 4, 6, 8]} yticks={[40, 60, 80]} xlabel="hours of revision" ylabel="marks">
        <line x1={X(0)} y1={Y(w0)} x2={X(9)} y2={Y(w0 + 9 * w1)} className="plot-curve" />
        {DATA.map(([x, y]) => <line key={x} x1={X(x)} x2={X(x)} y1={Y(y)} y2={Y(w0 + w1 * x)} className="plot-line" />)}
        {DATA.map(([x, y]) => <circle key={`p${x}`} cx={X(x)} cy={Y(y)} r={5} className="ml-train" />)}
      </Chart>
      <div className="viz-sliders">
        <label>
          intercept w₀ = {w0.toFixed(1)}
          <input type="range" min={30} max={80} step={0.5} value={w0} onChange={(ev) => setW0(Number(ev.target.value))} />
        </label>
        <label>
          slope w₁ = {w1.toFixed(2)}
          <input type="range" min={-2} max={8} step={0.05} value={w1} onChange={(ev) => setW1(Number(ev.target.value))} />
        </label>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{e.toFixed(1)}</b><span>your sum of squared errors</span></div>
        <div className="ml-stat"><b>{BEST.toFixed(1)}</b><span>smallest possible</span></div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => { setW0(Math.round(BEST_W0 * 2) / 2); setW1(Math.round(BEST_W1 * 20) / 20); }}>Show the least-squares line</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The red segments are the errors, actual mark minus predicted mark. Least squares chooses the line that makes the sum of their squares as small as possible: marks ≈ {BEST_W0.toFixed(1)} + {BEST_W1.toFixed(2)} × hours.
      </figcaption>
    </figure>
  );
}
