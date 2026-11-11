"use client";

import { useState } from "react";
import { Chart } from "./Chart";
import { curvePath, scales, type View } from "./Plot";

// Fit y = w x to four points. The loss is a parabola in w.
const XS = [0.5, 1, 1.5, 2], YS = [1.2, 1.9, 3.1, 4.0];
const loss = (w: number) => XS.reduce((s, x, i) => s + (w * x - YS[i]) ** 2, 0) / XS.length;
const grad = (w: number) => XS.reduce((s, x, i) => s + 2 * x * (w * x - YS[i]), 0) / XS.length;
const BEST = XS.reduce((s, x, i) => s + x * YS[i], 0) / XS.reduce((s, x) => s + x * x, 0);
const RATES = [0.05, 0.1, 0.2, 0.3, 0.45, 0.52, 0.56, 0.6];
const V: View = { xmin: -1, xmax: 5, ymin: 0, ymax: 12, w: 440, h: 230 };

/** Walk downhill on a loss curve with gradient descent, and see what the learning rate does. */
export function GradientDescentViz() {
  const [k, setK] = useState(2);
  const [path, setPath] = useState<number[]>([-0.5]);
  const lr = RATES[k];
  const w = path[path.length - 1];
  const { X, Y } = scales(V);
  const step = () => setPath((p) => [...p, p[p.length - 1] - lr * grad(p[p.length - 1])]);
  const diverged = !Number.isFinite(w) || Math.abs(w) > 50;
  return (
    <figure className="viz">
      <Chart v={V} label="Loss against the weight w, with gradient descent steps" xticks={[-1, 0, 1, 2, 3, 4, 5]} yticks={[0, 4, 8, 12]} xlabel="weight w" ylabel="loss">
        <path d={curvePath(V, loss)} className="plot-curve" />
        {path.slice(1).map((v, i) => Number.isFinite(v) && Math.abs(v) < 50 && <line key={i} x1={X(path[i])} y1={Y(loss(path[i]))} x2={X(v)} y2={Y(loss(v))} className="plot-line" />)}
        {path.map((v, i) => Number.isFinite(v) && Math.abs(v) < 50 && <circle key={`c${i}`} cx={X(v)} cy={Y(loss(v))} r={i === path.length - 1 ? 6 : 3.5} className={i === path.length - 1 ? "plot-hot" : "ml-c0"} />)}
      </Chart>
      <div className="viz-sliders">
        <label>
          learning rate η = {lr}
          <input type="range" min={0} max={RATES.length - 1} value={k} onChange={(e) => { setK(Number(e.target.value)); setPath([-0.5]); }} />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={step} disabled={diverged || path.length > 60}>Take a step</button>
        <button type="button" className="btn" onClick={() => setPath([-0.5])}>Start again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {diverged
          ? "The steps overshoot further each time: the learning rate is too large and the method diverges."
          : `Step ${path.length - 1}: w = ${w.toFixed(3)}, loss = ${loss(w).toFixed(3)}, slope of the loss = ${grad(w).toFixed(3)}. The best weight is ${BEST.toFixed(3)}. Each step moves w by −η times the slope.`}
      </figcaption>
    </figure>
  );
}
