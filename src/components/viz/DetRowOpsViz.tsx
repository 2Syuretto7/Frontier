"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { det, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const A0: Mat = [[2, 1, 1], [4, -6, 0], [-2, 7, 2]];
type Op = { label: string; run: (M: Mat) => Mat; rule: string; hi: number[] };
const OPS: Op[] = [
  { label: "Swap rows 1 and 2", run: (M) => [M[1], M[0], M[2]], rule: "A row swap flips the sign of the determinant.", hi: [0, 1] },
  { label: "Row 1 × 2", run: (M) => [M[0].map((v) => 2 * v), M[1], M[2]], rule: "Multiplying one row by 2 multiplies the determinant by 2.", hi: [0] },
  { label: "Row 2 − 2 × row 1", run: (M) => [M[0], M[1].map((v, j) => v - 2 * M[0][j]), M[2]], rule: "Subtracting a multiple of one row from another leaves the determinant unchanged.", hi: [1] },
  { label: "Row 3 + row 1", run: (M) => [M[0], M[1], M[2].map((v, j) => v + M[0][j])], rule: "Adding one row to another leaves the determinant unchanged.", hi: [2] },
  { label: "Row 3 + row 2", run: (M) => [M[0], M[1], M[2].map((v, j) => v + M[1][j])], rule: "Adding one row to another leaves the determinant unchanged.", hi: [2] },
];

/** Row operations on a 3 × 3 matrix and what each does to the determinant. */
export function DetRowOpsViz() {
  const [M, setM] = useState<Mat>(A0);
  const [last, setLast] = useState<Op | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const d = det(M);
  const tri = M[1][0] === 0 && M[2][0] === 0 && M[2][1] === 0;
  return (
    <figure className="viz">
      <div className="mat-row"><MatrixView M={M} rows={last ? last.hi : []} /><span className="mono">det = {fmtNum(Number(d.toFixed(6)))}</span></div>
      <div className="viz-controls" style={{ justifyContent: "center", flexWrap: "wrap" }}>
        {OPS.map((o) => (
          <button key={o.label} type="button" className="btn" onClick={() => { setPrev(d); setM(o.run(M)); setLast(o); }}>{o.label}</button>
        ))}
        <button type="button" className="btn btn-primary" onClick={() => { setM(A0); setLast(null); setPrev(null); }}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {last && prev !== null ? `${last.rule} It went from ${fmtNum(Number(prev.toFixed(6)))} to ${fmtNum(Number(d.toFixed(6)))}. ` : "Apply row operations and watch the determinant. "}
        {tri ? `The matrix is upper triangular, so its determinant is the product of the diagonal: ${M.map((r, i) => fmtNum(r[i])).join(" × ")} = ${fmtNum(Number(d.toFixed(6)))}.` : "Try row 2 − 2 × row 1, then row 3 + row 1, then row 3 + row 2 to reach a triangular matrix."}
      </figcaption>
    </figure>
  );
}
