"use client";

import { useState } from "react";
import { scales, type View } from "./Plot";

/** Locality-sensitive hashing with b bands of r rows: the chance two documents become candidates is an S-shaped function of their similarity. */
export function LshCurveViz() {
  const [b, setB] = useState(20);
  const [r, setR] = useState(5);
  const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 480, h: 240 };
  const { X, Y } = scales(V);
  const P = (j: number) => 1 - (1 - j ** r) ** b;
  let d = "";
  for (let i = 0; i <= 200; i++) { const j = i / 200; d += `${i ? "L" : "M"}${X(j).toFixed(1)} ${Y(P(j)).toFixed(1)} `; }
  const t = (1 / b) ** (1 / r);
  return (
    <figure className="viz">
      <svg viewBox={`-36 -8 ${V.w + 50} ${V.h + 40}`} className="plot" role="img" aria-label={`Probability of becoming a candidate pair against Jaccard similarity, for ${b} bands of ${r} rows`}>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={0} x2={V.w} y1={Y(v)} y2={Y(v)} className="plot-grid" />
            <text x={-6} y={Y(v) + 4} textAnchor="end" className="plot-tick">{v}</text>
            <text x={X(v)} y={V.h + 16} textAnchor="middle" className="plot-tick">{v}</text>
          </g>
        ))}
        <line x1={X(t)} x2={X(t)} y1={0} y2={V.h} className="plot-line" />
        <path d={d} className="plot-curve" />
        <text x={V.w} y={V.h + 32} textAnchor="end" className="plot-tick">Jaccard similarity J</text>
      </svg>
      <div className="viz-sliders">
        <label><span>Bands <span className="mono">b = {b}</span></span><input type="range" min={1} max={50} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
        <label><span>Rows per band <span className="mono">r = {r}</span></span><input type="range" min={1} max={12} value={r} onChange={(e) => setR(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A signature of <span className="mono">{b * r}</span> MinHashes is cut into {b} bands of {r}. Two documents become a candidate pair if any band matches
        exactly, with probability 1 − (1 − J<sup>{r}</sup>)<sup>{b}</sup>. The curve rises steeply near J ≈ (1/b)<sup>1/r</sup> ={" "}
        <span className="mono">{t.toFixed(2)}</span> (the vertical line): pairs at J = 0.3 are caught with probability{" "}
        <span className="mono">{P(0.3).toFixed(3)}</span>, and pairs at J = 0.9 with probability <span className="mono">{P(0.9).toFixed(3)}</span>. More rows
        sharpen and shift the step right; more bands shift it left.
      </figcaption>
    </figure>
  );
}
