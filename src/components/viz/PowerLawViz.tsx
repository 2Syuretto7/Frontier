"use client";

import { useState } from "react";

// Illustrative numbers in the shape reported by scaling-law studies: loss falls as a power of compute.
const A = 10, ALPHA = 0.07, FLOOR = 1.7;
const loss = (c: number) => FLOOR + A * Math.pow(c, -ALPHA);
const CS = [1e18, 1e19, 1e20, 1e21, 1e22, 1e23, 1e24, 1e25];

const W = 480, H = 260, L = 44, R = 14, T = 14, B = 34;

/** Loss against training compute. On ordinary axes it looks like diminishing returns; on log axes it is a straight, predictable line. */
export function PowerLawViz() {
  const [logScale, setLogScale] = useState(false);
  const [floor, setFloor] = useState(false);
  const f = (c: number) => (floor ? loss(c) - FLOOR : loss(c));
  const ys = CS.map(f);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const lx = (c: number) => (logScale ? Math.log10(c) : c);
  const ly = (v: number) => (logScale ? Math.log10(v) : v);
  const x0 = lx(CS[0]), x1 = lx(CS[CS.length - 1]);
  const y0 = logScale ? ly(yMin) - 0.02 : 0, y1 = ly(yMax) + (logScale ? 0.02 : 0.3);
  const X = (c: number) => L + ((lx(c) - x0) / (x1 - x0)) * (W - L - R);
  const Y = (v: number) => T + (1 - (ly(v) - y0) / (y1 - y0)) * (H - T - B);
  const samples = Array.from({ length: 200 }, (_, i) => (logScale ? 10 ** (18 + (7 * i) / 199) : CS[0] + ((CS[CS.length - 1] - CS[0]) * i) / 199));
  const d = samples.map((c, i) => `${i ? "L" : "M"}${X(c).toFixed(1)} ${Y(f(c)).toFixed(1)}`).join(" ");

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={logScale ? "Loss against compute on log axes" : "Loss against compute on ordinary axes"}>
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} className="viz-axis" />
        <line x1={L} y1={T} x2={L} y2={H - B} className="viz-axis" />
        <path d={d} className="plot-curve" />
        {CS.map((c) => <circle key={c} cx={X(c)} cy={Y(f(c))} r={4.5} className="plot-point" />)}
        {(logScale ? CS : [2.5e24, 5e24, 7.5e24, 1e25]).map((c) => (
          <text key={c} x={X(c)} y={H - B + 16} textAnchor="middle" className="plot-tick">{logScale ? `10^${Math.round(Math.log10(c))}` : `${c / 1e24}×10^24`}</text>
        ))}
        <text x={(W + L) / 2} y={H - 3} textAnchor="middle" className="plot-tick">training compute (arithmetic operations){logScale ? ", log scale" : ""}</text>
        <text x={L + 6} y={T + 10} className="plot-tick">{floor ? "loss above the floor" : "loss"}{logScale ? ", log scale" : ""}</text>
      </svg>
      <div className="viz-controls">
        <button type="button" className={logScale ? "btn" : "btn btn-primary"} aria-pressed={!logScale} onClick={() => setLogScale(false)}>Ordinary axes</button>
        <button type="button" className={logScale ? "btn btn-primary" : "btn"} aria-pressed={logScale} onClick={() => setLogScale(true)}>Log axes</button>
        <span className="viz-sep" />
        <button type="button" className={floor ? "btn btn-primary" : "btn"} aria-pressed={floor} onClick={() => setFloor(!floor)}>Subtract the floor</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Illustrative numbers with the shape that scaling studies report. {logScale
          ? floor ? "On log axes, the loss above its floor is an exact straight line: each tenfold increase in compute removes the same fraction of it. That regularity is what lets a lab predict a big model's loss from small ones." : "On log axes the points nearly line up. Subtract the floor, the loss no model can beat, to see the straight line exactly."
          : "On ordinary axes almost all the points crowd into the left edge, and the curve looks like it has flattened. Switch to log axes."}
      </figcaption>
    </figure>
  );
}
