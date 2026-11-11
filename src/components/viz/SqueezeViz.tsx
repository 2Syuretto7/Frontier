"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; lo: (x: number) => number; hi: (x: number) => number; bounds: string; squeezed: boolean }[] = [
  { name: "x sin(1/x)", f: (x) => x * Math.sin(1 / x), lo: (x) => -Math.abs(x), hi: (x) => Math.abs(x), bounds: "−|x| ≤ x sin(1/x) ≤ |x|", squeezed: true },
  { name: "x² sin(1/x)", f: (x) => x * x * Math.sin(1 / x), lo: (x) => -x * x, hi: (x) => x * x, bounds: "−x² ≤ x² sin(1/x) ≤ x²", squeezed: true },
  { name: "sin(1/x)", f: (x) => Math.sin(1 / x), lo: () => -1, hi: () => 1, bounds: "−1 ≤ sin(1/x) ≤ 1", squeezed: false },
];

/** The squeeze theorem: a wild function trapped between two tame ones that meet at 0. Zoom in to see it. */
export function SqueezeViz() {
  const [k, setK] = useState(0);
  const [z, setZ] = useState(0);
  const F = FNS[k];
  const w = 10 ** -z;
  const v: View = { xmin: -w, xmax: w, ymin: -w * 1.2, ymax: w * 1.2, w: 520, h: 300 };
  const vScaled: View = F.squeezed ? v : { ...v, ymin: -1.3, ymax: 1.3 };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            <span className="mono">{g.name}</span>
          </button>
        ))}
      </div>
      <Axes v={vScaled} label={`${F.name} between its bounds, for x between ${-w} and ${w}`}>
        <path d={curvePath(vScaled, F.hi, 200)} className="plot-curve-2" />
        <path d={curvePath(vScaled, F.lo, 200)} className="plot-curve-2" />
        <path d={curvePath(vScaled, (x) => (x === 0 ? NaN : F.f(x)), 4000)} className="plot-curve" />
      </Axes>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Zoom: the window shows x from <span className="mono">{fmtNum(-w)}</span> to <span className="mono">{fmtNum(w)}</span>
          <input type="range" className="viz-range" min={0} max={2} step={0.25} value={z} onChange={(e) => setZ(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curves are the bounds: {F.bounds}.{" "}
        {F.squeezed
          ? "Both bounds tend to 0, so the function, trapped between them, must tend to 0 too, however wildly it wiggles. Zoom in as far as you like: the function stays pinned inside the wedge, which closes on 0."
          : "These bounds do not tend to the same value, so they squeeze nothing. Zoom in: the vertical scale stays fixed, and the function keeps swinging between −1 and 1. It has no limit at 0."}
      </figcaption>
    </figure>
  );
}
