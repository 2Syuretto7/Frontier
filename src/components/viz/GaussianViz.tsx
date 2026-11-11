"use client";

import { useState } from "react";
import { areaPath, simpson } from "./calc";
import { fmtNum } from "./format";
import { Axes, curvePath, type View } from "./Plot";

const V: View = { xmin: -3.5, xmax: 3.5, ymin: 0, ymax: 1.2, w: 520, h: 220 };

/** The area under e^(−x²) from −R to R approaches √π, and its square matches the polar computation π(1 − e^(−R²)) closely. */
export function GaussianViz() {
  const [R, setR] = useState(1);
  const f = (x: number) => Math.exp(-x * x);
  const I = simpson(f, -R, R);
  return (
    <figure className="viz">
      <Axes v={V} label={`The area under e to the minus x squared from minus ${R} to ${R}`}>
        <path d={areaPath(V, f, -R, R)} className="viz-region" />
        <path d={curvePath(V, f, 400)} className="plot-curve" />
      </Axes>
      <div className="viz-sliders">
        <label>R = <span className="mono">{fmtNum(R)}</span><input type="range" min={0.1} max={3.5} step={0.05} value={R} onChange={(e) => setR(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>area from −R to R</td><td className="mono">{I.toFixed(6)}</td></tr>
          <tr><td>√π</td><td className="mono">{Math.sqrt(Math.PI).toFixed(6)}</td></tr>
          <tr><td>square of the area (over a square)</td><td className="mono">{(I * I).toFixed(6)}</td></tr>
          <tr><td>π(1 − e<sup>−R²</sup>) (over the disc of radius R)</td><td className="mono">{(Math.PI * (1 - Math.exp(-R * R))).toFixed(6)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The bell curve has no antiderivative built from familiar functions, yet its total area is exactly √π. The square of the
        area is an integral over a square in the plane, and the disc inside that square gives π(1 − e<sup>−R²</sup>), which polar
        coordinates compute exactly. The two rows trap each other as R grows, and both reach π.
      </figcaption>
    </figure>
  );
}
