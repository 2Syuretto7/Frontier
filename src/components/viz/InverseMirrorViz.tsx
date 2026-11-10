"use client";

import { useState } from "react";
import { Axes, curvePath, paramPath, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 420, h: 420 };
const r2 = (n: number) => Math.round(n * 100) / 100;

type F = { name: string; f: (x: number) => number; lo: number; hi: number; inverse: string | null };

const FS: F[] = [
  { name: "f(x) = 2x + 1", f: (x) => 2 * x + 1, lo: -5, hi: 5, inverse: "f⁻¹(y) = (y − 1)/2" },
  { name: "f(x) = x³/4", f: (x) => x ** 3 / 4, lo: -5, hi: 5, inverse: "f⁻¹(y) = ∛(4y)" },
  { name: "f(x) = x² − 2", f: (x) => x * x - 2, lo: -5, hi: 5, inverse: null },
  { name: "f(x) = x² − 2, x ≥ 0", f: (x) => x * x - 2, lo: 0, hi: 5, inverse: "f⁻¹(y) = √(y + 2)" },
];

/** Reflecting a graph in the line y = x swaps inputs and outputs. The result is a graph of a function only if f is one-to-one. */
export function InverseMirrorViz() {
  const [k, setK] = useState(0);
  const [x0, setX0] = useState(1);
  const fn = FS[k];
  const { X, Y } = scales(V);
  const p = Math.max(fn.lo, x0);
  const fp = fn.f(p);
  const twin = k === 2 && p !== 0 ? -p : null; // another input with the same output

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {FS.map((g, i) => (
          <button key={g.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            {g.name}
          </button>
        ))}
      </div>
      <Axes v={V} label={`${fn.name} and its reflection in the line y = x`}>
        <line x1={X(-5)} y1={Y(-5)} x2={X(5)} y2={Y(5)} className="plot-mirror" />
        <path d={curvePath(V, (x) => (x < fn.lo ? NaN : fn.f(x)), 800)} className="plot-curve" />
        <path d={paramPath(V, (t) => [fn.f(t), t], fn.lo, fn.hi, 800)} className={fn.inverse ? "plot-curve-2" : "plot-curve-2 plot-line"} />
        {Math.abs(fp) <= 5 && (
          <>
            <line x1={X(p)} y1={Y(fp)} x2={X(fp)} y2={Y(p)} className="plot-ghost" />
            <circle cx={X(p)} cy={Y(fp)} r={5.5} className="plot-point" />
            <circle cx={X(fp)} cy={Y(p)} r={5.5} className={twin !== null ? "plot-hot" : "plot-point"} />
            {twin !== null && <circle cx={X(fp)} cy={Y(twin)} r={5.5} className="plot-hot" />}
          </>
        )}
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>Input <span className="mono">x = {fmtNum(p)}</span></span>
          <input type="range" min={-3} max={3} step={0.25} value={x0} onChange={(e) => setX0(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The point <span className="mono">({fmtNum(p)}, {fmtNum(r2(fp))})</span> on the graph reflects to{" "}
        <span className="mono">({fmtNum(r2(fp))}, {fmtNum(p)})</span> on the dashed curve: input and output swap.{" "}
        {fn.inverse
          ? <>Every output comes from exactly one input, so the reflection is a graph of a function, the inverse <span className="mono">{fn.inverse}</span>.</>
          : <>But <span className="mono">{fmtNum(p)}</span> and <span className="mono">{fmtNum(-p)}</span> have the same output, so the reflection fails the vertical line test: there is no inverse until the domain is restricted.</>}
      </figcaption>
    </figure>
  );
}
