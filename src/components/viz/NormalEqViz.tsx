"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const V: View = { xmin: -0.5, xmax: 6.5, ymin: -1, ymax: 9, w: 420, h: 300 };
const XS = [0, 1, 2, 3, 4, 5, 6];
const BASE = [1, 2.2, 2.8, 4.1, 4.9, 6.2, 6.8];

/** Least squares: the best line minimises the sum of squared vertical errors, found by solving AᵀA x̂ = Aᵀb. */
export function NormalEqViz() {
  const [out, setOut] = useState(0);
  const [tryC, setTryC] = useState(1);
  const [tryD, setTryD] = useState(0.8);
  const ys = BASE.map((y, i) => (i === 6 ? y + out : y));
  const n = XS.length, sx = XS.reduce((s, x) => s + x, 0), sxx = XS.reduce((s, x) => s + x * x, 0);
  const sy = ys.reduce((s, y) => s + y, 0), sxy = XS.reduce((s, x, i) => s + x * ys[i], 0);
  const det = n * sxx - sx * sx;
  const C = (sxx * sy - sx * sxy) / det, D = (n * sxy - sx * sy) / det;
  const sse = (c: number, d: number) => XS.reduce((s, x, i) => s + (ys[i] - c - d * x) ** 2, 0);
  const { X, Y } = scales(V);
  return (
    <figure className="viz">
      <Axes v={V} label="Data points, the least-squares line and a line you choose">
        {XS.map((x, i) => <line key={i} x1={X(x)} y1={Y(ys[i])} x2={X(x)} y2={Y(C + D * x)} className="plot-line" />)}
        <path d={curvePath(V, (x) => tryC + tryD * x, 2)} className="plot-ghost" />
        <path d={curvePath(V, (x) => C + D * x, 2)} className="plot-curve" />
        {XS.map((x, i) => <circle key={i} cx={X(x)} cy={Y(ys[i])} r={4.5} className="plot-point" />)}
      </Axes>
      <div className="viz-sliders">
        <label>your intercept = <span className="mono">{fmtNum(tryC)}</span><input type="range" min={-1} max={3} step={0.1} value={tryC} onChange={(e) => setTryC(Number(e.target.value))} /></label>
        <label>your slope = <span className="mono">{fmtNum(tryD)}</span><input type="range" min={0} max={2} step={0.05} value={tryD} onChange={(e) => setTryD(Number(e.target.value))} /></label>
        <label>move the last point by <span className="mono">{fmtNum(out)}</span><input type="range" min={-6} max={2} step={0.5} value={out} onChange={(e) => setOut(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>least-squares line (solid)</td><td className="mono">y = {C.toFixed(3)} + {D.toFixed(3)}x</td></tr>
          <tr><td>its sum of squared errors</td><td className="mono">{sse(C, D).toFixed(3)}</td></tr>
          <tr><td>your line (dashed): sum of squared errors</td><td className="mono">{sse(tryC, tryD).toFixed(3)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        No line passes through all seven points, so Ax = b has no solution. The solid line solves the normal equations AᵀAx̂ = Aᵀb instead, and no choice of your sliders beats its error. Move the last point to see how strongly a single outlier pulls the line: squaring makes large errors expensive.
      </figcaption>
    </figure>
  );
}
