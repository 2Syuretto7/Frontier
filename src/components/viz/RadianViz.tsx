"use client";

import { useState } from "react";

const O = { x: 230, y: 170 }, R = 120;
const at = (t: number, r = R) => ({ x: O.x + r * Math.cos(t), y: O.y - r * Math.sin(t) });

/** An angle measured by the arc it cuts off: one radian is the angle whose arc is exactly one radius long. */
export function RadianViz() {
  const [deg, setDeg] = useState(40);
  const t = (deg * Math.PI) / 180;
  const P = at(t);
  const arc = deg >= 360
    ? null
    : `M${O.x + R} ${O.y} A${R} ${R} 0 ${deg > 180 ? 1 : 0} 0 ${P.x.toFixed(2)} ${P.y.toFixed(2)}`;
  const radians = t.toFixed(2);
  const L = at(t / 2, R + 22);

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 340" role="img" aria-label={`An angle of ${deg} degrees, which is ${radians} radians`}>
        <circle cx={O.x} cy={O.y} r={R} className="plot-ghost" />
        {[1, 2, 3, 4, 5, 6].map((k) => {
          const a = at(k, R - 7), b = at(k, R + 7), l = at(k, R - 22);
          return (
            <g key={k}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="viz-axis" />
              <text x={l.x} y={l.y + 4} textAnchor="middle" className="plot-tick">{k}</text>
            </g>
          );
        })}
        {arc ? <path d={arc} className="plot-curve" style={{ strokeWidth: 4 }} /> : <circle cx={O.x} cy={O.y} r={R} className="plot-curve" style={{ strokeWidth: 4 }} />}
        <line x1={O.x} y1={O.y} x2={O.x + R} y2={O.y} className="plot-curve-2" />
        <line x1={O.x} y1={O.y} x2={P.x} y2={P.y} className="plot-curve-2" />
        <circle cx={O.x} cy={O.y} r={4} className="plot-point" />
        <circle cx={P.x} cy={P.y} r={6} className="plot-hot" />
        {deg > 12 && deg < 350 && <text x={L.x} y={L.y + 4} textAnchor="middle" className="viz-label is-on">arc</text>}
        <text x={O.x + R / 2} y={O.y + 18} textAnchor="middle" className="viz-label">r</text>
        <text x={420} y={120} className="viz-label">degrees</text>
        <text x={420} y={146} className="viz-label is-on" style={{ fontSize: 22 }}>{deg}°</text>
        <text x={420} y={196} className="viz-label">radians = arc ÷ radius</text>
        <text x={420} y={222} className="viz-label is-on" style={{ fontSize: 22 }}>{radians}</text>
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Open the angle</span>
          <input type="range" min={0} max={360} step={1} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The ticks on the circle are one radius apart, measured along the curve. The arc is{" "}
        <span className="mono">{radians}</span> radii long, so the angle is <span className="mono">{radians}</span> radians.{" "}
        {deg === 360
          ? <>A full turn is <span className="mono">2π ≈ 6.28</span> radians: a little more than six radii fit round the circle.</>
          : deg === 180
            ? <>A half turn is <span className="mono">π ≈ 3.14</span> radians.</>
            : <>One radian is about <span className="mono">57.3°</span>; try to find it.</>}
      </figcaption>
    </figure>
  );
}
