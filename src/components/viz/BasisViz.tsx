"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 360, h: 360 };
const BASES: { name: string; b1: number[]; b2: number[] }[] = [
  { name: "standard", b1: [1, 0], b2: [0, 1] },
  { name: "b₁ = (2, 1), b₂ = (−1, 1)", b1: [2, 1], b2: [-1, 1] },
  { name: "b₁ = (1, 1), b₂ = (1, −1)", b1: [1, 1], b2: [1, -1] },
];

/** The same vector has different coordinates in different bases; the grid shows each basis. */
export function BasisViz() {
  const [k, setK] = useState(1);
  const [px, setPx] = useState(3);
  const [py, setPy] = useState(3);
  const B = BASES[k];
  const det = B.b1[0] * B.b2[1] - B.b1[1] * B.b2[0];
  const c1 = (px * B.b2[1] - py * B.b2[0]) / det, c2 = (B.b1[0] * py - B.b1[1] * px) / det;
  const { X, Y } = scales(V);
  const lines = [];
  for (let i = -8; i <= 8; i++) {
    lines.push(<line key={`a${i}`} x1={X(i * B.b1[0] - 10 * B.b2[0])} y1={Y(i * B.b1[1] - 10 * B.b2[1])} x2={X(i * B.b1[0] + 10 * B.b2[0])} y2={Y(i * B.b1[1] + 10 * B.b2[1])} className="plot-mirror" />);
    lines.push(<line key={`b${i}`} x1={X(i * B.b2[0] - 10 * B.b1[0])} y1={Y(i * B.b2[1] - 10 * B.b1[1])} x2={X(i * B.b2[0] + 10 * B.b1[0])} y2={Y(i * B.b2[1] + 10 * B.b1[1])} className="plot-mirror" />);
  }
  const mid = [c1 * B.b1[0], c1 * B.b1[1]];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Basis">
        {BASES.map((b, i) => <button key={b.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>{b.name}</button>)}
      </div>
      <Axes v={V} label="A vector and its coordinates in a chosen basis">
        {lines}
        <Arrow x1={X(0)} y1={Y(0)} x2={X(mid[0])} y2={Y(mid[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(mid[0])} y1={Y(mid[1])} x2={X(px)} y2={Y(py)} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(B.b1[0])} y2={Y(B.b1[1])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(B.b2[0])} y2={Y(B.b2[1])} />
        <circle cx={X(px)} cy={Y(py)} r={6} className="plot-hot" />
      </Axes>
      <div className="viz-sliders">
        <label>point x = <span className="mono">{px}</span><input type="range" min={-4} max={4} step={1} value={px} onChange={(e) => setPx(Number(e.target.value))} /></label>
        <label>point y = <span className="mono">{py}</span><input type="range" min={-4} max={4} step={1} value={py} onChange={(e) => setPy(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The red point ({px}, {py}) equals <span className="mono">{fmtNum(Number(c1.toFixed(3)))}·b₁ + {fmtNum(Number(c2.toFixed(3)))}·b₂</span>, so its coordinates in this basis are ({fmtNum(Number(c1.toFixed(3)))}, {fmtNum(Number(c2.toFixed(3)))}). Every basis of the plane has exactly two vectors, and each point has exactly one pair of coordinates in it.
      </figcaption>
    </figure>
  );
}
