"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const DATA = [22, 25, 27, 30, 31, 34, 45];
const LO = 15, HI = 50;
const W = 480, L = 40, R = 14;
const X = (v: number) => L + ((v - LO) / (HI - LO)) * (W - L - R);

const mse = (c: number) => DATA.reduce((s, y) => s + (y - c) ** 2, 0) / DATA.length;
const mae = (c: number) => DATA.reduce((s, y) => s + Math.abs(y - c), 0) / DATA.length;

/** A model that predicts one number for every delivery. Each choice of that number has a loss; learning is finding the bottom of the loss curve. */
export function LossCurveViz() {
  const [c, setC] = useState(40);
  const [kind, setKind] = useState<"sq" | "abs">("sq");
  const loss = kind === "sq" ? mse : mae;
  const samples = Array.from({ length: 141 }, (_, i) => LO + (i * (HI - LO)) / 140);
  const top = Math.max(...samples.map(loss));
  const H2 = 170, T2 = 120;
  const Y = (v: number) => T2 + H2 - 12 - (v / top) * (H2 - 24);
  const d = samples.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(loss(x)).toFixed(1)}`).join(" ");
  const best = kind === "sq" ? DATA.reduce((s, y) => s + y, 0) / DATA.length : 30;

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${T2 + H2 + 18}`} role="img" aria-label={`Prediction ${c} minutes with loss ${loss(c).toFixed(1)}`}>
        <text x={L} y={14} className="viz-label">Delivery times (minutes) and the prediction</text>
        <line x1={L} y1={70} x2={W - R} y2={70} className="viz-axis" />
        {[15, 20, 25, 30, 35, 40, 45, 50].map((t) => <text key={t} x={X(t)} y={88} textAnchor="middle" className="plot-tick">{t}</text>)}
        {DATA.map((y, i) => {
          const yy = 56 - (i % 2) * 16;
          return (
            <g key={i}>
              <line x1={X(y)} y1={yy} x2={X(c)} y2={yy} className="plot-line" />
              <circle cx={X(y)} cy={yy} r={5} className="plot-point" />
            </g>
          );
        })}
        <line x1={X(c)} y1={28} x2={X(c)} y2={74} className="plot-curve" />
        <text x={L} y={T2 - 4} className="viz-label">{kind === "sq" ? "Mean squared error" : "Mean absolute error"} for every prediction</text>
        <line x1={L} y1={T2 + H2 - 12} x2={W - R} y2={T2 + H2 - 12} className="viz-axis" />
        <path d={d} className="plot-curve" />
        <line x1={X(best)} y1={T2} x2={X(best)} y2={T2 + H2 - 12} className="plot-mirror" />
        <circle cx={X(c)} cy={Y(loss(c))} r={6} className="plot-hot" />
        {[20, 30, 40].map((t) => <text key={t} x={X(t)} y={T2 + H2 + 4} textAnchor="middle" className="plot-tick">{t}</text>)}
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Prediction <span className="mono">{fmtNum(c)} min</span></span>
          <input type="range" min={LO} max={HI} step={0.5} value={c} onChange={(e) => setC(Number(e.target.value))} />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className={kind === "sq" ? "btn btn-primary" : "btn"} aria-pressed={kind === "sq"} onClick={() => setKind("sq")}>Squared error</button>
        <button type="button" className={kind === "abs" ? "btn btn-primary" : "btn"} aria-pressed={kind === "abs"} onClick={() => setKind("abs")}>Absolute error</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Predicting <span className="mono">{fmtNum(c)}</span> minutes for every delivery gives a {kind === "sq" ? "mean squared" : "mean absolute"} error of{" "}
        <span className="mono">{loss(c).toFixed(1)}</span>. The red lines are the errors. The dotted line marks the best prediction,{" "}
        <span className="mono">{best.toFixed(2)}</span>: the {kind === "sq" ? "mean" : "median"} of the data.
      </figcaption>
    </figure>
  );
}
