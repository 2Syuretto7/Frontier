"use client";

import { useState } from "react";
import { luSteps, mul, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const A: Mat = [[2, 1, 1], [4, -6, 0], [-2, 7, 2]];
const R = luSteps(A)!;

/** Elimination recorded as A = LU: the multipliers fill L below its diagonal while A becomes U. */
export function LUViz() {
  const [k, setK] = useState(0);
  const s = R.steps[k];
  const done = k === R.steps.length - 1;
  const prev = k ? R.steps[k - 1].L : s.L;
  const newCells: [number, number][] = [];
  s.L.forEach((r, i) => r.forEach((v, j) => { if (v !== prev[i][j]) newCells.push([i, j]); }));
  return (
    <figure className="viz">
      <div className="mat-row">
        <MatrixView M={A} label="A" />
        <span className="mat-op">=</span>
        <MatrixView M={s.L} label="L" cells={newCells} />
        <span className="mat-op">×</span>
        <MatrixView M={s.M} label={done ? "U" : "current"} rows={s.hi ?? []} />
      </div>
      {done && <div className="mat-row"><MatrixView M={mul(R.L, R.U)} label="L × U" /></div>}
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(R.steps.length - 1, k + 1))} disabled={done}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} {done ? "Elimination is finished. L holds every multiplier below a diagonal of ones, U is upper triangular, and multiplying them gives A back." : ""}
      </figcaption>
    </figure>
  );
}
