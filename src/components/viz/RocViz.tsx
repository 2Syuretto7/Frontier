"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeNormal, makeRng } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 280, h: 280 };
const SEPS = [0.5, 1, 1.5, 2.5];

/** Sweep a threshold along a classifier's scores and trace its ROC curve. */
export function RocViz() {
  const [s, setS] = useState(2);
  const [t, setT] = useState(0);
  const { pos, neg } = useMemo(() => {
    const g = makeNormal(makeRng(77 + s));
    return { pos: Array.from({ length: 300 }, () => SEPS[s] / 2 + g()), neg: Array.from({ length: 1200 }, () => -SEPS[s] / 2 + g()) };
  }, [s]);
  const at = (th: number) => {
    const tp = pos.filter((v) => v >= th).length, fp = neg.filter((v) => v >= th).length;
    return { tp, fp, tpr: tp / pos.length, fpr: fp / neg.length };
  };
  const curve = useMemo(() => {
    const ths = [...pos, ...neg].sort((a, b) => b - a);
    const isPos = new Set(pos);
    const pts: [number, number][] = [[0, 0]];
    let tp = 0, fp = 0;
    for (const th of ths) { if (isPos.has(th)) tp++; else fp++; pts.push([fp / neg.length, tp / pos.length]); }
    let auc = 0;
    for (let i = 1; i < pts.length; i++) auc += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2;
    return { pts, auc };
  }, [pos, neg]);
  const { X, Y } = scales(V);
  const c = at(t);
  const prec = c.tp + c.fp > 0 ? c.tp / (c.tp + c.fp) : 1;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="How well the scores separate the classes">
        {SEPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={i === s} onClick={() => setS(i)}>{["Weak", "Fair", "Good", "Strong"][i]}</button>)}
      </div>
      <div style={{ maxWidth: 340, margin: "12px auto 0" }}>
        <Chart v={V} label="ROC curve: true positive rate against false positive rate" xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]} xlabel="false positive rate" ylabel="recall">
          <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} className="plot-mirror" />
          <path d={curve.pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(" ")} className="plot-curve" />
          <circle cx={X(c.fpr)} cy={Y(c.tpr)} r={6} className="plot-hot" />
        </Chart>
      </div>
      <div className="viz-sliders">
        <label>
          threshold on the score = {t.toFixed(1)}
          <input type="range" min={-3} max={3} step={0.1} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(prec * 100).toFixed(0)}%</b><span>precision</span></div>
        <div className="ml-stat"><b>{(c.tpr * 100).toFixed(0)}%</b><span>recall</span></div>
        <div className="ml-stat"><b>{(c.fpr * 100).toFixed(0)}%</b><span>false positive rate</span></div>
        <div className="ml-stat"><b>{curve.auc.toFixed(2)}</b><span>area under the curve</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        300 positives and 1,200 negatives. Each threshold gives one point on the curve; the curve is every threshold at once. The diagonal is guessing at random, with area 0.5, and better scores bow the curve towards the top left corner.
      </figcaption>
    </figure>
  );
}
