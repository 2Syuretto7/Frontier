"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; d1: (x: number) => number; d2: (x: number) => number; v: View; x0: number }[] = [
  { name: "x³ − 3x", f: (x) => x ** 3 - 3 * x, d1: (x) => 3 * x * x - 3, d2: (x) => 6 * x, v: { xmin: -2.5, xmax: 2.5, ymin: -4, ymax: 4, w: 520, h: 260 }, x0: -1.5 },
  { name: "x⁴ − 2x²", f: (x) => x ** 4 - 2 * x * x, d1: (x) => 4 * x ** 3 - 4 * x, d2: (x) => 12 * x * x - 4, v: { xmin: -2, xmax: 2, ymin: -2, ymax: 3, w: 520, h: 260 }, x0: 0.3 },
  { name: "x / (1 + x²)", f: (x) => x / (1 + x * x), d1: (x) => (1 - x * x) / (1 + x * x) ** 2, d2: (x) => (2 * x * (x * x - 3)) / (1 + x * x) ** 3, v: { xmin: -5, xmax: 5, ymin: -1, ymax: 1, w: 520, h: 260 }, x0: 2 },
];

const STRIP = 22;

/** A graph with two sign strips underneath: where f′ > 0 (rising) and where f″ > 0 (bending up). */
export function CurveShapeViz() {
  const [k, setK] = useState(0);
  const F = FNS[k];
  const [x, setX] = useState(F.x0);
  const { X, Y } = scales(F.v);
  const pick = (i: number) => { setK(i); setX(FNS[i].x0); };

  const strip = (g: (t: number) => number, pos: string, neg: string, y: number) => {
    const cells: { a: number; b: number; s: boolean }[] = [];
    const n = 400;
    for (let i = 0; i < n; i++) {
      const t0 = F.v.xmin + ((F.v.xmax - F.v.xmin) * i) / n;
      const t1 = F.v.xmin + ((F.v.xmax - F.v.xmin) * (i + 1)) / n;
      const s = g((t0 + t1) / 2) > 0;
      const last = cells[cells.length - 1];
      if (last && last.s === s) last.b = t1; else cells.push({ a: t0, b: t1, s });
    }
    return cells.map((c, i) => (
      <g key={i}>
        <rect x={X(c.a)} y={y} width={X(c.b) - X(c.a)} height={STRIP} className={c.s ? "viz-region" : undefined} style={c.s ? undefined : { fill: "var(--surface)", stroke: "var(--border-strong)", strokeWidth: 1 }} />
        {X(c.b) - X(c.a) > 70 && <text x={(X(c.a) + X(c.b)) / 2} y={y + 15} textAnchor="middle" className="viz-label">{c.s ? pos : neg}</text>}
      </g>
    ));
  };

  const d1 = F.d1(x), d2 = F.d2(x);
  const tangent = (t: number) => F.f(x) + d1 * (t - x);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>
            <span className="mono">f(x) = {g.name}</span>
          </button>
        ))}
      </div>
      <Axes v={F.v} label={`The graph of ${F.name} with its tangent at x = ${fmtNum(x)}`}>
        <path d={curvePath(F.v, tangent, 2)} className="plot-ghost" />
        <path d={curvePath(F.v, F.f, 800)} className="plot-curve" />
        <circle cx={X(x)} cy={Y(F.f(x))} r={5} className="plot-hot" />
      </Axes>
      <svg viewBox={`-28 0 ${F.v.w + 40} ${2 * STRIP + 30}`} role="img" aria-label="Where f′ and f″ are positive">
        <text x={-4} y={15} textAnchor="end" className="viz-label">f′</text>
        {strip(F.d1, "rising", "falling", 0)}
        <text x={-4} y={STRIP + 23} textAnchor="end" className="viz-label">f″</text>
        {strip(F.d2, "convex", "concave", STRIP + 8)}
        <line x1={X(x)} y1={0} x2={X(x)} y2={2 * STRIP + 8} style={{ stroke: "var(--danger)", strokeWidth: 2 }} />
      </svg>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          x = <span className="mono">{fmtNum(x)}</span>
          <input type="range" className="viz-range" min={F.v.xmin} max={F.v.xmax} step={0.05} value={x} onChange={(e) => setX(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Here <span className="mono">f′(x) = {fmtNum(Number(d1.toFixed(3)))}</span> and{" "}
        <span className="mono">f″(x) = {fmtNum(Number(d2.toFixed(3)))}</span>.{" "}
        {Math.abs(d1) < 0.02 ? "The tangent is flat: a candidate for a maximum or minimum. " : d1 > 0 ? "The graph is rising. " : "The graph is falling. "}
        {Math.abs(d2) < 0.02 ? "f″ is (nearly) 0: the bending may be about to change direction." : d2 > 0 ? "It bends upwards, and the tangent (dashed) lies below the graph." : "It bends downwards, and the tangent (dashed) lies above the graph."}
      </figcaption>
    </figure>
  );
}
