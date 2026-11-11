"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";

const V: View = { xmin: 0, xmax: 10, ymin: 0, ymax: 10, w: 400, h: 400 };
const PTS: [number, number][] = [
  [1.5, 2], [2.2, 1.4], [2.8, 2.6], [1.2, 3.1], [2.4, 3.3], [3.1, 1.6],
  [7.2, 2.4], [8.1, 1.7], [8.6, 3], [7.6, 3.4], [6.9, 1.5], [8.9, 2.2],
  [4.6, 7.6], [5.4, 8.4], [4.1, 8.6], [5.9, 7.4], [5, 6.8], [3.8, 7.3],
];
const STARTS: Record<number, [number, number][]> = {
  2: [[1, 9], [2, 8]],
  3: [[1, 9], [2, 8], [3, 9]],
  4: [[1, 9], [2, 8], [3, 9], [9, 9]],
};
const SHAPES = ["plot-point", "plot-hot", "viz-node is-paired", "viz-node"];

const d2 = (a: number[], b: number[]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** k-means, one step at a time: give each point to its nearest centre, then move each centre to the middle of its points. */
export function KMeansViz() {
  const [k, setK] = useState(3);
  const [centres, setCentres] = useState<[number, number][]>(STARTS[3]);
  const [assign, setAssign] = useState<number[] | null>(null);
  const [steps, setSteps] = useState(0);
  const { X, Y } = scales(V);

  const nearest = (cs: [number, number][]) => PTS.map((p) => cs.reduce((best, c, j) => (d2(p, c) < d2(p, cs[best]) ? j : best), 0));
  const reset = (kk: number) => { setK(kk); setCentres(STARTS[kk]); setAssign(null); setSteps(0); };
  const doAssign = () => { setAssign(nearest(centres)); setSteps(steps + 1); };
  const doMove = () => {
    if (!assign) return;
    setCentres(centres.map((c, j) => {
      const mine = PTS.filter((_, i) => assign[i] === j);
      return mine.length ? [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length] : c;
    }));
    setSteps(steps + 1);
  };
  const spread = assign ? PTS.reduce((s, p, i) => s + d2(p, centres[assign[i]]), 0) : null;
  const settled = assign !== null && nearest(centres).every((a, i) => a === assign[i]);

  return (
    <figure className="viz">
      <Axes v={V} label={`k-means with ${k} centres after ${steps} steps`}>
        {assign && PTS.map((p, i) => <line key={`l${i}`} x1={X(p[0])} y1={Y(p[1])} x2={X(centres[assign[i]][0])} y2={Y(centres[assign[i]][1])} className="plot-mirror" />)}
        {PTS.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={5.5} className={assign ? SHAPES[assign[i]] : "viz-node"} style={{ strokeWidth: 2 }} />)}
        {centres.map((c, j) => (
          <g key={`c${j}`} transform={`translate(${X(c[0])} ${Y(c[1])})`}>
            <path d="M-9 -9 L9 9 M9 -9 L-9 9" style={{ stroke: "var(--text)", strokeWidth: 3.5 }} />
            <text x={11} y={-8} className="viz-label">{j + 1}</text>
          </g>
        ))}
      </Axes>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={doAssign}>1. Assign to nearest centre</button>
        <button type="button" className="btn" onClick={doMove} disabled={!assign}>2. Move centres to the middle</button>
        <span className="viz-sep" />
        {[2, 3, 4].map((kk) => (
          <button key={kk} type="button" className={k === kk ? "btn btn-primary" : "btn"} aria-pressed={k === kk} onClick={() => reset(kk)}>k = {kk}</button>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {assign === null
          ? <>The {k} crosses start in a poor place, bunched in a corner. Nobody has told the algorithm which points belong together. Press step 1.</>
          : <>After {steps} steps, the total squared distance from points to their centres is <span className="mono">{spread!.toFixed(1)}</span>.{" "}
              {settled ? "Assigning again would change nothing: the algorithm has settled." : "Keep alternating the two steps until nothing changes."}</>}
      </figcaption>
    </figure>
  );
}
