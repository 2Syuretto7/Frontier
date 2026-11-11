"use client";

import { useState } from "react";
import { areaPath, simpson } from "./calc";
import { fmtNum } from "./format";
import { Axes, curvePath, type View } from "./Plot";

const VX: View = { xmin: 0, xmax: 2.2, ymin: -3.5, ymax: 3.5, w: 300, h: 220 };
const VU: View = { xmin: 0, xmax: 4.4, ymin: -1.5, ymax: 1.5, w: 300, h: 220 };

/** Substitution u = x²: the area under 2x cos(x²) from 0 to b equals the area under cos u from 0 to b². */
export function SubstitutionViz() {
  const [b, setB] = useState(1.2);
  const f = (x: number) => 2 * x * Math.cos(x * x);
  const ax = simpson(f, 0, b), au = simpson(Math.cos, 0, b * b);
  return (
    <figure className="viz">
      <div className="viz-pair" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <div>
          <p className="viz-caption" style={{ marginTop: 0 }}>In x: 2x cos(x²), from 0 to {fmtNum(b)}</p>
          <Axes v={VX} label="The area under 2x cos of x squared">
            <path d={areaPath(VX, f, 0, b)} className="viz-region" />
            <path d={curvePath(VX, f, 400)} className="plot-curve" />
          </Axes>
        </div>
        <div>
          <p className="viz-caption" style={{ marginTop: 0 }}>In u = x²: cos u, from 0 to {fmtNum(Number((b * b).toFixed(3)))}</p>
          <Axes v={VU} label="The area under cos u">
            <path d={areaPath(VU, Math.cos, 0, b * b)} className="viz-region" />
            <path d={curvePath(VU, Math.cos, 400)} className="plot-curve" />
          </Axes>
        </div>
      </div>
      <div className="viz-sliders">
        <label>Upper limit b = <span className="mono">{fmtNum(b)}</span><input type="range" min={0.1} max={2.1} step={0.01} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>signed area on the left</td><td className="mono">{ax.toFixed(5)}</td></tr>
          <tr><td>signed area on the right</td><td className="mono">{au.toFixed(5)}</td></tr>
          <tr><td>sin(b²)</td><td className="mono">{Math.sin(b * b).toFixed(5)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The two regions have different shapes but always the same signed area. The factor 2x on the left is du/dx: it records
        how much the substitution stretches the axis, so a thin strip of width dx on the left matches a strip of width du = 2x dx
        on the right.
      </figcaption>
    </figure>
  );
}
