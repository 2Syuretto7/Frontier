"use client";

import { useState } from "react";

type View = { code: string; shape: [number, number]; strides: [number, number]; offset: number; note: string };
const VIEWS: View[] = [
  { code: "a", shape: [3, 4], strides: [4, 1], offset: 0, note: "Contiguous: the addresses run 0, 1, 2, … with no gaps, so the kernel can use one flat loop and the cache reads every line once." },
  { code: "a.T", shape: [4, 3], strides: [1, 4], offset: 0, note: "The transpose reads the same buffer with jumps of 4. Correct, but each step lands on a different cache line once rows are long." },
  { code: "a[:, 1::2]", shape: [3, 2], strides: [4, 2], offset: 1, note: "A strided slice: offset 1, then steps of 2 along a row and 4 down a column. Half of each row is skipped." },
  { code: "row broadcast to (3, 4)", shape: [3, 4], strides: [0, 1], offset: 0, note: "Stride 0 on axis 0: every row reads the same four cells. A broadcast costs no memory, but it must never be written through." },
];

/** The generic strided loop of a C kernel: each element's address is offset + i*s0 + j*s1. */
export function StridedKernelViz() {
  const [vi, setVi] = useState(1);
  const [k, setK] = useState(0);
  const v = VIEWS[vi];
  const n = v.shape[0] * v.shape[1];
  const step = Math.min(k, n - 1);
  const addr = (t: number) => { const i = Math.floor(t / v.shape[1]), j = t % v.shape[1]; return v.offset + i * v.strides[0] + j * v.strides[1]; };
  const seq = Array.from({ length: n }, (_, t) => addr(t));
  const i = Math.floor(step / v.shape[1]), j = step % v.shape[1];
  const cur = seq[step];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {VIEWS.map((w, q) => (
          <button key={w.code} type="button" className="seg" aria-pressed={vi === q} onClick={() => { setVi(q); setK(0); }}>{w.code}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", margin: "10px 0" }} aria-label="the 12-element buffer">
        {Array.from({ length: 12 }, (_, c) => {
          const visits = seq.slice(0, step + 1).filter((x) => x === c).length;
          return (
            <span key={c} className="mono" style={{ width: 30, textAlign: "center", padding: "6px 0", fontSize: 13, borderRadius: 4, border: `1px solid ${c === cur ? "var(--danger)" : "var(--border)"}`, background: c === cur ? "var(--accent-soft)" : visits ? "var(--accent-soft)" : "transparent", opacity: visits || c === cur ? 1 : 0.55 }}>
              {c}
            </span>
          );
        })}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setK(Math.min(n - 1, step + 1))} disabled={step >= n - 1}>Next element</button>
        <button type="button" className="btn" onClick={() => setK(n - 1)}>Run all</button>
        <button type="button" className="btn" onClick={() => setK(0)}>Reset</button>
      </div>
      <pre className="mono" style={{ fontSize: 13, margin: "8px 0", overflowX: "auto" }}>
        {`shape (${v.shape.join(", ")}), strides (${v.strides.join(", ")}), offset ${v.offset}
element (${i}, ${j}) at ${v.offset} + ${i}·${v.strides[0]} + ${j}·${v.strides[1]} = ${cur}
addresses so far: ${seq.slice(0, step + 1).join(", ")}`}
      </pre>
      <figcaption className="viz-caption" aria-live="polite">
        The buffer holds a = arange(12) as a 3 × 4 array. The kernel walks the view in index order and computes each address
        from the strides. {v.note}
      </figcaption>
    </figure>
  );
}
