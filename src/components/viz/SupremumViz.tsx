"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const X0 = 40, X1 = 580, LO = -1.5, HI = 2.5;
const X = (v: number) => X0 + ((v - LO) / (HI - LO)) * (X1 - X0);

type SetDef = { name: string; points?: number[]; interval?: [number, number, boolean]; sup: number; supName: string; inSet: boolean; note: string; maxIn: (b: number) => number | null };

const SETS: SetDef[] = [
  { name: "1 − 1/n", points: Array.from({ length: 40 }, (_, i) => 1 - 1 / (i + 1)), sup: 1, supName: "1", inSet: false, note: "The terms creep up towards 1 but never reach it, so the supremum 1 is not a maximum.", maxIn: (b) => { const n = Math.floor(1 / (1 - b)) + 1; return b >= 1 ? null : 1 - 1 / n; } },
  { name: "(0, 1]", interval: [0, 1, true], sup: 1, supName: "1", inSet: true, note: "Here the supremum 1 belongs to the set: it is the maximum.", maxIn: (b) => (b >= 1 ? null : 1) },
  { name: "x² < 2", interval: [-Math.SQRT2, Math.SQRT2, false], sup: Math.SQRT2, supName: "√2", inSet: false, note: "Within the rationals this set has no least upper bound: every rational upper bound can be lowered, because √2 is irrational. In ℝ the completeness axiom supplies √2.", maxIn: (b) => (b >= Math.SQRT2 ? null : Math.min(Math.SQRT2 - 1e-6, (b + Math.SQRT2) / 2)) },
  { name: "(−1)ⁿ/n", points: Array.from({ length: 30 }, (_, i) => (-1) ** (i + 1) / (i + 1)), sup: 0.5, supName: "1/2", inSet: true, note: "The largest term is 1/2 (when n = 2), so the supremum is a maximum. Every upper bound is at least 1/2.", maxIn: (b) => (b >= 0.5 ? null : 0.5) },
];

/** Upper bounds and the least upper bound of a set of real numbers. */
export function SupremumViz() {
  const [k, setK] = useState(2);
  const [b, setB] = useState(1.6);
  const S = SETS[k];
  const w = S.maxIn(b);
  const isUB = w === null;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {SETS.map((s, i) => (
          <button key={s.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>{s.name}</button>
        ))}
      </div>
      <svg viewBox="0 0 620 120" role="img" aria-label={`The set ${S.name} and a candidate upper bound ${fmtNum(b)}`}>
        <line x1={X0} x2={X1} y1={60} y2={60} className="viz-axis" />
        {[-1, 0, 1, 2].map((t) => <text key={t} x={X(t)} y={84} textAnchor="middle" className="plot-tick">{fmtNum(t)}</text>)}
        {S.interval && (
          <>
            <line x1={X(S.interval[0])} x2={X(S.interval[1])} y1={60} y2={60} style={{ stroke: "var(--accent)", strokeWidth: 6 }} />
            <circle cx={X(S.interval[0])} cy={60} r={5} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />
            <circle cx={X(S.interval[1])} cy={60} r={5} style={{ fill: S.interval[2] ? "var(--accent)" : "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />
          </>
        )}
        {S.points?.map((p, i) => <circle key={i} cx={X(p)} cy={60} r={3.5} className="plot-point" />)}
        <line x1={X(S.sup)} x2={X(S.sup)} y1={36} y2={84} style={{ stroke: "var(--text-muted)", strokeDasharray: "3 3" }} />
        <text x={X(S.sup)} y={28} textAnchor="middle" className="plot-tick">sup = {S.supName}</text>
        <line x1={X(b)} x2={X(b)} y1={40} y2={100} style={{ stroke: isUB ? "var(--accent)" : "var(--danger)", strokeWidth: 2.5 }} />
        <text x={X(b)} y={112} textAnchor="middle" className="viz-label" style={{ fill: isUB ? "var(--accent)" : "var(--danger)" }}>b</text>
        {!isUB && w !== null && <circle cx={X(w)} cy={60} r={7} className="plot-hot" />}
      </svg>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Candidate upper bound b = <span className="mono">{fmtNum(b)}</span>
          <input type="range" className="viz-range" min={-1} max={2.4} step={0.01} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
      </div>
      <p className={isUB ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-wrong"} style={{ margin: "8px 0 0" }}>
        {isUB
          ? Math.abs(b - S.sup) < 0.006 ? `b is the least upper bound: nothing smaller is an upper bound.` : `b is an upper bound, but not the least: anything between ${S.supName} and b is a smaller one.`
          : `b is not an upper bound: the set contains ${fmtNum(Number(w!.toFixed(3)))}, which is bigger.`}
      </p>
      <figcaption className="viz-caption" aria-live="polite">{S.note}</figcaption>
    </figure>
  );
}
