"use client";

import { useState } from "react";
import { Chart } from "./Chart";
import { curvePath, scales, type View } from "./Plot";
import { sigmoid } from "./ml";

// Hours of practice and whether the student passed a driving test (1) or not (0). Made up.
const DATA: [number, 0 | 1][] = [[0.5, 0], [1, 0], [1.5, 0], [1.8, 1], [2, 0], [2.5, 0], [2.8, 1], [3, 0], [3.3, 1], [3.6, 1], [4, 0], [4.2, 1], [4.6, 1], [5, 1], [5.5, 1], [6, 1]];
const V: View = { xmin: 0, xmax: 6.5, ymin: -0.08, ymax: 1.08, w: 440, h: 220 };
const logLoss = (b: number, w: number) => DATA.reduce((s, [x, y]) => { const p = Math.min(1 - 1e-12, Math.max(1e-12, sigmoid(b + w * x))); return s - (y ? Math.log(p) : Math.log(1 - p)); }, 0) / DATA.length;

function fit(): [number, number] {
  let b = 0, w = 0;
  for (let t = 0; t < 20000; t++) {
    let gb = 0, gw = 0;
    for (const [x, y] of DATA) { const e = sigmoid(b + w * x) - y; gb += e; gw += e * x; }
    b -= (0.1 * gb) / DATA.length; w -= (0.1 * gw) / DATA.length;
  }
  return [b, w];
}
const [BB, BW] = fit();

/** Fit an S-shaped curve of probability to pass-or-fail data, and watch the log loss. */
export function LogisticViz() {
  const [b, setB] = useState(-1);
  const [w, setW] = useState(0.5);
  const { X, Y } = scales(V);
  const mid = -b / w;
  return (
    <figure className="viz">
      <Chart v={V} label="Probability of passing against hours of practice" xticks={[0, 1, 2, 3, 4, 5, 6]} yticks={[0, 0.5, 1]} xlabel="hours of practice" ylabel="P(pass)">
        <path d={curvePath(V, (x) => sigmoid(b + w * x))} className="plot-curve" />
        {Number.isFinite(mid) && mid > 0 && mid < 6.5 && <line x1={X(mid)} x2={X(mid)} y1={0} y2={V.h} className="plot-mirror" />}
        {DATA.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={5} className={y ? "ml-c1" : "ml-c0"} />)}
      </Chart>
      <div className="viz-sliders">
        <label>
          intercept w₀ = {b.toFixed(1)}
          <input type="range" min={-8} max={4} step={0.1} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
        <label>
          slope w₁ = {w.toFixed(2)}
          <input type="range" min={0.05} max={4} step={0.05} value={w} onChange={(e) => setW(Number(e.target.value))} />
        </label>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{logLoss(b, w).toFixed(3)}</b><span>your average log loss</span></div>
        <div className="ml-stat"><b>{logLoss(BB, BW).toFixed(3)}</b><span>smallest possible</span></div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => { setB(Math.round(BB * 10) / 10); setW(Math.round(BW * 20) / 20); }}>Fit by gradient descent</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is σ(w₀ + w₁·hours), the predicted probability of passing. It crosses one half at {Number.isFinite(mid) ? mid.toFixed(2) : "?"} hours. Log loss punishes the model most for points it was confident about and got wrong.
      </figcaption>
    </figure>
  );
}
