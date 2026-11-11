"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; df: (x: number) => number; v: View; a: number; b: number }[] = [
  { name: "x³ − 3x", f: (x) => x ** 3 - 3 * x, df: (x) => 3 * x * x - 3, v: { xmin: -2.5, xmax: 2.5, ymin: -4, ymax: 4, w: 520, h: 280 }, a: -2, b: 1.5 },
  { name: "sin x", f: Math.sin, df: Math.cos, v: { xmin: -0.5, xmax: 7, ymin: -2, ymax: 2, w: 520, h: 280 }, a: 0.5, b: 4 },
  { name: "|x|", f: Math.abs, df: (x) => Math.sign(x), v: { xmin: -3, xmax: 3, ymin: -1, ymax: 3, w: 520, h: 280 }, a: -1, b: 2 },
];

const N = 2000;

/** Points c where the tangent is parallel to the chord from a to b. */
export function MVTViz() {
  const [k, setK] = useState(0);
  const F = FNS[k];
  const [a, setA] = useState(F.a);
  const [b, setB] = useState(F.b);
  const { X, Y } = scales(F.v);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const m = hi > lo ? (F.f(hi) - F.f(lo)) / (hi - lo) : 0;
  const cs: number[] = [];
  if (hi - lo > 1e-6) {
    let prev = F.df(lo) - m;
    for (let i = 1; i < N; i++) {
      const x = lo + ((hi - lo) * i) / N;
      const g = F.df(x) - m;
      // A smooth zero is a sign change; the step of |x| never meets the chord slope unless it equals ±1.
      if (Math.abs(g) < 1e-9 || (prev !== 0 && Math.sign(g) !== Math.sign(prev) && Math.abs(g - prev) < 0.5)) {
        if (!cs.length || x - cs[cs.length - 1] > (hi - lo) / 50) cs.push(x);
      }
      prev = g;
    }
  }
  const tangent = (c: number) => (x: number) => F.f(c) + m * (x - c);
  const pick = (i: number) => { setK(i); setA(FNS[i].a); setB(FNS[i].b); };
  const flatAbs = k === 2 && Math.abs(Math.abs(m) - 1) < 1e-9;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>
            <span className="mono">f(x) = {g.name}</span>
          </button>
        ))}
      </div>
      <Axes v={F.v} label={`The chord of ${F.name} from ${fmtNum(lo)} to ${fmtNum(hi)} and the parallel tangents`}>
        <path d={curvePath(F.v, F.f, 800)} className="plot-curve" />
        <line x1={X(lo)} y1={Y(F.f(lo))} x2={X(hi)} y2={Y(F.f(hi))} style={{ stroke: "var(--danger)", strokeWidth: 2 }} />
        {!flatAbs && cs.map((c) => (
          <g key={c}>
            <path d={curvePath(F.v, tangent(c), 2)} className="plot-ghost" />
            <circle cx={X(c)} cy={Y(F.f(c))} r={5} className="plot-point" />
          </g>
        ))}
        <circle cx={X(lo)} cy={Y(F.f(lo))} r={5} className="plot-hot" />
        <circle cx={X(hi)} cy={Y(F.f(hi))} r={5} className="plot-hot" />
      </Axes>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 160 }}>
          a = <span className="mono">{fmtNum(a)}</span>
          <input type="range" className="viz-range" min={F.v.xmin + 0.25} max={F.v.xmax - 0.25} step={0.05} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 160 }}>
          b = <span className="mono">{fmtNum(b)}</span>
          <input type="range" className="viz-range" min={F.v.xmin + 0.25} max={F.v.xmax - 0.25} step={0.05} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {hi - lo < 1e-6
          ? "Move a and b apart to draw a chord."
          : flatAbs
            ? <>The chord lies along the graph, so every point between a and b has a tangent parallel to it.</>
            : cs.length
              ? <>The chord (red) has slope <span className="mono">{fmtNum(Number(m.toFixed(3)))}</span>. At{" "}
                  {cs.map((c, i) => <span key={c}>{i ? ", " : ""}<span className="mono">c = {fmtNum(Number(c.toFixed(3)))}</span></span>)}{" "}
                  the tangent (dashed) is parallel to it: <span className="mono">f′(c)</span> equals the average rate of change.</>
              : <>The chord has slope <span className="mono">{fmtNum(Number(m.toFixed(3)))}</span>, but no tangent between a and b
                  is parallel to it. The graph of |x| has a corner at 0, where it is not differentiable, so the theorem does not apply.</>}
      </figcaption>
    </figure>
  );
}
