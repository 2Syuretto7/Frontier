"use client";

import { useState } from "react";

type Op = { code: string; idx: number[]; view: boolean; why: string };
const OPS: Op[] = [
  { code: "b = a[2:8]", idx: [2, 3, 4, 5, 6, 7], view: true, why: "A basic slice is a view: b is a window onto a's memory." },
  { code: "b = a[::3]", idx: [0, 3, 6, 9], view: true, why: "A slice with a step is still a view; it just skips elements." },
  { code: "b = a.reshape(3, 4)[1]", idx: [4, 5, 6, 7], view: true, why: "Reshaping a contiguous array and taking a row both give views." },
  { code: "b = a[[1, 5, 7]]", idx: [1, 5, 7], view: false, why: "Indexing with a list of positions (fancy indexing) always makes a copy." },
  { code: "b = a[a % 4 == 0]", idx: [0, 4, 8], view: false, why: "Indexing with a boolean mask is also fancy indexing, so it makes a copy." },
  { code: "b = a[2:8].copy()", idx: [2, 3, 4, 5, 6, 7], view: false, why: "An explicit copy() breaks the link." },
];

/** Which indexing operations share memory with the original array, shown by writing through the result. */
export function ViewViz() {
  const [oi, setOi] = useState(0);
  const [written, setWritten] = useState(false);
  const op = OPS[oi];
  const a = Array.from({ length: 12 }, (_, k) => (written && op.view && op.idx.includes(k) ? 0 : k));
  const b = op.idx.map((k) => (written ? 0 : k));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Indexing operation">
          {OPS.map((o, i) => <button key={o.code} type="button" className="seg" aria-pressed={oi === i} onClick={() => { setOi(i); setWritten(false); }}><code>{o.code}</code></button>)}
        </div>
      </div>
      <div className="view-arrays">
        <div className="view-label"><code>a = np.arange(12)</code></div>
        <div className="view-row">{a.map((v, k) => <span key={k} className={op.idx.includes(k) ? "view-cell is-sel" : "view-cell"}>{v}</span>)}</div>
        <div className="view-label"><code>b</code> <span className={op.view ? "view-tag is-view" : "view-tag"}>{op.view ? "view of a" : "copy"}</span></div>
        <div className="view-row">{b.map((v, k) => <span key={k} className="view-cell is-b">{v}</span>)}</div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setWritten(true)} disabled={written}><code>b[:] = 0</code></button>
        <button type="button" className="btn" onClick={() => setWritten(false)} disabled={!written}>Undo</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {op.why}{" "}
        {written ? (op.view ? "Writing zeros into b changed a as well, because they share memory." : "Writing zeros into b left a untouched.") : "Write zeros into b to find out whether a changes."} You can always check with <code>np.shares_memory(a, b)</code>.
      </figcaption>
    </figure>
  );
}
