"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 400, h: 400 };
const SEP: [number, number, number][] = [[-3, 2, 1], [-2, 4, 1], [-1, 1.5, 1], [0.5, 3.5, 1], [-4, -1, 1], [2, 4, 1], [1, -2, -1], [3, -1, -1], [2, 1, -1], [4, 2, -1], [-1, -3, -1], [3.5, -3.5, -1]];
const XOR: [number, number, number][] = [[-3, 3, 1], [-2, 2, 1], [3, -3, 1], [2, -2, 1], [3, 3, -1], [2, 2, -1], [-3, -3, -1], [-2, -2, -1]];

/** Rosenblatt's perceptron learning rule: visit points in turn, and nudge the line towards each point it gets wrong. */
export function PerceptronViz() {
  const [which, setWhich] = useState<"sep" | "xor">("sep");
  const [w, setW] = useState<[number, number, number]>([1, 0, 0]); // w1, w2, bias
  const [i, setI] = useState(0);
  const [updates, setUpdates] = useState(0);
  const [cleanPass, setCleanPass] = useState(0);
  const data = which === "sep" ? SEP : XOR;
  const { X, Y } = scales(V);
  const score = (p: number[], ww = w) => ww[0] * p[0] + ww[1] * p[1] + ww[2];
  const mistakes = data.filter((p) => Math.sign(score(p)) !== p[2]).length;

  const step = (times: number) => {
    let ww = [...w] as [number, number, number], ii = i, up = updates, clean = cleanPass;
    for (let t = 0; t < times; t++) {
      const p = data[ii];
      if (Math.sign(score(p, ww)) !== p[2]) {
        ww = [ww[0] + 0.5 * p[2] * p[0], ww[1] + 0.5 * p[2] * p[1], ww[2] + 0.5 * p[2]];
        up++; clean = 0;
      } else clean++;
      ii = (ii + 1) % data.length;
    }
    setW(ww); setI(ii); setUpdates(up); setCleanPass(clean);
  };
  const reset = (k: "sep" | "xor") => { setWhich(k); setW([1, 0, 0]); setI(0); setUpdates(0); setCleanPass(0); };

  // The line w1 x + w2 y + b = 0, drawn long.
  const len = Math.hypot(w[0], w[1]) || 1;
  const px = (-w[2] * w[0]) / (len * len), py = (-w[2] * w[1]) / (len * len);
  const dx = (-w[1] / len) * 20, dy = (w[0] / len) * 20;
  const cur = data[i];

  return (
    <figure className="viz">
      <Axes v={V} label={`Perceptron after ${updates} updates, ${mistakes} mistakes`}>
        <line x1={X(px + dx)} y1={Y(py + dy)} x2={X(px - dx)} y2={Y(py - dy)} className="plot-curve" />
        {data.map((p, k) => {
          const wrong = Math.sign(score(p)) !== p[2];
          return p[2] > 0
            ? <circle key={k} cx={X(p[0])} cy={Y(p[1])} r={6} className={wrong ? "plot-hot" : "plot-point"} />
            : <rect key={k} x={X(p[0]) - 5.5} y={Y(p[1]) - 5.5} width={11} height={11} className={wrong ? "plot-hot" : "viz-node"} style={{ strokeWidth: 2 }} />;
        })}
        <circle cx={X(cur[0])} cy={Y(cur[1])} r={12} style={{ fill: "none", stroke: "var(--text)", strokeWidth: 1.5, strokeDasharray: "3 3" }} />
      </Axes>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => step(1)}>Next point</button>
        <button type="button" className="btn" onClick={() => step(data.length * 5)}>Five passes</button>
        <span className="viz-sep" />
        <button type="button" className={which === "sep" ? "btn btn-primary" : "btn"} aria-pressed={which === "sep"} onClick={() => reset("sep")}>Separable data</button>
        <button type="button" className={which === "xor" ? "btn btn-primary" : "btn"} aria-pressed={which === "xor"} onClick={() => reset("xor")}>XOR pattern</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed ring marks the next point to visit. If the line gets it wrong, the rule moves the line towards it. So far:{" "}
        <span className="mono">{updates}</span> updates, <span className="mono">{mistakes}</span> points wrong.{" "}
        {cleanPass >= data.length ? "A whole pass with no mistakes: the perceptron has converged and will never change again." : which === "xor" ? "On this pattern it will never stop: no straight line separates circles from squares, so some point is always wrong." : ""}
      </figcaption>
    </figure>
  );
}
