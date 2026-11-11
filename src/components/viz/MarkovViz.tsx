"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, scales, type View } from "./Plot";

const P = [[0.9, 0.2], [0.1, 0.8]];
const N = 30;
const V: View = { xmin: 0, xmax: N, ymin: 0, ymax: 1, w: 400, h: 260 };

/** Powers of a Markov matrix: every starting distribution is pulled to the steady state, at the rate of the second eigenvalue. */
export function MarkovViz() {
  const [s, setS] = useState(1);
  const [k, setK] = useState(5);
  const path: number[][] = [[s, 1 - s]];
  for (let i = 0; i < N; i++) { const [a, b] = path[i]; path.push([P[0][0] * a + P[0][1] * b, P[1][0] * a + P[1][1] * b]); }
  const { X, Y } = scales(V);
  const pts = (j: number) => path.map((p, i) => `${X(i).toFixed(1)},${Y(p[j]).toFixed(1)}`).join(" ");
  const gap = Math.abs(path[k][0] - 2 / 3);
  return (
    <figure className="viz">
      <Axes v={V} label="Probability of each state after k steps">
        <line x1={X(0)} y1={Y(2 / 3)} x2={X(N)} y2={Y(2 / 3)} className="plot-ghost" />
        <line x1={X(0)} y1={Y(1 / 3)} x2={X(N)} y2={Y(1 / 3)} className="plot-ghost" />
        <polyline points={pts(0)} className="plot-curve" />
        <polyline points={pts(1)} className="plot-curve-2" />
        <line x1={X(k)} y1={Y(0)} x2={X(k)} y2={Y(1)} className="plot-line" style={{ strokeDasharray: "3 3" }} />
        <circle cx={X(k)} cy={Y(path[k][0])} r={4} className="plot-point" />
        <circle cx={X(k)} cy={Y(path[k][1])} r={4} className="plot-hot" />
      </Axes>
      <div className="viz-sliders">
        <label>start in state 1 with probability <span className="mono">{fmtNum(s)}</span><input type="range" min={0} max={1} step={0.05} value={s} onChange={(e) => setS(Number(e.target.value))} /></label>
        <label>step k = <span className="mono">{k}</span><input type="range" min={0} max={N} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        P = [[0.9, 0.2], [0.1, 0.8]], columns summing to 1. After {k} steps the distribution is ({fmtNum(Number(path[k][0].toFixed(4)))}, {fmtNum(Number(path[k][1].toFixed(4)))}).
        The eigenvalues are 1 and 0.7, and the steady state (2/3, 1/3) is the eigenvector for 1. The distance from it is {fmtNum(Number(gap.toFixed(4)))}, which is
        0.7^{k} = {fmtNum(Number((0.7 ** k).toFixed(4)))} times the starting distance {fmtNum(Number(Math.abs(s - 2 / 3).toFixed(4)))}.
      </figcaption>
    </figure>
  );
}
