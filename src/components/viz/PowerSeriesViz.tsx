"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; term: (n: number, x: number) => number; R: number; v: View; note: string }[] = [
  { name: "1/(1 − x) = Σ xⁿ", f: (x) => 1 / (1 - x), term: (n, x) => x ** n, R: 1, v: { xmin: -2, xmax: 2, ymin: -3, ymax: 6, w: 520, h: 260 }, note: "The radius of convergence is 1, set by the blow-up at x = 1. At x = −1 the function is fine, yet the series still fails there: a power series converges on an interval centred at its centre." },
  { name: "ln(1 + x) = Σ (−1)ⁿ⁺¹ xⁿ/n", f: (x) => Math.log(1 + x), term: (n, x) => (n === 0 ? 0 : ((-1) ** (n + 1) * x ** n) / n), R: 1, v: { xmin: -1.5, xmax: 2, ymin: -3, ymax: 2, w: 520, h: 260 }, note: "Again the radius is 1. ln(1 + x) makes sense for every x > −1, but beyond x = 1 the partial sums swing ever more wildly." },
  { name: "eˣ = Σ xⁿ/n!", f: Math.exp, term: (n, x) => { let t = 1; for (let k = 1; k <= n; k++) t *= x / k; return t; }, R: Infinity, v: { xmin: -4, xmax: 3, ymin: -2, ymax: 12, w: 520, h: 260 }, note: "The factorials win against any power of x, so this series converges for every x: its radius of convergence is infinite." },
];

/** Partial sums of three power series against the functions they represent, inside and outside the radius of convergence. */
export function PowerSeriesViz() {
  const [k, setK] = useState(0);
  const [n, setN] = useState(5);
  const F = FNS[k];
  const P = (x: number) => { let s = 0; for (let i = 0; i <= n; i++) s += F.term(i, x); return s; };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Series">
        {FNS.map((g, i) => <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">{g.name}</span></button>)}
      </div>
      <Axes v={F.v} label={`The partial sum up to degree ${n} of ${F.name}`}>
        {Number.isFinite(F.R) && <rect x={((-F.R - F.v.xmin) / (F.v.xmax - F.v.xmin)) * F.v.w} y={0} width={((2 * F.R) / (F.v.xmax - F.v.xmin)) * F.v.w} height={F.v.h} className="viz-region" style={{ strokeWidth: 0, opacity: 0.5 }} />}
        <path d={curvePath(F.v, F.f, 600)} className="plot-ghost" />
        <path d={curvePath(F.v, P, 600)} className="plot-curve" />
      </Axes>
      <div className="viz-sliders">
        <label>Highest power n = <span className="mono">{n}</span><input type="range" min={0} max={30} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curve is the function and the solid one the partial sum up to x<sup>{n}</sup>. {Number.isFinite(F.R) ? `Inside the shaded interval, of radius ${fmtNum(F.R)}, raising n pulls the partial sums onto the function; outside it, they fly apart.` : ""} {F.note}
      </figcaption>
    </figure>
  );
}
