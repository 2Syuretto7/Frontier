"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -6, xmax: 6, ymin: -5, ymax: 5, w: 420, h: 350 };

/** Linear combinations a·u + b·v, built tip to tail, and the span they fill. */
export function CombViz() {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(-1);
  const [par, setPar] = useState(false);
  const u = [2, 1], v = par ? [-2, -1] : [1, 2];
  const { X, Y } = scales(V);
  const au = [a * u[0], a * u[1]], w = [au[0] + b * v[0], au[1] + b * v[1]];
  const dots: [number, number][] = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) dots.push([i * u[0] + j * v[0], i * u[1] + j * v[1]]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setPar(!par)}>{par ? "Use v = (1, 2)" : "Make v parallel to u"}</button>
      </div>
      <Axes v={V} label={`The combination ${a} u plus ${b} v`}>
        {dots.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={2} style={{ fill: "var(--text-faint)" }} />)}
        {par && <line x1={X(-12)} y1={Y(-6)} x2={X(12)} y2={Y(6)} className="plot-ghost" />}
        <Arrow x1={X(0)} y1={Y(0)} x2={X(u[0])} y2={Y(u[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(v[0])} y2={Y(v[1])} className="plot-arrow is-muted" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(au[0])} y2={Y(au[1])} />
        <Arrow x1={X(au[0])} y1={Y(au[1])} x2={X(w[0])} y2={Y(w[1])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(w[0])} y2={Y(w[1])} className="plot-arrow is-hot" />
        <text x={X(u[0]) + 6} y={Y(u[1]) + 14} className="viz-label">u</text>
        <text x={X(v[0]) + 6} y={Y(v[1]) - 4} className="viz-label">v</text>
      </Axes>
      <div className="viz-sliders">
        <label>a = <span className="mono">{fmtNum(a)}</span><input type="range" min={-2} max={2} step={0.25} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label>b = <span className="mono">{fmtNum(b)}</span><input type="range" min={-2} max={2} step={0.25} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">a·u + b·v = {fmtNum(a)}·({u.join(", ")}) + {fmtNum(b)}·({v.map(fmtNum).join(", ")}) = ({fmtNum(w[0])}, {fmtNum(w[1])})</span>.{" "}
        The grey dots are the combinations with whole-number a and b.{" "}
        {par ? "Now v is a multiple of u, so every combination lies on one line: the span has collapsed from the plane to a line." : "Because u and v point in different directions, letting a and b range over all real numbers reaches every point of the plane."}
      </figcaption>
    </figure>
  );
}
