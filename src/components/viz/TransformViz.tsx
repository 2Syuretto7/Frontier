"use client";

import { useState } from "react";
import { Axes, curvePath, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 6, ymin: -4, ymax: 6, w: 480, h: 400 };

const BASES: { name: string; f: (x: number) => number }[] = [
  { name: "x²", f: (x) => x * x },
  { name: "|x|", f: (x) => Math.abs(x) },
  { name: "√x", f: (x) => (x < 0 ? NaN : Math.sqrt(x)) },
  { name: "x³", f: (x) => x ** 3 },
];

const PARAMS = [
  { key: "a", min: -3, max: 3, step: 0.5, hint: "stretches vertically; negative flips in the x-axis" },
  { key: "b", min: -3, max: 3, step: 0.5, hint: "squeezes horizontally by 1/b; negative flips in the y-axis" },
  { key: "h", min: -4, max: 4, step: 0.5, hint: "shifts right by h" },
  { key: "k", min: -4, max: 4, step: 0.5, hint: "shifts up by k" },
] as const;

type P = Record<(typeof PARAMS)[number]["key"], number>;
const START: P = { a: 1, b: 1, h: 0, k: 0 };

/** y = a·f(b(x − h)) + k, drawn over a ghost of y = f(x). */
export function TransformViz() {
  const [base, setBase] = useState(0);
  const [p, setP] = useState<P>(START);
  const f = BASES[base].f;
  const g = (x: number) => p.a * f(p.b * (x - p.h)) + p.k;
  const inner = `${p.b === 1 ? "" : p.b === -1 ? "−" : fmtNum(p.b)}${p.h === 0 ? "x" : `(x ${p.h < 0 ? "+" : "−"} ${fmtNum(Math.abs(p.h))})`}`;
  const outer = `${p.a === 1 ? "" : p.a === -1 ? "−" : fmtNum(p.a)}f(${inner})${p.k === 0 ? "" : ` ${p.k < 0 ? "−" : "+"} ${fmtNum(Math.abs(p.k))}`}`;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {BASES.map((b, i) => (
          <button key={b.name} type="button" className={i === base ? "btn btn-primary" : "btn"} aria-pressed={i === base} onClick={() => setBase(i)}>
            f(x) = {b.name}
          </button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setP(START)}>Reset</button>
      </div>
      <Axes v={V} label={`y = ${outer} where f(x) = ${BASES[base].name}`}>
        <path d={curvePath(V, f, 800)} className="plot-ghost" />
        <path d={curvePath(V, g, 800)} className="plot-curve" />
      </Axes>
      <div className="viz-sliders">
        {PARAMS.map((q) => (
          <label key={q.key} title={q.hint}>
            <span><span className="mono">{q.key} = {fmtNum(p[q.key])}</span></span>
            <input type="range" min={q.min} max={q.max} step={q.step} value={p[q.key]}
              onChange={(e) => { const n = Number(e.target.value); setP({ ...p, [q.key]: (q.key === "a" || q.key === "b") && n === 0 ? 0.5 : n }); }} />
          </label>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">y = {outer}</span>, with the dashed ghost showing <span className="mono">y = {BASES[base].name}</span>. Changes
        outside the brackets (a, k) act on outputs and move the graph vertically, as you would expect. Changes inside (b, h) act on
        inputs and move it horizontally, the opposite way to how they look:{" "}
        {p.h === 0
          ? <>for example, <span className="mono">x − 2</span> would shift it <em>right</em> by 2.</>
          : <>here <span className="mono">x {p.h > 0 ? "−" : "+"} {fmtNum(Math.abs(p.h))}</span> shifts it <em>{p.h > 0 ? "right" : "left"}</em> by {fmtNum(Math.abs(p.h))}.</>}
      </figcaption>
    </figure>
  );
}
