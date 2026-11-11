"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const FNS: { name: string; f: (x: number) => number; d: (k: number, a: number) => number; v: View }[] = [
  { name: "sin x", f: Math.sin, d: (k, a) => [Math.sin, Math.cos, (x: number) => -Math.sin(x), (x: number) => -Math.cos(x)][k % 4](a), v: { xmin: -7, xmax: 7, ymin: -3, ymax: 3, w: 520, h: 260 } },
  { name: "eˣ", f: Math.exp, d: (_k, a) => Math.exp(a), v: { xmin: -4, xmax: 3, ymin: -2, ymax: 12, w: 520, h: 260 } },
  { name: "√(1 + x)", f: (x) => Math.sqrt(1 + x), d: (k, a) => { let c = 1; for (let j = 0; j < k; j++) c *= 0.5 - j; return c * (1 + a) ** (0.5 - k); }, v: { xmin: -1, xmax: 4, ymin: -1, ymax: 3, w: 520, h: 260 } },
];

/** Taylor polynomials of growing degree about a chosen centre, and the size of the error at a test point. */
export function TaylorViz() {
  const [k, setK] = useState(0);
  const [n, setN] = useState(3);
  const [a, setA] = useState(0);
  const F = FNS[k];
  const { X, Y } = scales(F.v);
  const fact = (m: number) => { let r = 1; for (let j = 2; j <= m; j++) r *= j; return r; };
  const T = (x: number) => { let s = 0; for (let j = 0; j <= n; j++) s += (F.d(j, a) / fact(j)) * (x - a) ** j; return s; };
  const xt = a + 1;
  const err = Math.abs(F.f(xt) - T(xt));
  const pick = (i: number) => { setK(i); setA(0); };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {FNS.map((g, i) => <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}><span className="mono">f(x) = {g.name}</span></button>)}
      </div>
      <Axes v={F.v} label={`The degree ${n} Taylor polynomial of ${F.name} about ${a}`}>
        <path d={curvePath(F.v, F.f, 600)} className="plot-ghost" />
        <path d={curvePath(F.v, T, 600)} className="plot-curve" />
        <circle cx={X(a)} cy={Y(F.f(a))} r={5} className="plot-hot" />
      </Axes>
      <div className="viz-sliders">
        <label>Degree n = <span className="mono">{n}</span><input type="range" min={0} max={15} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
        <label>Centre a = <span className="mono">{fmtNum(a)}</span><input type="range" min={k === 2 ? -0.5 : -2} max={2} step={0.5} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody><tr><td>error |f(a + 1) − Tₙ(a + 1)|</td><td className="mono">{err.toExponential(3)}</td></tr></tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The polynomial (solid) matches the value and the first {n} derivatives of {F.name} at the red point, so it hugs the
        curve nearby and peels away further out. Raising the degree widens the region of agreement.{k === 2 ? " For √(1 + x) the region never extends past x = −1, where the function stops being smooth, however high the degree." : ""}
      </figcaption>
    </figure>
  );
}
