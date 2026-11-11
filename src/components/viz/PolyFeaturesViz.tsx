"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { curvePath, scales, type View } from "./Plot";
import { leastSquares } from "./ml";

// Speed (km/h) and fuel use (litres per 100 km) for one car. Made up but realistic in shape.
const DATA: [number, number][] = [[20, 9.1], [30, 7.4], [40, 6.4], [50, 5.8], [60, 5.5], [70, 5.6], [80, 6.0], [90, 6.6], [100, 7.4], [110, 8.5], [120, 9.7]];
const V: View = { xmin: 10, xmax: 130, ymin: 4, ymax: 11, w: 440, h: 230 };

/** Add powers of x as extra features, and fit a straight line in the new features. */
export function PolyFeaturesViz() {
  const [deg, setDeg] = useState(1);
  const t = (s: number) => s / 100;
  const fits = useMemo(() => [1, 2, 3, 4].map((d) => leastSquares(DATA.map(([s]) => Array.from({ length: d + 1 }, (_, k) => t(s) ** k)), DATA.map((p) => p[1]))), []);
  const w = fits[deg - 1];
  const f = (s: number) => w.reduce((acc, c, k) => acc + c * t(s) ** k, 0);
  const { X, Y } = scales(V);
  const sse = DATA.reduce((acc, [s, y]) => acc + (y - f(s)) ** 2, 0);
  const names = ["1", "x", "x²", "x³", "x⁴"];
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Degree">
        {[1, 2, 3, 4].map((d) => <button key={d} type="button" className="seg" aria-pressed={deg === d} onClick={() => setDeg(d)}>{`Degree ${d}`}</button>)}
      </div>
      <Chart v={V} label={`Fuel use against speed with a degree ${deg} fit`} xticks={[20, 60, 100]} yticks={[5, 7, 9]} xlabel="speed (km/h)" ylabel="litres per 100 km">
        <path d={curvePath(V, f)} className="plot-curve" />
        {DATA.map(([s, y]) => <circle key={s} cx={X(s)} cy={Y(y)} r={4.5} className="ml-train" />)}
      </Chart>
      <p className="trace-out" style={{ marginTop: 8 }}>
        {`features of one car at x = 0.6 (60 km/h): [${names.slice(0, deg + 1).map((_, k) => (0.6 ** k).toFixed(3).replace(/\.?0+$/, "")).join(", ")}]`}
      </p>
      <p className="trace-out">{`ŷ = ${w.map((c, k) => `${c.toFixed(2)}${k ? "·" + names[k] : ""}`).join(" + ").replace(/\+ -/g, "− ")}`}</p>
      <figcaption className="viz-caption" aria-live="polite">
        Speed is scaled as x = km/h ÷ 100. Sum of squared errors: {sse.toFixed(2)}. The model is still a weighted sum of its features, so least squares fits it exactly as before; only the features have changed.
        {deg === 1 ? " A straight line cannot follow the U shape." : deg === 2 ? " Adding x² lets the fit bend once, and the error falls from about 20 to 0.3." : deg === 3 ? " x³ lets the U lean to one side, and the error falls again, to 0.02." : " x⁴ improves the fit only a little more. Every extra power makes the curve freer to swing outside the range of the data."}
      </figcaption>
    </figure>
  );
}
