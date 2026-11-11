"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeNormal, makeRng, mse, polyFit } from "./ml";

const SIZES = [8, 10, 12, 15, 20, 30, 45, 70, 100, 150, 200];
const truth = (x: number) => Math.sin(2 * Math.PI * x);
const NOISE = 0.3;
const V: View = { xmin: 0, xmax: SIZES.length - 1, ymin: 0, ymax: 0.4, w: 440, h: 220 };

/** Train and test error of a degree-5 polynomial as the training set grows, averaged over many random datasets. */
export function LearningCurveViz() {
  const [k, setK] = useState(3);
  const curves = useMemo(() => {
    const r = makeRng(42), g = makeNormal(r);
    const tx = Array.from({ length: 400 }, () => r());
    const ty = tx.map((x) => truth(x) + NOISE * g());
    return SIZES.map((n) => {
      let tr = 0, te = 0;
      const R = 40;
      for (let rep = 0; rep < R; rep++) {
        const xs = Array.from({ length: n }, () => r());
        const ys = xs.map((x) => truth(x) + NOISE * g());
        const f = polyFit(xs, ys, 5, 0, 1);
        tr += mse(f, xs, ys);
        te += Math.min(mse(f, tx, ty), 5);
      }
      return { n, train: tr / R, test: te / R };
    });
  }, []);
  const { X, Y } = scales(V);
  const path = (key: "train" | "test") => curves.map((c, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(Math.min(c[key], 0.45)).toFixed(1)}`).join(" ");
  const c = curves[k];
  const noiseFloor = NOISE * NOISE;
  return (
    <figure className="viz">
      <Chart v={V} label="Average training and test error against the number of training examples" xticks={SIZES.map((_, i) => i).filter((i) => i % 2 === 0)} xfmt={(i) => String(SIZES[i])} yticks={[0, 0.1, 0.2, 0.3, 0.4]} xlabel="training examples" ylabel="mean squared error">
        <line x1={0} x2={V.w} y1={Y(noiseFloor)} y2={Y(noiseFloor)} className="plot-mirror" />
        <path d={path("test")} className="ml-curve-test" />
        <path d={path("train")} className="plot-curve" />
        <line x1={X(k)} x2={X(k)} y1={0} y2={V.h} className="plot-mirror" />
        <circle cx={X(k)} cy={Y(Math.min(c.test, 0.45))} r={5} className="plot-hot" />
        <circle cx={X(k)} cy={Y(c.train)} r={5} className="plot-point" />
      </Chart>
      <div className="ml-legend"><span>training error</span><span className="is-test">test error</span><span className="is-muted">noise level</span></div>
      <div className="viz-sliders">
        <label>
          training examples = {c.n}
          <input type="range" min={0} max={SIZES.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        With {c.n} examples, the average training error is {c.train.toFixed(3)} and the test error is {c.test > 4.9 ? "huge" : c.test.toFixed(3)}. The dotted line is the noise in the data, {noiseFloor.toFixed(2)}: no model can do better on new data. More data pulls the two errors together, towards it.
      </figcaption>
    </figure>
  );
}
