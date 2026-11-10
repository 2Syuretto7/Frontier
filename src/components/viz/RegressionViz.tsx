"use client";

import { useState } from "react";
import { scales, type View } from "./Plot";
import { fmtNum } from "./format";

// Flat sizes (square metres) and prices (₹ lakh) in one neighbourhood. Made up, but realistic in shape.
const DATA: [number, number][] = [[45, 38], [52, 47], [60, 49], [64, 58], [70, 60], [75, 71], [82, 70], [88, 82], [95, 84], [103, 96], [110, 98], [120, 112]];
const V: View = { xmin: 30, xmax: 140, ymin: 20, ymax: 130, w: 440, h: 300 };

const n = DATA.length;
const mx = DATA.reduce((s, d) => s + d[0], 0) / n, my = DATA.reduce((s, d) => s + d[1], 0) / n;
const slope = DATA.reduce((s, d) => s + (d[0] - mx) * (d[1] - my), 0) / DATA.reduce((s, d) => s + (d[0] - mx) ** 2, 0);
const icpt = my - slope * mx;
const rmse = Math.sqrt(DATA.reduce((s, d) => s + (d[1] - (icpt + slope * d[0])) ** 2, 0) / n);

/** Regression predicts a number. Pick a flat size and read off the predicted price, with its typical error. */
export function RegressionViz() {
  const [area, setArea] = useState(85);
  const pred = icpt + slope * area;
  const { X, Y } = scales(V);
  const xs = [40, 60, 80, 100, 120], ys = [40, 60, 80, 100, 120];
  const outside = area < DATA[0][0] || area > DATA[n - 1][0];

  return (
    <figure className="viz">
      <svg viewBox={`-34 -8 ${V.w + 46} ${V.h + 34}`} role="img" aria-label={`Predicted price ${pred.toFixed(0)} lakh for ${area} square metres`}>
        {xs.map((x) => <line key={`gx${x}`} x1={X(x)} y1={0} x2={X(x)} y2={V.h} className="plot-grid" />)}
        {ys.map((y) => <line key={`gy${y}`} x1={0} y1={Y(y)} x2={V.w} y2={Y(y)} className="plot-grid" />)}
        {xs.map((x) => <text key={`tx${x}`} x={X(x)} y={V.h + 14} textAnchor="middle" className="plot-tick">{x} m²</text>)}
        {ys.map((y) => <text key={`ty${y}`} x={-5} y={Y(y) + 4} textAnchor="end" className="plot-tick">₹{y}L</text>)}
        <polygon className="viz-region" style={{ opacity: 0.3, strokeWidth: 0 }}
          points={[[V.xmin, icpt + slope * V.xmin + rmse], [V.xmax, icpt + slope * V.xmax + rmse], [V.xmax, icpt + slope * V.xmax - rmse], [V.xmin, icpt + slope * V.xmin - rmse]].map(([a, b]) => `${X(a)},${Y(b)}`).join(" ")} />
        <line x1={X(V.xmin)} y1={Y(icpt + slope * V.xmin)} x2={X(V.xmax)} y2={Y(icpt + slope * V.xmax)} className="plot-curve" />
        {DATA.map(([a, p]) => <circle key={a} cx={X(a)} cy={Y(p)} r={5} className="plot-point" />)}
        <line x1={X(area)} y1={V.h} x2={X(area)} y2={Y(pred)} className="plot-mirror" />
        <line x1={0} y1={Y(pred)} x2={X(area)} y2={Y(pred)} className="plot-mirror" />
        <circle cx={X(area)} cy={Y(pred)} r={6.5} className="plot-hot" />
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Size of a new flat <span className="mono">{area} m²</span></span>
          <input type="range" min={30} max={140} step={1} value={area} onChange={(e) => setArea(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The fitted line says a flat of {area} m² should cost about <span className="mono">₹{fmtNum(Math.round(pred))} lakh</span>, give or
        take about <span className="mono">₹{fmtNum(Math.round(rmse))} lakh</span> (the shaded band). Each extra square metre adds about{" "}
        <span className="mono">₹{fmtNum(Math.round(slope * 100) / 100)} lakh</span>.{" "}
        {outside ? "Careful: this size is outside the range of the data, so the line is guessing beyond anything it has seen." : ""}
      </figcaption>
    </figure>
  );
}
