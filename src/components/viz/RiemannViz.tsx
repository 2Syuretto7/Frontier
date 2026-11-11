"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; a: number; b: number; exact: number; exactLabel: string; v: View }[] = [
  { name: "x²", f: (x) => x * x, a: 0, b: 2, exact: 8 / 3, exactLabel: "8/3", v: { xmin: -0.3, xmax: 2.3, ymin: -0.5, ymax: 4.5, w: 520, h: 260 } },
  { name: "sin x", f: Math.sin, a: 0, b: Math.PI, exact: 2, exactLabel: "2", v: { xmin: -0.3, xmax: 3.5, ymin: -0.3, ymax: 1.3, w: 520, h: 260 } },
  { name: "√x", f: Math.sqrt, a: 0, b: 4, exact: 16 / 3, exactLabel: "16/3", v: { xmin: -0.3, xmax: 4.3, ymin: -0.3, ymax: 2.5, w: 520, h: 260 } },
];

type Rule = "left" | "right" | "mid";
const RULES: { k: Rule; name: string }[] = [{ k: "left", name: "Left ends" }, { k: "right", name: "Right ends" }, { k: "mid", name: "Midpoints" }];

/** Rectangles under a curve, and how their total area approaches the area under the curve. */
export function RiemannViz() {
  const [k, setK] = useState(0);
  const [n, setN] = useState(4);
  const [rule, setRule] = useState<Rule>("left");
  const F = FNS[k];
  const { X, Y } = scales(F.v);
  const dx = (F.b - F.a) / n;
  const rects = Array.from({ length: n }, (_, i) => {
    const x0 = F.a + i * dx;
    const t = rule === "left" ? x0 : rule === "right" ? x0 + dx : x0 + dx / 2;
    return { x0, h: F.f(t) };
  });
  const sum = rects.reduce((s, r) => s + r.h * dx, 0);
  const err = sum - F.exact;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            <span className="mono">f(x) = {g.name}</span>
          </button>
        ))}
      </div>
      <Axes v={F.v} label={`${n} rectangles under the graph of ${F.name}`}>
        {rects.map((r, i) => (
          <rect key={i} x={X(r.x0)} y={Math.min(Y(r.h), Y(0))} width={X(r.x0 + dx) - X(r.x0)} height={Math.abs(Y(0) - Y(r.h))} className="viz-region" style={{ strokeWidth: n > 40 ? 0.5 : 1.5 }} />
        ))}
        <path d={curvePath(F.v, (x) => (x >= F.a - 1e-9 && x <= F.b + 1e-9 ? F.f(x) : NaN), 600)} className="plot-curve" />
      </Axes>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 180 }}>
          Rectangles n = <span className="mono">{n}</span>
          <input type="range" className="viz-range" min={1} max={100} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <div role="group" aria-label="Height taken at" style={{ display: "flex", gap: 6 }}>
          {RULES.map((r) => (
            <button key={r.k} type="button" className={rule === r.k ? "btn btn-primary" : "btn"} aria-pressed={rule === r.k} onClick={() => setRule(r.k)}>{r.name}</button>
          ))}
        </div>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>total area of the rectangles</td><td className="mono">{fmtNum(Number(sum.toFixed(5)))}</td></tr>
          <tr><td>area under the curve</td><td className="mono">{Number.isInteger(F.exact) ? F.exactLabel : `${F.exactLabel} ≈ ${fmtNum(Number(F.exact.toFixed(5)))}`}</td></tr>
          <tr><td>error</td><td className="mono">{fmtNum(Number(err.toPrecision(3)))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Each rectangle has width {fmtNum(Number(dx.toFixed(4)))} and takes its height from the curve at one point of its
        base. Increase n: the error shrinks towards 0, whichever points you choose. Midpoints usually do much better than either
        end.
      </figcaption>
    </figure>
  );
}
