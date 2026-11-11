"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Arrow } from "./Plot";

const X0 = 40, X1 = 580, LO = -10, HI = 10;
const X = (v: number) => X0 + ((v - LO) / (HI - LO)) * (X1 - X0);

/** |x − a| < r as an interval, and the triangle inequality as arrows on a line. */
export function AbsViz() {
  const [mode, setMode] = useState<0 | 1>(0);
  const [a, setA] = useState(2), [r, setR] = useState(3);
  const [x, setX] = useState(5), [y, setY] = useState(-3);
  const slider = (label: string, v: number, set: (z: number) => void, min: number, max: number) => (
    <label className="viz-stepper-label" style={{ flex: 1, minWidth: 150 }}>
      {label} = <span className="mono">{fmtNum(v)}</span>
      <input type="range" className="viz-range" min={min} max={max} step={0.5} value={v} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
  const ticks = [-10, -5, 0, 5, 10];

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className={mode === 0 ? "btn btn-primary" : "btn"} aria-pressed={mode === 0} onClick={() => setMode(0)}>|x − a| &lt; r</button>
        <button type="button" className={mode === 1 ? "btn btn-primary" : "btn"} aria-pressed={mode === 1} onClick={() => setMode(1)}>The triangle inequality</button>
      </div>
      {mode === 0 ? (
        <>
          <svg viewBox="0 0 620 110" role="img" aria-label={`The numbers within ${r} of ${a}`}>
            <line x1={X0} x2={X1} y1={60} y2={60} className="viz-axis" />
            {ticks.map((t) => <text key={t} x={X(t)} y={88} textAnchor="middle" className="plot-tick">{fmtNum(t)}</text>)}
            <line x1={X(Math.max(LO, a - r))} x2={X(Math.min(HI, a + r))} y1={60} y2={60} style={{ stroke: "var(--accent)", strokeWidth: 6 }} />
            {[a - r, a + r].filter((e) => e >= LO && e <= HI).map((e) => <circle key={e} cx={X(e)} cy={60} r={5} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />)}
            <circle cx={X(a)} cy={60} r={4} className="plot-hot" />
            <text x={X(a)} y={40} textAnchor="middle" className="viz-label">a</text>
            {r > 1 && <text x={(X(a) + X(Math.min(HI, a + r))) / 2} y={40} textAnchor="middle" className="plot-tick">r</text>}
          </svg>
          <div className="viz-controls" style={{ flexWrap: "wrap" }}>
            {slider("a", a, setA, -5, 5)}
            {slider("r", r, setR, 0.5, 5)}
          </div>
          <figcaption className="viz-caption" aria-live="polite">
            |x − a| is the distance from x to a. So |x − {fmtNum(a)}| &lt; {fmtNum(r)} says x is less than {fmtNum(r)} away from {fmtNum(a)}:
            that is, {fmtNum(a - r)} &lt; x &lt; {fmtNum(a + r)}, the open interval ({fmtNum(a - r)}, {fmtNum(a + r)}).
          </figcaption>
        </>
      ) : (
        <>
          <svg viewBox="0 0 620 150" role="img" aria-label={`x = ${x}, y = ${y} and x + y = ${x + y}`}>
            <line x1={X0} x2={X1} y1={120} y2={120} className="viz-axis" />
            {ticks.map((t) => <text key={t} x={X(t)} y={140} textAnchor="middle" className="plot-tick">{fmtNum(t)}</text>)}
            {x !== 0 && <Arrow x1={X(0)} y1={40} x2={X(x)} y2={40} head={8} />}
            <text x={X(x / 2)} y={30} textAnchor="middle" className="plot-tick">x</text>
            {y !== 0 && <Arrow x1={X(x)} y1={64} x2={X(x + y)} y2={64} className="plot-arrow is-muted" head={8} />}
            <text x={X(x + y / 2)} y={56} textAnchor="middle" className="plot-tick">y</text>
            {x + y !== 0 && <Arrow x1={X(0)} y1={98} x2={X(x + y)} y2={98} className="plot-arrow is-hot" head={8} />}
            <text x={X((x + y) / 2)} y={90} textAnchor="middle" className="plot-tick">x + y</text>
          </svg>
          <div className="viz-controls" style={{ flexWrap: "wrap" }}>
            {slider("x", x, setX, -5, 5)}
            {slider("y", y, setY, -5, 5)}
          </div>
          <p className="viz-verdict viz-verdict-right" style={{ margin: "8px 0 0" }}>
            |x + y| = {fmtNum(Math.abs(x + y))} ≤ {fmtNum(Math.abs(x) + Math.abs(y))} = |x| + |y|
          </p>
          <figcaption className="viz-caption" aria-live="polite">
            Walking x and then y, you end up at x + y. You can never end up further from 0 than the total distance walked.{" "}
            {x * y < 0 ? <>Here x and y point in opposite directions, so some of the walking is undone and the inequality is strict.</> : <>Here x and y point the same way (or one is 0), so nothing is undone and equality holds.</>}
          </figcaption>
        </>
      )}
    </figure>
  );
}
