"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { mse, polyFit, sineData } from "./ml";

const N = 30, MAXDEG = 10, KS = [2, 5, 10, 30];
const V: View = { xmin: 0, xmax: MAXDEG, ymin: 0, ymax: 0.6, w: 440, h: 200 };
const clamp = (y: number) => Math.max(-3, Math.min(3, y));

/** K-fold cross-validation choosing a polynomial degree, compared with the true test error. */
export function CrossValViz() {
  const [k, setK] = useState(5);
  const [deg, setDeg] = useState(3);
  const data = useMemo(() => sineData(77, N, 0.3), []);
  const test = useMemo(() => sineData(78, 2000, 0.3), []);
  const testErr = useMemo(() => Array.from({ length: MAXDEG + 1 }, (_, d) => {
    const f = polyFit(data.xs, data.ys, d, 0, 1);
    return mse((x) => clamp(f(x)), test.xs, test.ys);
  }), [data, test]);
  const cv = useMemo(() => Array.from({ length: MAXDEG + 1 }, (_, d) => {
    let s = 0;
    for (let fold = 0; fold < k; fold++) {
      const tr = [...data.xs.keys()].filter((i) => i % k !== fold);
      const va = [...data.xs.keys()].filter((i) => i % k === fold);
      const f = polyFit(tr.map((i) => data.xs[i]), tr.map((i) => data.ys[i]), d, 0, 1);
      s += va.reduce((t, i) => t + (clamp(f(data.xs[i])) - data.ys[i]) ** 2, 0);
    }
    return s / N;
  }), [data, k]);
  const { X, Y } = scales(V);
  const path = (es: number[]) => es.map((v, d) => `${d ? "L" : "M"}${X(d).toFixed(1)} ${Y(Math.min(0.65, v)).toFixed(1)}`).join(" ");
  const argmin = (es: number[]) => es.reduce((b, v, d) => (v < es[b] ? d : b), 0);
  const cvBest = argmin(cv), testBest = argmin(testErr);
  const rows = Math.min(k, 10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Number of folds">
          {KS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={k === v} onClick={() => setK(v)}>{v === N ? "Leave one out" : `${v} folds`}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${N * 14} ${rows * 14}`} role="img" aria-label={`How ${N} points are split into ${k} folds`} className="plot" style={{ marginTop: 12 }}>
        {Array.from({ length: rows }, (_, r) => Array.from({ length: N }, (_, i) => (
          <rect key={`${r}-${i}`} x={i * 14 + 1} y={r * 14 + 1} width={12} height={12} rx={2} className={i % k === r ? "ml-test" : "ml-train"} />
        )))}
      </svg>
      <div className="ml-legend"><span>training points in a round</span><span className="is-test">held-out points</span></div>
      <Chart v={V} label="Cross-validation error and true test error against degree" xticks={[0, 2, 4, 6, 8, 10]} yticks={[0, 0.2, 0.4, 0.6]} xlabel="degree" ylabel="mean squared error">
        <path d={path(testErr)} className="ml-curve-test" />
        <path d={path(cv)} className="plot-curve" />
        <line x1={X(deg)} x2={X(deg)} y1={0} y2={V.h} className="plot-mirror" />
        <circle cx={X(cvBest)} cy={Y(cv[cvBest])} r={5} className="plot-point" />
      </Chart>
      <div className="ml-legend"><span>{k === N ? "leave-one-out" : `${k}-fold`} estimate</span><span className="is-test">true error on 2,000 new points</span></div>
      <div className="viz-sliders">
        <label>
          degree = {deg}: estimate {cv[deg] > 0.6 ? "off the chart" : cv[deg].toFixed(3)}, truth {testErr[deg] > 0.6 ? "off the chart" : testErr[deg].toFixed(3)}
          <input type="range" min={0} max={MAXDEG} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {rows < k ? `The strip shows the first ${rows} of ${k} rounds. ` : ""}Each round fits on the training points and scores on the held-out ones; every point is held out exactly once.{" "}
        Cross-validation picks degree {cvBest}; the true best is degree {testBest}.{" "}
        {k === 2 ? "With two folds, each model trains on only 15 points, so the estimate is pessimistic for flexible models." : "The estimate tracks the shape of the true curve, which is all that choosing a model needs."}
      </figcaption>
    </figure>
  );
}
