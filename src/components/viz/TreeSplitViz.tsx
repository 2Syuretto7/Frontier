"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";

const V: View = { xmin: 0, xmax: 10, ymin: 0, ymax: 10, w: 400, h: 400 };
// Will a customer accept a loan offer? x = income score, y = existing debt score.
const D: { p: [number, number]; yes: boolean }[] = [
  { p: [1.2, 2], yes: false }, { p: [2.5, 6], yes: false }, { p: [3, 3.2], yes: false }, { p: [1.8, 8], yes: false }, { p: [3.6, 1.4], yes: true },
  { p: [5.8, 1.8], yes: true }, { p: [7, 3], yes: true }, { p: [8.5, 1.2], yes: true }, { p: [6.4, 4.2], yes: true }, { p: [9, 3.8], yes: true },
  { p: [6, 7.5], yes: false }, { p: [8, 8.6], yes: false }, { p: [7.2, 6.4], yes: false }, { p: [9.2, 7], yes: false }, { p: [5.4, 5.8], yes: false },
];

const majority = (pts: typeof D) => (pts.filter((d) => d.yes).length * 2 > pts.length);

/** A depth-two decision tree, built by hand: one question about income, then one question about debt on each side. */
export function TreeSplitViz() {
  const [a, setA] = useState(5);
  const [bL, setBL] = useState(5), [bR, setBR] = useState(5);
  const { X, Y } = scales(V);
  const leaves = [
    { name: "income < a, debt < b₁", pts: D.filter((d) => d.p[0] < a && d.p[1] < bL), box: [0, 0, a, bL] },
    { name: "income < a, debt ≥ b₁", pts: D.filter((d) => d.p[0] < a && d.p[1] >= bL), box: [0, bL, a, 10] },
    { name: "income ≥ a, debt < b₂", pts: D.filter((d) => d.p[0] >= a && d.p[1] < bR), box: [a, 0, 10, bR] },
    { name: "income ≥ a, debt ≥ b₂", pts: D.filter((d) => d.p[0] >= a && d.p[1] >= bR), box: [a, bR, 10, 10] },
  ].map((l) => ({ ...l, say: majority(l.pts) }));
  const errors = leaves.reduce((s, l) => s + l.pts.filter((d) => d.yes !== l.say).length, 0);

  return (
    <figure className="viz">
      <Axes v={V} label={`A decision tree with ${errors} mistakes`}>
        {leaves.map((l, i) => l.say && (
          <rect key={i} x={X(l.box[0])} y={Y(l.box[3])} width={X(l.box[2]) - X(l.box[0])} height={Y(l.box[1]) - Y(l.box[3])} className="viz-region" style={{ opacity: 0.35, strokeWidth: 0 }} />
        ))}
        <line x1={X(a)} y1={0} x2={X(a)} y2={V.h} className="plot-curve" />
        <line x1={0} y1={Y(bL)} x2={X(a)} y2={Y(bL)} className="plot-curve-2" />
        <line x1={X(a)} y1={Y(bR)} x2={V.w} y2={Y(bR)} className="plot-curve-2" />
        {D.map((d, i) => {
          const leaf = leaves.find((l) => l.pts.includes(d))!;
          const wrong = leaf.say !== d.yes;
          return d.yes
            ? <circle key={i} cx={X(d.p[0])} cy={Y(d.p[1])} r={6} className={wrong ? "plot-hot" : "plot-point"} />
            : <rect key={i} x={X(d.p[0]) - 5.5} y={Y(d.p[1]) - 5.5} width={11} height={11} className={wrong ? "plot-hot" : "viz-node"} style={{ strokeWidth: 2 }} />;
        })}
      </Axes>
      <div className="viz-sliders">
        <label><span>Question 1: income below <span className="mono">a = {a}</span>?</span><input type="range" min={0.5} max={9.5} step={0.25} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label><span>If yes, debt below <span className="mono">b₁ = {bL}</span>?</span><input type="range" min={0.5} max={9.5} step={0.25} value={bL} onChange={(e) => setBL(Number(e.target.value))} /></label>
        <label><span>If no, debt below <span className="mono">b₂ = {bR}</span>?</span><input type="range" min={0.5} max={9.5} step={0.25} value={bR} onChange={(e) => setBR(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Filled circles accepted the offer; hollow squares did not. Each of the four boxes predicts its majority, and the shaded boxes predict
        &ldquo;accepts&rdquo;. Mistakes turn red. This tree makes <span className="mono">{errors}</span> {errors === 1 ? "mistake" : "mistakes"} out of 15.
      </figcaption>
    </figure>
  );
}
