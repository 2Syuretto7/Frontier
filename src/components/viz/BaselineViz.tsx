"use client";

import { useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";

const TPR = 0.8, TNR = 0.9;
const V: View = { xmin: 0, xmax: 0.5, ymin: 0.5, ymax: 1, w: 440, h: 220 };
const PS = [0.5, 0.4, 0.3, 0.2, 0.15, 0.111, 0.08, 0.05, 0.02, 0.01];

/** A model with fixed recall and specificity against the majority-class baseline, as the positive class gets rarer. */
export function BaselineViz() {
  const [i, setI] = useState(5);
  const p = PS[i];
  const { X, Y } = scales(V);
  const model = (q: number) => TPR * q + TNR * (1 - q);
  const base = (q: number) => 1 - q;
  const line = (f: (q: number) => number) => Array.from({ length: 51 }, (_, k) => `${k ? "L" : "M"}${X(k / 100).toFixed(1)} ${Y(f(k / 100)).toFixed(1)}`).join(" ");
  const m = model(p), b = base(p);
  return (
    <figure className="viz">
      <Chart v={V} label="Accuracy of a model and of the majority-class baseline against the share of positives" xticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} xfmt={(x) => `${Math.round(x * 100)}%`} yticks={[0.5, 0.75, 1]} yfmt={(y) => `${Math.round(y * 100)}%`} xlabel="share of positive cases" ylabel="accuracy">
        <path d={line(base)} className="plot-curve-2" />
        <path d={line(model)} className="plot-curve" />
        <line x1={X(p)} x2={X(p)} y1={0} y2={V.h} className="plot-mirror" />
        <circle cx={X(p)} cy={Y(m)} r={5} className="plot-point" />
        <circle cx={X(p)} cy={Y(b)} r={5} className="plot-hot" />
      </Chart>
      <div className="ml-legend"><span>model: catches 80% of positives, clears 90% of negatives</span><span className="is-muted">always predict “negative”</span></div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(m * 100).toFixed(1)}%</b><span>model accuracy</span></div>
        <div className="ml-stat"><b>{(b * 100).toFixed(1)}%</b><span>baseline accuracy</span></div>
        <div className="ml-stat"><b>85% vs 50%</b><span>balanced accuracy, model vs baseline</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          positives = {(p * 100).toFixed(p < 0.12 && p > 0.1 ? 1 : 0)}%
          <input type="range" min={0} max={PS.length - 1} value={i} onChange={(e) => setI(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {Math.abs(m - b) < 0.002
          ? "At one positive in nine, the model and the do-nothing baseline have the same accuracy."
          : m > b
            ? "Here the model beats the baseline on accuracy."
            : "Here a rule that never predicts a positive has higher accuracy than the model, even though it is useless."}{" "}
        Balanced accuracy, the average of the rate on each class, does not move with prevalence and always shows the baseline as worthless.
      </figcaption>
    </figure>
  );
}
