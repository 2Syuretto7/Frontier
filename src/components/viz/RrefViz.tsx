"use client";

import { useState } from "react";
import { rrefSteps, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const PRESETS: { name: string; A: Mat }[] = [
  { name: "rank 2, one free column", A: [[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]] },
  { name: "rank 3", A: [[1, 1, 2], [2, 1, 1], [1, 2, 4]] },
  { name: "needs a row swap", A: [[0, 2, 4], [1, 1, 1], [2, 3, 4]] },
];

/** Row reduction to reduced row echelon form, step by step, marking pivot and free columns. */
export function RrefViz() {
  const [p, setP] = useState(0);
  const [k, setK] = useState(0);
  const { steps, pivots } = rrefSteps(PRESETS[p].A);
  const s = steps[Math.min(k, steps.length - 1)];
  const done = k >= steps.length - 1;
  const n = PRESETS[p].A[0].length;
  const free = Array.from({ length: n }, (_, j) => j).filter((j) => !pivots.includes(j));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Matrix">
        {PRESETS.map((q, i) => <button key={q.name} type="button" className={i === p ? "btn btn-primary" : "btn"} aria-pressed={i === p} onClick={() => { setP(i); setK(0); }}>{q.name}</button>)}
      </div>
      <div className="mat-row"><MatrixView M={s.M} rows={done ? [] : s.hi ?? []} cols={done ? pivots : []} /></div>
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(steps.length - 1, k + 1))} disabled={done}>Next operation</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {done
          ? `Reduced row echelon form. Pivot columns: ${pivots.map((j) => j + 1).join(", ")} (highlighted). ${free.length ? `Free column${free.length > 1 ? "s" : ""}: ${free.map((j) => j + 1).join(", ")}. Each free column gives one free variable in the solutions of Ax = 0.` : "Every column has a pivot, so Ax = 0 has only the zero solution."} The rank is ${pivots.length}.`
          : `Operation ${k} of ${steps.length - 1}. ${s.note}`}
      </figcaption>
    </figure>
  );
}
