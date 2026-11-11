"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { scales, type View } from "./Plot";

const N = 400;

/** Riemann's rearrangement: reorder 1 − 1/2 + 1/3 − … to make its partial sums close in on any target. */
export function RearrangeViz() {
  const [T, setT] = useState(1.5);
  const sums: number[] = [];
  let s = 0, p = 1, q = 2;
  const terms: number[] = [];
  for (let i = 0; i < N; i++) {
    if (s <= T) { s += 1 / p; terms.push(1 / p); p += 2; } else { s -= 1 / q; terms.push(-1 / q); q += 2; }
    sums.push(s);
  }
  const V: View = { xmin: 0, xmax: N, ymin: Math.min(-0.2, T - 1), ymax: Math.max(1.6, T + 0.6), w: 520, h: 240 };
  const { X, Y } = scales(V);
  const fmtTerm = (t: number) => (t > 0 ? `+ 1/${Math.round(1 / t)}` : `− 1/${Math.round(-1 / t)}`);
  return (
    <figure className="viz">
      <svg viewBox={`-10 -8 ${V.w + 20} ${V.h + 30}`} className="plot" role="img" aria-label={`A rearrangement of the alternating harmonic series aimed at ${T}`}>
        {V.ymin < 0 && <line x1={0} x2={V.w} y1={Y(0)} y2={Y(0)} className="viz-axis" />}
        <line x1={0} x2={V.w} y1={Y(Math.LN2)} y2={Y(Math.LN2)} className="plot-mirror" />
        <line x1={0} x2={V.w} y1={Y(T)} y2={Y(T)} className="plot-ghost" />
        <path d={sums.map((v, i) => `${i ? "L" : "M"}${X(i + 1).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ")} className="plot-curve" style={{ strokeWidth: 1.5 }} />
        <text x={V.w} y={V.h + 18} textAnchor="end" className="plot-tick">first {N} terms</text>
      </svg>
      <div className="viz-sliders">
        <label>Target = <span className="mono">{fmtNum(T)}</span><input type="range" min={-1} max={3} step={0.05} value={T} onChange={(e) => setT(Number(e.target.value))} /></label>
      </div>
      <p className="mono" style={{ fontSize: 13, overflowWrap: "anywhere" }}>{terms.slice(0, 14).map(fmtTerm).join(" ").replace(/^\+ /, "")} …</p>
      <table className="table">
        <tbody><tr><td>partial sum after {N} terms</td><td className="mono">{sums[N - 1].toFixed(5)}</td></tr></tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The same terms as 1 − 1/2 + 1/3 − …, whose sum in the usual order is ln 2 (dotted). The rule: add unused positive terms
        while below the target, subtract unused negative terms while above. Every term is used exactly once, yet the sums close
        in on the dashed target instead. The positive terms alone and the negative terms alone both diverge, which is what makes
        this possible.
      </figcaption>
    </figure>
  );
}
