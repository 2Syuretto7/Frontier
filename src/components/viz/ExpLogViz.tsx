"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -4, xmax: 6, ymin: -4, ymax: 6, w: 400, h: 400 };
const r2 = (n: number) => Math.round(n * 100) / 100;
const BASES = [0.5, 1.5, 2, 3, 10];

/**
 * y = b^x, and optionally its mirror image in y = x, the logarithm to base b.
 * `withLog` turns on the reflection, used in the logarithms lesson.
 */
export function ExpLogViz({ withLog = false }: { withLog?: boolean }) {
  const [b, setB] = useState(2);
  const [x, setX] = useState(1);
  const { X, Y } = scales(V);
  const y = b ** x;
  const name = (n: number) => fmtNum(n);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {BASES.map((n) => (
          <button key={n} type="button" className={n === b ? "btn btn-primary" : "btn"} aria-pressed={n === b} onClick={() => setB(n)}>
            b = {name(n)}
          </button>
        ))}
      </div>
      <Axes v={V} label={`The graph of y = ${b} to the power x${withLog ? `, and its reflection, y = log base ${b} of x` : ""}`}>
        {withLog && <line x1={X(-4)} y1={Y(-4)} x2={X(6)} y2={Y(6)} className="plot-mirror" />}
        <path d={curvePath(V, (t) => b ** t, 600)} className="plot-curve" />
        {withLog && <path d={curvePath(V, (t) => (t <= 0 ? NaN : Math.log(t) / Math.log(b)), 1200)} className="plot-curve-2" />}
        {!withLog && <path d={curvePath(V, (t) => (1 / b) ** t, 600)} className="plot-ghost" />}
        {y <= 6 && <circle cx={X(x)} cy={Y(y)} r={5.5} className="plot-point" />}
        {withLog && y <= 6 && (
          <>
            <line x1={X(x)} y1={Y(y)} x2={X(y)} y2={Y(x)} className="plot-ghost" />
            <circle cx={X(y)} cy={Y(x)} r={5.5} className="plot-hot" />
          </>
        )}
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>Exponent <span className="mono">x = {fmtNum(x)}</span></span>
          <input type="range" min={-3} max={3} step={0.25} value={x} onChange={(e) => setX(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{name(b)}<sup>{fmtNum(x)}</sup> = {fmtNum(r2(y))}</span>.{" "}
        {withLog
          ? <>Reflected, the point says <span className="mono">log<sub>{name(b)}</sub>({fmtNum(r2(y))}) = {fmtNum(x)}</span>: the logarithm answers &ldquo;what power of {name(b)} gives this number?&rdquo;. The dashed curve exists only for positive inputs, crosses the x-axis at 1, and climbs ever more slowly.</>
          : <>Every graph passes through <span className="mono">(0, 1)</span>, stays above the x-axis, and {b > 1 ? "rises" : "falls"} steadily. The dashed ghost is <span className="mono">y = {name(r2(1 / b))}<sup>x</sup></span>, its mirror image in the y-axis.</>}
      </figcaption>
    </figure>
  );
}
