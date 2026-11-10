"use client";

import { useState } from "react";

const O = { x: 140, y: 170 }, R = 110;
const G = { x0: 300, x1: 600, y: 170 }; // the graph: x from 0 to 2π across [x0, x1]
const gx = (t: number) => G.x0 + (t / (2 * Math.PI)) * (G.x1 - G.x0);
const gy = (s: number) => G.y - s * R;
const r3 = (n: number) => (Math.abs(n) < 5e-4 ? "0" : n.toFixed(3)).replace(/^-/, "−");

function sinePath(t1: number) {
  let d = "";
  const n = Math.max(2, Math.round((t1 / (2 * Math.PI)) * 240));
  for (let i = 0; i <= n; i++) {
    const t = (t1 * i) / n;
    d += `${i ? "L" : "M"}${gx(t).toFixed(1)} ${gy(Math.sin(t)).toFixed(1)} `;
  }
  return d;
}

/** Sine and cosine as the coordinates of a point going round the unit circle, with sine traced out as a wave. */
export function UnitCircleViz() {
  const [deg, setDeg] = useState(40);
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  const P = { x: O.x + R * c, y: O.y - R * s };
  const ticks = [
    { t: Math.PI / 2, l: "π/2" }, { t: Math.PI, l: "π" }, { t: (3 * Math.PI) / 2, l: "3π/2" }, { t: 2 * Math.PI, l: "2π" },
  ];

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 340" role="img" aria-label={`At angle ${deg} degrees, cosine is ${r3(c)} and sine is ${r3(s)}`}>
        <line x1={O.x - R - 14} y1={O.y} x2={O.x + R + 14} y2={O.y} className="viz-axis" />
        <line x1={O.x} y1={O.y - R - 14} x2={O.x} y2={O.y + R + 14} className="viz-axis" />
        <circle cx={O.x} cy={O.y} r={R} className="plot-ghost" />
        <line x1={G.x0} y1={G.y} x2={G.x1 + 8} y2={G.y} className="viz-axis" />
        <line x1={G.x0} y1={G.y - R - 14} x2={G.x0} y2={G.y + R + 14} className="viz-axis" />
        {ticks.map((k) => (
          <g key={k.l}>
            <line x1={gx(k.t)} y1={G.y - 4} x2={gx(k.t)} y2={G.y + 4} className="viz-axis" />
            <text x={gx(k.t)} y={G.y + 18} textAnchor="middle" className="plot-tick">{k.l}</text>
          </g>
        ))}
        <text x={G.x0 - 6} y={gy(1) + 4} textAnchor="end" className="plot-tick">1</text>
        <text x={G.x0 - 6} y={gy(-1) + 4} textAnchor="end" className="plot-tick">−1</text>
        <path d={sinePath(2 * Math.PI)} className="plot-ghost" />
        {deg > 0 && <path d={sinePath(t)} className="plot-curve" />}
        <line x1={P.x} y1={P.y} x2={gx(t)} y2={gy(s)} className="plot-mirror" />
        <line x1={O.x} y1={O.y} x2={P.x} y2={P.y} className="plot-curve-2" />
        <line x1={O.x} y1={O.y} x2={P.x} y2={O.y} className="plot-curve" style={{ strokeWidth: 4 }} />
        <line x1={P.x} y1={O.y} x2={P.x} y2={P.y} className="plot-line" style={{ strokeWidth: 4 }} />
        <circle cx={P.x} cy={P.y} r={6} className="plot-hot" />
        <circle cx={gx(t)} cy={gy(s)} r={5} className="plot-hot" />
        <text x={O.x + (R * c) / 2} y={O.y + (s >= 0 ? 18 : -8)} textAnchor="middle" className="viz-label is-on">cos</text>
        <text x={P.x + (c >= 0 ? -8 : 8)} y={O.y - (R * s) / 2 + 4} textAnchor={c >= 0 ? "end" : "start"} className="viz-label">sin</text>
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Angle <span className="mono">{deg}°</span></span>
          <input type="range" min={0} max={360} step={1} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The point is <span className="mono">(cos {deg}°, sin {deg}°) = ({r3(c)}, {r3(s)})</span>. Its height, carried across,
        traces the sine wave. {deg > 180 && deg < 270
          ? <>Left of the vertical axis and below the horizontal one, both are negative.</>
          : deg > 90 && deg < 270
          ? <>Left of the vertical axis, the cosine is negative.</>
          : deg > 180 && deg < 360
            ? <>Below the horizontal axis, the sine is negative.</>
            : <>Check that <span className="mono">cos² + sin² = {(c * c + s * s).toFixed(3)}</span>, always 1.</>}
      </figcaption>
    </figure>
  );
}
