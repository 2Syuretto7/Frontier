"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow } from "./Plot";

const X0 = 40, X1 = 580, LO = -12, HI = 12;
const X = (v: number) => X0 + ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (X1 - X0);

/** Multiplying both sides of a < b by c: the order is kept when c > 0 and reversed when c < 0. */
export function OrderViz() {
  const [a, setA] = useState(-1), [b, setB] = useState(2), [c, setC] = useState(-2);
  const ca = c * a, cb = c * b;
  const rel = (x: number, y: number) => (x < y ? "<" : x > y ? ">" : "=");
  const line = (y: number, p: number, q: number, lp: string, lq: string, below = false) => (
    <g>
      <line x1={X0} x2={X1} y1={y} y2={y} className="viz-axis" />
      {[-10, -5, 0, 5, 10].map((t) => <text key={t} x={X(t)} y={y + 18} textAnchor="middle" className="plot-tick">{fmtNum(t)}</text>)}
      <circle cx={X(p)} cy={y} r={7} className="plot-point" />
      <circle cx={X(q)} cy={y} r={7} className="plot-hot" />
      <text x={X(p)} y={below ? y + 38 : y - 12} textAnchor="middle" className="viz-label">{lp}</text>
      <text x={X(q)} y={below ? y + 38 : y - 12} textAnchor="middle" className="viz-label">{lq}</text>
    </g>
  );
  const slider = (label: string, v: number, set: (x: number) => void) => (
    <label className="viz-stepper-label" style={{ flex: 1, minWidth: 150 }}>
      {label} = <span className="mono">{fmtNum(v)}</span>
      <input type="range" className="viz-range" min={-5} max={5} step={0.5} value={v} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 200" role="img" aria-label={`a = ${a}, b = ${b}, and after multiplying by ${c}`}>
        {line(50, a, b, "a", "b")}
        {line(150, ca, cb, "ca", "cb", true)}
        {c !== 0 && <Arrow x1={X(a)} y1={60} x2={X(ca)} y2={136} className="plot-arrow is-muted" head={7} />}
        {c !== 0 && <Arrow x1={X(b)} y1={60} x2={X(cb)} y2={136} className="plot-arrow is-muted" head={7} />}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {slider("a", a, setA)}
        {slider("b", b, setB)}
        {slider("c", c, setC)}
      </div>
      <p className="viz-verdict viz-verdict-right" style={{ margin: "8px 0 0" }}>
        a {rel(a, b)} b, and ca = {fmtNum(ca)} {rel(ca, cb)} {fmtNum(cb)} = cb.
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        {a === b ? <>With a = b there is no order to keep. </> : null}
        {c > 0 && a !== b && <>Multiplying by a positive number stretches the line without turning it round, so the order is kept.</>}
        {c < 0 && a !== b && <>Multiplying by a negative number flips the line over 0, so the order is <strong>reversed</strong>. This is why multiplying an inequality by −1 turns it round.</>}
        {c === 0 && <>Multiplying by 0 sends everything to 0, so ca = cb and the strict order is lost.</>}
      </figcaption>
    </figure>
  );
}
