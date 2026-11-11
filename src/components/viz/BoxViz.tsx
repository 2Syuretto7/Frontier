"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

const S = 12;
const V = (x: number) => x * (S - 2 * x) ** 2;
const v: View = { xmin: 0, xmax: 6, ymin: 0, ymax: 14, w: 330, h: 240 };

/** Cutting squares from the corners of a 12 by 12 sheet and folding up an open box. */
export function BoxViz() {
  const [x, setX] = useState(1);
  const [shown, setShown] = useState(false);
  const { X, Y } = scales(v);
  const P = 200 / S; // pixels per unit on the sheet
  const cut = x * P;

  return (
    <figure className="viz">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="-10 -10 220 220" style={{ width: 220, maxWidth: "100%" }} role="img" aria-label={`A 12 by 12 sheet with ${fmtNum(x)} by ${fmtNum(x)} squares cut from the corners`}>
          <rect x={0} y={0} width={200} height={200} className="viz-region" />
          {[[0, 0], [200 - cut, 0], [0, 200 - cut], [200 - cut, 200 - cut]].map(([px, py], i) => (
            <rect key={i} x={px} y={py} width={cut} height={cut} style={{ fill: "var(--surface)", stroke: "var(--danger)", strokeWidth: 1.5, strokeDasharray: "4 3" }} />
          ))}
          {cut > 0 && <rect x={cut} y={cut} width={200 - 2 * cut} height={200 - 2 * cut} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "2 3" }} />}
          <text x={100} y={104} textAnchor="middle" className="viz-label">base {fmtNum(S - 2 * x)} by {fmtNum(S - 2 * x)}</text>
          {cut > 18 && <text x={cut / 2} y={cut / 2 + 4} textAnchor="middle" className="viz-label">x</text>}
        </svg>
        <div style={{ flex: "1 1 300px", maxWidth: 380 }}>
          <Axes v={v} label="The volume V(x) = x(12 − 2x)² against x, in tens">
            <path d={curvePath(v, (t) => V(t) / 10, 400)} className="plot-curve" />
            {shown && <line x1={X(0)} y1={Y(12.8)} x2={X(6)} y2={Y(12.8)} className="plot-ghost" />}
            <circle cx={X(x)} cy={Y(V(x) / 10)} r={5} className="plot-hot" />
          </Axes>
        </div>
      </div>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Cut x = <span className="mono">{fmtNum(x)}</span>
          <input type="range" className="viz-range" min={0} max={6} step={0.1} value={x} onChange={(e) => setX(Number(e.target.value))} />
        </label>
        <button type="button" className="btn" onClick={() => setShown(!shown)}>{shown ? "Hide the best volume" : "Show the best volume"}</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Volume <span className="mono">V = x(12 − 2x)² = {fmtNum(Number(V(x).toFixed(2)))}</span>.{" "}
        {x === 0 || x === 6
          ? "At this end there is no box at all: the volume is 0."
          : shown
            ? "The dashed line marks the largest volume, 128, reached when x = 2. The graph is flat there."
            : "The vertical scale counts tens of cubic units. Cut too little and the box is shallow; cut too much and its base shrinks. Where is the best cut?"}
      </figcaption>
    </figure>
  );
}
