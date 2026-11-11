"use client";

import { useState } from "react";

type V = { code: string; shape: number[]; strides: number[]; offset: number; note: string };
const VIEWS: V[] = [
  { code: "a", shape: [3, 4], strides: [16, 4], offset: 0, note: "Row-major (C order): moving along a row steps 4 bytes, one int32; moving down a column steps 16 bytes, a whole row." },
  { code: "a.T", shape: [4, 3], strides: [4, 16], offset: 0, note: "The transpose copies nothing. It swaps the strides, so the same memory is read column by column. The result is no longer contiguous." },
  { code: "a[:, ::2]", shape: [3, 2], strides: [16, 8], offset: 0, note: "Taking every other column doubles the column stride to 8 bytes. Still a view of the same memory." },
  { code: "a[1]", shape: [4], strides: [4], offset: 16, note: "A single row starts 16 bytes in, at an offset, and has one axis with stride 4." },
  { code: "a[:, ::-1]", shape: [3, 4], strides: [16, -4], offset: 12, note: "Reversing the columns gives a negative stride: start at the end of each row and step backwards." },
];

/** An array is a block of memory plus a shape and strides; views change only the latter. */
export function StrideViz() {
  const [vi, setVi] = useState(0);
  const [cell, setCell] = useState(0);
  const v = VIEWS[vi];
  const n = v.shape.reduce((p, q) => p * q, 1);
  const c = Math.min(cell, n - 1);
  const idx = v.shape.length === 2 ? [Math.floor(c / v.shape[1]), c % v.shape[1]] : [c];
  const byte = v.offset + idx.reduce((s, i, k) => s + i * v.strides[k], 0);
  const used = new Set(Array.from({ length: n }, (_, k) => {
    const ix = v.shape.length === 2 ? [Math.floor(k / v.shape[1]), k % v.shape[1]] : [k];
    return (v.offset + ix.reduce((s, i, d) => s + i * v.strides[d], 0)) / 4;
  }));
  const cols = v.shape[v.shape.length - 1];
  const contiguous = v.strides[v.strides.length - 1] === 4 && (v.shape.length === 1 || v.strides[0] === 4 * v.shape[1]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="View">
          {VIEWS.map((x, i) => <button key={x.code} type="button" className="seg" aria-pressed={vi === i} onClick={() => { setVi(i); setCell(0); }}><code>{x.code}</code></button>)}
        </div>
      </div>
      <div className="view-label" style={{ marginTop: 12 }}><code>{v.code}</code>: shape ({v.shape.join(", ")}{v.shape.length === 1 ? "," : ""}), strides ({v.strides.join(", ")}{v.strides.length === 1 ? "," : ""}) bytes, {contiguous ? "contiguous" : "not contiguous"}</div>
      <div className="shape-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 48px))`, marginTop: 6 }}>
        {Array.from({ length: n }, (_, k) => {
          const ix = v.shape.length === 2 ? [Math.floor(k / v.shape[1]), k % v.shape[1]] : [k];
          const val = (v.offset + ix.reduce((s, i, d) => s + i * v.strides[d], 0)) / 4;
          return <button key={k} type="button" className={k === c ? "shape-cell is-on" : "shape-cell"} onClick={() => setCell(k)}>{val}</button>;
        })}
      </div>
      <div className="view-label" style={{ marginTop: 12 }}>memory: 12 int32 values, 4 bytes each</div>
      <div className="view-row">
        {Array.from({ length: 12 }, (_, k) => <span key={k} className={k * 4 === byte ? "view-cell is-sel" : used.has(k) ? "view-cell is-b" : "view-cell"}>{k}</span>)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {v.note} The chosen element {v.code}[{idx.join(", ")}] lives at byte {v.offset} + {idx.map((i, k) => `${i}×${v.strides[k]}`).join(" + ")} = {byte}.
      </figcaption>
    </figure>
  );
}
