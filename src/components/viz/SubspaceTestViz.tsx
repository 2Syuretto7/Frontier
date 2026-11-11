"use client";

import { useState } from "react";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 360, h: 360 };
type Set = { name: string; has: (x: number, y: number) => boolean; draw: "line0" | "line1" | "cross" | "quadrant"; u: number[]; v: number[]; verdict: string };
const SETS: Set[] = [
  { name: "line through 0", has: (x, y) => Math.abs(y - 0.5 * x) < 1e-9, draw: "line0", u: [2, 1], v: [-3, -1.5], verdict: "Sums and multiples of points on the line stay on it, and 0 is on it: a subspace." },
  { name: "line missing 0", has: (x, y) => Math.abs(y - 0.5 * x - 1) < 1e-9, draw: "line1", u: [2, 2], v: [-2, 0], verdict: "u + v falls off the line, and so does 0·u = 0: not a subspace. Every subspace contains 0." },
  { name: "two lines", has: (x, y) => Math.abs(y) < 1e-9 || Math.abs(x) < 1e-9, draw: "cross", u: [2, 0], v: [0, 3], verdict: "Multiples stay inside, but u + v leaves: the union of two lines is not a subspace." },
  { name: "first quadrant", has: (x, y) => x >= -1e-9 && y >= -1e-9, draw: "quadrant", u: [1, 3], v: [3, 1], verdict: "Sums stay inside, but (−1)·u leaves: not closed under multiplication by negative numbers." },
];

/** Testing sets in the plane for closure under addition and scalar multiplication. */
export function SubspaceTestViz() {
  const [k, setK] = useState(0);
  const [c, setC] = useState(-1);
  const S = SETS[k];
  const { X, Y } = scales(V);
  const sum = [S.u[0] + S.v[0], S.u[1] + S.v[1]], cu = [c * S.u[0], c * S.u[1]];
  const mark = (p: number[]) => (S.has(p[0], p[1]) ? "inside" : "outside");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Set">
        {SETS.map((s, i) => <button key={s.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>{s.name}</button>)}
      </div>
      <Axes v={V} label={`The set: ${S.name}`}>
        {S.draw === "line0" && <line x1={X(-6)} y1={Y(-3)} x2={X(6)} y2={Y(3)} className="plot-curve" style={{ strokeWidth: 6, opacity: 0.35 }} />}
        {S.draw === "line1" && <line x1={X(-6)} y1={Y(-2)} x2={X(6)} y2={Y(4)} className="plot-curve" style={{ strokeWidth: 6, opacity: 0.35 }} />}
        {S.draw === "cross" && <><line x1={X(-6)} y1={Y(0)} x2={X(6)} y2={Y(0)} className="plot-curve" style={{ strokeWidth: 6, opacity: 0.35 }} /><line x1={X(0)} y1={Y(-6)} x2={X(0)} y2={Y(6)} className="plot-curve" style={{ strokeWidth: 6, opacity: 0.35 }} /></>}
        {S.draw === "quadrant" && <rect x={X(0)} y={Y(5)} width={X(5) - X(0)} height={Y(0) - Y(5)} className="viz-region" style={{ opacity: 0.6 }} />}
        <Arrow x1={X(0)} y1={Y(0)} x2={X(S.u[0])} y2={Y(S.u[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(S.v[0])} y2={Y(S.v[1])} className="plot-arrow is-muted" />
        <circle cx={X(sum[0])} cy={Y(sum[1])} r={6} className={S.has(sum[0], sum[1]) ? "plot-point" : "plot-hot"} />
        <circle cx={X(cu[0])} cy={Y(cu[1])} r={6} className={S.has(cu[0], cu[1]) ? "plot-point" : "plot-hot"} style={{ strokeDasharray: "2 2" }} />
        <text x={X(sum[0]) + 8} y={Y(sum[1]) - 6} className="viz-label">u + v</text>
        <text x={X(cu[0]) + 8} y={Y(cu[1]) + 14} className="viz-label">c·u</text>
      </Axes>
      <div className="viz-sliders">
        <label>c = <span className="mono">{c}</span><input type="range" min={-2} max={2} step={0.5} value={c} onChange={(e) => setC(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        u and v are in the set. u + v is {mark(sum)} and c·u is {mark(cu)} (red means outside). {S.verdict}
      </figcaption>
    </figure>
  );
}
