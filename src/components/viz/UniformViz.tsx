"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

type Case = { name: string; f: (x: number) => number; a: number; b: number; v: View; dv: View; note: string };

const W = 520;
const CASES: Case[] = [
  {
    name: "2x on [0, 3]", f: (x) => 2 * x, a: 0, b: 3,
    v: { xmin: -0.3, xmax: 3.3, ymin: -0.5, ymax: 7, w: W, h: 200 }, dv: { xmin: -0.3, xmax: 3.3, ymin: 0, ymax: 1, w: W, h: 110 },
    note: "The same δ = ε/2 works at every point. The δ-curve is flat, so its lowest value is positive: uniformly continuous.",
  },
  {
    name: "x² on [0, 3]", f: (x) => x * x, a: 0, b: 3,
    v: { xmin: -0.3, xmax: 3.3, ymin: -0.5, ymax: 10, w: W, h: 200 }, dv: { xmin: -0.3, xmax: 3.3, ymin: 0, ymax: 1, w: W, h: 110 },
    note: "Where the graph is steep, a smaller δ is needed. But on [0, 3] the steepness is limited, so the δ-curve stays above a positive level: uniformly continuous.",
  },
  {
    name: "1/x on (0, 3]", f: (x) => 1 / x, a: 0, b: 3,
    v: { xmin: -0.3, xmax: 3.3, ymin: -0.5, ymax: 8, w: W, h: 200 }, dv: { xmin: -0.3, xmax: 3.3, ymin: 0, ymax: 1, w: W, h: 110 },
    note: "Continuous at every point, but as x₀ approaches 0 the graph gets ever steeper, and the δ needed shrinks towards 0. No single δ works everywhere: not uniformly continuous.",
  },
];

/** The largest δ that works at x₀ for a given ε, scanning outwards until the graph leaves the band. */
function bestDelta(C: Case, x0: number, eps: number) {
  const step = (C.b - C.a) / 6000;
  const y0 = C.f(x0);
  for (let d = step; d < C.b - C.a; d += step) {
    for (const x of [x0 - d, x0 + d]) {
      if (x <= C.a || x > C.b) continue;
      if (Math.abs(C.f(x) - y0) >= eps) return d;
    }
  }
  return C.b - C.a;
}

/** Continuity point by point versus uniform continuity: how the δ needed for a fixed ε varies with the point. */
export function UniformViz() {
  const [c, setC] = useState(2);
  const [eps, setEps] = useState(0.5);
  const [x0, setX0] = useState(1.5);
  const C = CASES[c];
  const { X, Y } = scales(C.v);
  const S = scales(C.dv);
  const d0 = bestDelta(C, x0, eps);
  const dfun = (x: number) => (x >= C.a + 0.02 && x <= C.b ? Math.min(1, bestDelta(C, x, eps)) : NaN);
  let path = "";
  for (let i = 0; i <= 150; i++) {
    const x = C.a + 0.02 + ((C.b - C.a - 0.02) * i) / 150;
    const d = dfun(x);
    path += `${i ? "L" : "M"}${S.X(x).toFixed(1)} ${S.Y(d).toFixed(1)} `;
  }
  const y0 = C.f(x0);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {CASES.map((g, i) => (
          <button key={g.name} type="button" className={i === c ? "btn btn-primary" : "btn"} aria-pressed={i === c} onClick={() => setC(i)}>{g.name}</button>
        ))}
      </div>
      <Axes v={C.v} label={`${C.name}, with the ε band and δ strip at x₀ = ${x0}`}>
        <rect x={0} y={Y(y0 + eps)} width={C.v.w} height={Y(y0 - eps) - Y(y0 + eps)} className="viz-region" style={{ strokeWidth: 0 }} />
        <rect x={X(x0 - d0)} y={0} width={X(x0 + d0) - X(x0 - d0)} height={C.v.h} style={{ fill: "var(--text-faint)", opacity: 0.18 }} />
        <path d={curvePath(C.v, (x) => (x > C.a && x <= C.b ? C.f(x) : NaN), 800)} className="plot-curve" />
        <circle cx={X(x0)} cy={Y(y0)} r={5} className="plot-hot" />
      </Axes>
      <p className="mono-meta" style={{ margin: "6px 0 0" }}>The largest δ that works at each point, for this ε</p>
      <svg viewBox={`-28 -8 ${W + 40} ${C.dv.h + 26}`} role="img" aria-label="The largest δ at each point">
        <line x1={0} x2={W} y1={S.Y(0)} y2={S.Y(0)} className="viz-axis" />
        <line x1={S.X(0)} x2={S.X(0)} y1={0} y2={C.dv.h} className="viz-axis" />
        <text x={-5} y={S.Y(1) + 4} textAnchor="end" className="plot-tick">1</text>
        {[1, 2, 3].map((t) => <text key={t} x={S.X(t)} y={C.dv.h + 14} textAnchor="middle" className="plot-tick">{t}</text>)}
        <path d={path} className="plot-curve" />
        <circle cx={S.X(x0)} cy={S.Y(Math.min(1, d0))} r={5} className="plot-hot" />
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 150 }}>
          ε = <span className="mono">{fmtNum(eps)}</span>
          <input type="range" className="viz-range" min={0.1} max={1} step={0.05} value={eps} onChange={(e) => setEps(Number(e.target.value))} />
        </label>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 150 }}>
          x₀ = <span className="mono">{fmtNum(x0)}</span>
          <input type="range" className="viz-range" min={0.1} max={3} step={0.05} value={x0} onChange={(e) => setX0(Number(e.target.value))} />
        </label>
      </div>
      <p className="viz-verdict viz-verdict-right" style={{ margin: "8px 0 0" }}>
        At x₀ = {fmtNum(x0)}, the largest δ that works is about {fmtNum(Number(d0.toPrecision(3)))}.
      </p>
      <figcaption className="viz-caption" aria-live="polite">{C.note}</figcaption>
    </figure>
  );
}
