"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { polyFit, sineData } from "./ml";

const R = 40, N = 15, NOISE = 0.3, MAXDEG = 9;
const GRID = Array.from({ length: 49 }, (_, i) => 0.02 + (0.96 * i) / 48);
const truth = (x: number) => Math.sin(2 * Math.PI * x);
const V: View = { xmin: 0, xmax: 1, ymin: -2, ymax: 2, w: 440, h: 220 };
const E: View = { xmin: 0, xmax: MAXDEG, ymin: 0, ymax: 1.2, w: 440, h: 160 };
const clamp = (y: number) => Math.max(-3, Math.min(3, y));

/** Forty fitted polynomials, each on its own fresh dataset of 15 points, and the bias and variance they reveal. */
export function BiasVarianceViz() {
  const [deg, setDeg] = useState(3);
  const all = useMemo(() => Array.from({ length: MAXDEG + 1 }, (_, d) => {
    const fits = Array.from({ length: R }, (_, r) => {
      const { xs, ys } = sineData(500 + r, N, NOISE);
      const f = polyFit(xs, ys, d, 0, 1);
      return GRID.map((x) => clamp(f(x)));
    });
    const mean = GRID.map((_, i) => fits.reduce((s, f) => s + f[i], 0) / R);
    const bias2 = GRID.reduce((s, x, i) => s + (mean[i] - truth(x)) ** 2, 0) / GRID.length;
    const variance = GRID.reduce((s, _, i) => s + fits.reduce((t, f) => t + (f[i] - mean[i]) ** 2, 0) / R, 0) / GRID.length;
    return { fits, mean, bias2, variance };
  }), []);
  const cur = all[deg];
  const { X, Y } = scales(V);
  const e = scales(E);
  const line = (ys: number[]) => ys.map((y, i) => `${i ? "L" : "M"}${X(GRID[i]).toFixed(1)} ${Y(y).toFixed(1)}`).join(" ");
  const curve = (key: "bias2" | "variance" | "total") => all.map((c, d) => `${d ? "L" : "M"}${e.X(d).toFixed(1)} ${e.Y(Math.min(1.25, key === "total" ? c.bias2 + c.variance : c[key])).toFixed(1)}`).join(" ");
  const best = all.reduce((b, c, d) => (c.bias2 + c.variance < all[b].bias2 + all[b].variance ? d : b), 0);
  return (
    <figure className="viz">
      <Chart v={V} label={`Forty degree-${deg} fits, their average, and the true curve`} xticks={[0, 0.5, 1]} yticks={[-2, -1, 0, 1, 2]}>
        {cur.fits.map((f, i) => <path key={i} d={line(f)} className="ml-faint" />)}
        <path d={line(GRID.map(truth))} className="plot-curve-2" />
        <path d={line(cur.mean)} className="plot-curve" />
      </Chart>
      <div className="ml-legend"><span>average of 40 fits</span><span className="is-muted">true curve</span></div>
      <Chart v={E} label="Squared bias, variance and their sum against degree" xticks={[0, 3, 6, 9]} yticks={[0, 0.4, 0.8, 1.2]} xlabel="degree">
        <path d={curve("bias2")} className="plot-curve-2" />
        <path d={curve("variance")} className="ml-curve-test" />
        <path d={curve("total")} className="plot-curve" />
        <line x1={e.X(deg)} x2={e.X(deg)} y1={0} y2={E.h} className="plot-mirror" />
      </Chart>
      <div className="ml-legend"><span className="is-muted">squared bias</span><span className="is-test">variance</span><span>sum</span></div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{cur.bias2.toFixed(3)}</b><span>squared bias</span></div>
        <div className="ml-stat"><b>{cur.variance.toFixed(3)}</b><span>variance</span></div>
        <div className="ml-stat"><b>{(NOISE * NOISE).toFixed(3)}</b><span>noise, which nothing removes</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          degree = {deg}
          <input type="range" min={0} max={MAXDEG} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {deg === best
          ? `Degree ${deg} gives the smallest sum: the fits follow the curve and mostly agree, so bias and variance are both small.`
          : cur.bias2 > cur.variance
            ? "Here bias dominates: the fits agree with each other but all miss the curve in the same way."
            : "Here variance dominates: the fits are about right on average but differ wildly from one dataset to the next."}{" "}
        Expected test error is the sum of the three boxes.
      </figcaption>
    </figure>
  );
}
