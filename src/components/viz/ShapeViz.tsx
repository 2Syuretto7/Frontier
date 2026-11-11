"use client";

import { useState } from "react";

const SHAPES: number[][] = [[12], [3, 4], [4, 3], [2, 6], [2, 2, 3]];
const DTYPES = [{ n: "int8", b: 1 }, { n: "int32", b: 4 }, { n: "float32", b: 4 }, { n: "float64", b: 8 }];

/** One block of twelve numbers seen through different shapes, and what a dtype costs in memory. */
export function ShapeViz() {
  const [si, setSi] = useState(1);
  const [di, setDi] = useState(3);
  const [pick, setPick] = useState(6);
  const shape = SHAPES[si];
  const dt = DTYPES[di];
  const idx = (() => {
    const out: number[] = [];
    let r = pick;
    for (let k = shape.length - 1; k >= 0; k--) { out.unshift(r % shape[k]); r = Math.floor(r / shape[k]); }
    return out;
  })();
  const cols = shape[shape.length - 1];
  const rows = shape.length > 1 ? shape[shape.length - 2] : 1;
  const blocks = shape.length > 2 ? shape[0] : 1;
  const strides = shape.map((_, k) => shape.slice(k + 1).reduce((a, b) => a * b, 1));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Shape">
          {SHAPES.map((s, i) => <button key={i} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}><code>({s.join(", ")}{s.length === 1 ? "," : ""})</code></button>)}
        </div>
      </div>
      <div className="shape-blocks">
        {Array.from({ length: blocks }, (_, b) => (
          <div key={b} className="shape-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: rows * cols }, (_, k) => {
              const flat = b * rows * cols + k;
              return <button key={flat} type="button" className={flat === pick ? "shape-cell is-on" : "shape-cell"} onClick={() => setPick(flat)}>{flat}</button>;
            })}
          </div>
        ))}
      </div>
      <div className="viz-controls">
        <div className="segmented" role="group" aria-label="dtype">
          {DTYPES.map((d, i) => <button key={d.n} type="button" className="seg" aria-pressed={di === i} onClick={() => setDi(i)}>{d.n}</button>)}
        </div>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>a[{idx.join(", ")}]</b><span>index of the chosen cell</span></div>
        <div className="ml-stat"><b>{shape.length}</b><span>ndim, the number of axes</span></div>
        <div className="ml-stat"><b>{12 * dt.b} B</b><span>nbytes: 12 × {dt.b} for {dt.n}</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The same twelve numbers, stored in the same order, read as shape ({shape.join(", ")}{shape.length === 1 ? "," : ""}). The chosen cell is element {pick} in memory, and its index satisfies {idx.map((v, k) => `${v}×${strides[k]}`).join(" + ")} = {pick}: the last axis changes fastest.
      </figcaption>
    </figure>
  );
}
