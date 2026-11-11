"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const PREV = [0.5, 0.1, 0.01];
const N = 2000;

/** Count the four outcomes of a classifier at a threshold, and compare accuracy with a do-nothing baseline. */
export function ConfusionViz() {
  const [pi, setPi] = useState(1);
  const [t, setT] = useState(0.5);
  const items = useMemo(() => {
    const r = makeRng(31 + pi), g = makeNormal(r);
    const nPos = Math.round(N * PREV[pi]);
    return Array.from({ length: N }, (_, i) => {
      const pos = i < nPos;
      const z = (pos ? 1.0 : -1.0) + g();
      return { pos, score: 1 / (1 + Math.exp(-1.6 * z)) };
    });
  }, [pi]);
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const it of items) {
    const yes = it.score >= t;
    if (it.pos && yes) tp++; else if (!it.pos && yes) fp++; else if (it.pos) fn++; else tn++;
  }
  const acc = (tp + tn) / N;
  const base = Math.max(tp + fn, fp + tn) / N;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Fraction of positives">
        {PREV.map((p, i) => <button key={p} type="button" className="seg" aria-pressed={i === pi} onClick={() => setPi(i)}>{`${p * 100}% positive`}</button>)}
      </div>
      <table className="table" style={{ marginTop: 12, marginBottom: 0 }}>
        <thead><tr><th></th><th>predicted positive</th><th>predicted negative</th></tr></thead>
        <tbody>
          <tr><th>actually positive</th><td className="mono">TP {tp}</td><td className="mono">FN {fn}</td></tr>
          <tr><th>actually negative</th><td className="mono">FP {fp}</td><td className="mono">TN {tn}</td></tr>
        </tbody>
      </table>
      <div className="viz-sliders">
        <label>
          threshold = {t.toFixed(2)}
          <input type="range" min={0.02} max={0.98} step={0.02} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(acc * 100).toFixed(1)}%</b><span>model accuracy</span></div>
        <div className="ml-stat"><b>{(base * 100).toFixed(1)}%</b><span>accuracy of always guessing the commoner class</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {N.toLocaleString("en-IN")} cases, {Math.round(N * PREV[pi])} of them positive. The model misses {fn} positive cases and raises {fp} false alarms.{" "}
        {base >= acc ? "Its accuracy is no better than the do-nothing baseline: accuracy alone hides how it treats the rare class." : "Raising the threshold trades false alarms for missed cases; lowering it does the opposite."}
      </figcaption>
    </figure>
  );
}
