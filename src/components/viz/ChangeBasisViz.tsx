"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -4, xmax: 4, ymin: -4, ymax: 4, w: 360, h: 360 };
const b1 = [2, 1], b2 = [-1, 1];

/** One point, two coordinate systems: standard coordinates x and coordinates c in the basis b₁, b₂, related by x = Bc. */
export function ChangeBasisViz() {
  const [c1, setC1] = useState(1);
  const [c2, setC2] = useState(1);
  const x = [c1 * b1[0] + c2 * b2[0], c1 * b1[1] + c2 * b2[1]];
  const { X, Y } = scales(V);
  const lines = [];
  for (let i = -4; i <= 4; i++) {
    lines.push(<line key={"a" + i} x1={X(i * b1[0] - 6 * b2[0])} y1={Y(i * b1[1] - 6 * b2[1])} x2={X(i * b1[0] + 6 * b2[0])} y2={Y(i * b1[1] + 6 * b2[1])} className="plot-ghost" />);
    lines.push(<line key={"b" + i} x1={X(i * b2[0] - 6 * b1[0])} y1={Y(i * b2[1] - 6 * b1[1])} x2={X(i * b2[0] + 6 * b1[0])} y2={Y(i * b2[1] + 6 * b1[1])} className="plot-ghost" />);
  }
  return (
    <figure className="viz">
      <Axes v={V} label="A point described in a new basis">
        {lines}
        <Arrow x1={X(0)} y1={Y(0)} x2={X(c1 * b1[0])} y2={Y(c1 * b1[1])} />
        <Arrow x1={X(c1 * b1[0])} y1={Y(c1 * b1[1])} x2={X(x[0])} y2={Y(x[1])} className="plot-arrow is-hot" />
        <circle cx={X(x[0])} cy={Y(x[1])} r={5} className="plot-point" />
      </Axes>
      <div className="viz-sliders">
        <label>c₁ = <span className="mono">{fmtNum(c1)}</span><input type="range" min={-2} max={2} step={0.5} value={c1} onChange={(e) => setC1(Number(e.target.value))} /></label>
        <label>c₂ = <span className="mono">{fmtNum(c2)}</span><input type="range" min={-2} max={2} step={0.5} value={c2} onChange={(e) => setC2(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The slanted grid is built from b₁ = (2, 1) and b₂ = (−1, 1). The point has new coordinates c = ({fmtNum(c1)}, {fmtNum(c2)}): go {fmtNum(c1)} steps along b₁ (blue), then {fmtNum(c2)} along b₂ (red).
        In standard coordinates it is x = Bc = ({fmtNum(x[0])}, {fmtNum(x[1])}), where B has columns b₁ and b₂. Going the other way needs c = B⁻¹x.
      </figcaption>
    </figure>
  );
}
