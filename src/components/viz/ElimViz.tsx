"use client";

import { useState } from "react";
import { fmt, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const A: Mat = [[2, 1, 1, 5], [4, -6, 0, -2], [-2, 7, 2, 9]];
type S = { M: Mat; note: string; hi: number[]; x?: (number | null)[] };

function steps(): S[] {
  const out: S[] = [{ M: A, note: "The augmented matrix [A | b] of 2u + v + w = 5, 4u − 6v = −2, −2u + 7v + 2w = 9.", hi: [] }];
  const M = A.map((r) => [...r]);
  const elim = (r: number, p: number) => {
    const f = M[r][p] / M[p][p];
    for (let k = 0; k < 4; k++) M[r][k] -= f * M[p][k];
    out.push({ M: M.map((x) => [...x]), note: `Subtract ${fmt(f)} × row ${p + 1} from row ${r + 1}. The multiplier is the entry to clear divided by the pivot ${fmt(M[p][p])}.`, hi: [r] });
  };
  elim(1, 0); elim(2, 0); elim(2, 1);
  const x: (number | null)[] = [null, null, null];
  for (let i = 2; i >= 0; i--) {
    let s = M[i][3];
    for (let k = i + 1; k < 3; k++) s -= M[i][k] * (x[k] as number);
    x[i] = s / M[i][i];
    out.push({ M: M.map((r) => [...r]), note: `Back substitution: row ${i + 1} gives ${["u", "v", "w"][i]} = ${fmt(x[i] as number)}.`, hi: [i], x: [...x] });
  }
  return out;
}
const STEPS = steps();

/** Gaussian elimination on a 3 × 3 system, one row operation at a time, then back substitution. */
export function ElimViz() {
  const [k, setK] = useState(0);
  const s = STEPS[k];
  return (
    <figure className="viz">
      <div className="mat-row"><MatrixView M={s.M} rows={s.hi} bar={3} /></div>
      {s.x && <p className="mono" style={{ textAlign: "center" }}>{s.x.map((v, i) => `${["u", "v", "w"][i]} = ${v === null ? "?" : fmt(v)}`).join(",  ")}</p>}
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(STEPS.length - 1, k + 1))} disabled={k === STEPS.length - 1}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {k + 1} of {STEPS.length}. {s.note}{k === 3 ? " The matrix is now upper triangular: the pivots 2, −8 and 1 sit on the diagonal with zeros below." : ""}</figcaption>
    </figure>
  );
}
