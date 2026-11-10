"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 6, ymin: -4, ymax: 6, w: 480, h: 400 };

const r2 = (n: number) => Math.round(n * 100) / 100;
const signed = (n: number) => (n < 0 ? `− ${fmtNum(-n)}` : `+ ${fmtNum(n)}`);

function Slider({ name, value, min, max, step, set }: { name: string; value: number; min: number; max: number; step: number; set: (n: number) => void }) {
  return (
    <label>
      <span><span className="mono">{name} = {fmtNum(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
}

/** A line y = mx + c with its slope triangle, and a parabola in vertex form y = a(x − h)² + k with its roots. */
export function LineParabolaViz() {
  const [mode, setMode] = useState<"line" | "parabola">("line");
  const [m, setM] = useState(0.5), [c, setC] = useState(1);
  const [a, setA] = useState(1), [h, setH] = useState(1), [k, setK] = useState(-3);
  const { X, Y } = scales(V);

  const q = (x: number) => a * (x - h) ** 2 + k;
  const disc = -k / a; // (x − h)² = −k/a
  const roots = a === 0 ? [] : disc > 0 ? [h - Math.sqrt(disc), h + Math.sqrt(disc)] : disc === 0 ? [h] : [];

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className={mode === "line" ? "btn btn-primary" : "btn"} aria-pressed={mode === "line"} onClick={() => setMode("line")}>Line</button>
        <button type="button" className={mode === "parabola" ? "btn btn-primary" : "btn"} aria-pressed={mode === "parabola"} onClick={() => setMode("parabola")}>Parabola</button>
      </div>
      {mode === "line" ? (
        <>
          <Axes v={V} label={`The line y = ${m}x + ${c}`}>
            <path d={curvePath(V, (x) => m * x + c, 2)} className="plot-curve" />
            <line x1={X(1)} y1={Y(m + c)} x2={X(2)} y2={Y(m + c)} className="plot-mirror" style={{ strokeDasharray: "none", strokeWidth: 2 }} />
            <line x1={X(2)} y1={Y(m + c)} x2={X(2)} y2={Y(2 * m + c)} className="plot-line" strokeWidth={2} />
            <text x={X(1.5)} y={Y(m + c) + (m >= 0 ? 16 : -8)} textAnchor="middle" className="plot-tick">1</text>
            <text x={X(2) + 6} y={(Y(m + c) + Y(2 * m + c)) / 2 + 4} className="plot-tick">{fmtNum(m)}</text>
            <circle cx={X(0)} cy={Y(c)} r={5.5} className="plot-point" />
          </Axes>
          <div className="viz-sliders">
            <Slider name="m" value={m} min={-3} max={3} step={0.25} set={setM} />
            <Slider name="c" value={c} min={-4} max={5} step={0.5} set={setC} />
          </div>
          <figcaption className="viz-caption" aria-live="polite">
            <span className="mono">y = {fmtNum(m)}x {signed(c)}</span>. Step 1 to the right and the line rises by the slope,{" "}
            <span className="mono">{fmtNum(m)}</span>, wherever you start. It crosses the y-axis at <span className="mono">(0, {fmtNum(c)})</span>
            {m !== 0 ? <> and the x-axis at <span className="mono">x = {fmtNum(r2(-c / m))}</span>.</> : <>, and, being flat, never meets the x-axis unless c = 0.</>}
          </figcaption>
        </>
      ) : (
        <>
          <Axes v={V} label={`The parabola y = ${a}(x − ${h})² + ${k}`}>
            <line x1={X(h)} y1={0} x2={X(h)} y2={V.h} className="plot-mirror" />
            <path d={curvePath(V, q)} className="plot-curve" />
            {roots.map((r) => <circle key={r} cx={X(r)} cy={Y(0)} r={5} className="plot-hot" />)}
            <circle cx={X(h)} cy={Y(k)} r={5.5} className="plot-point" />
          </Axes>
          <div className="viz-sliders">
            <Slider name="a" value={a} min={-2} max={2} step={0.25} set={(n) => setA(n === 0 ? 0.25 : n)} />
            <Slider name="h" value={h} min={-4} max={4} step={0.5} set={setH} />
            <Slider name="k" value={k} min={-4} max={5} step={0.5} set={setK} />
          </div>
          <figcaption className="viz-caption" aria-live="polite">
            <span className="mono">y = {a === 1 ? "" : a === -1 ? "−" : fmtNum(a)}(x {signed(-h)})² {signed(k)}</span>. The vertex is{" "}
            <span className="mono">({fmtNum(h)}, {fmtNum(k)})</span>, a {a > 0 ? "minimum" : "maximum"}, and the dotted line{" "}
            <span className="mono">x = {fmtNum(h)}</span> is the axis of symmetry.{" "}
            {roots.length === 2
              ? <>Roots at <span className="mono">x = {fmtNum(r2(roots[0]))}</span> and <span className="mono">{fmtNum(r2(roots[1]))}</span>, equally spaced about the axis.</>
              : roots.length === 1
                ? <>The vertex touches the x-axis: one repeated root.</>
                : <>The parabola never meets the x-axis: no real roots.</>}
          </figcaption>
        </>
      )}
    </figure>
  );
}
