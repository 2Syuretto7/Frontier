"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { det, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const A: Mat = [[2, 1, 3], [0, 4, 1], [5, 2, 0]];
const minor = (i: number, j: number): Mat => A.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j));
const det2 = (M: Mat) => M[0][0] * M[1][1] - M[0][1] * M[1][0];

/** Cofactor expansion of a 3 × 3 determinant along any row: every row gives the same answer. */
export function CofactorViz() {
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const terms = [0, 1, 2].map((c) => {
    const s = (i + c) % 2 === 0 ? 1 : -1;
    const m = det2(minor(i, c));
    return { c, s, m, t: A[i][c] * s * m };
  });
  const sum = terms.reduce((a, t) => a + t.t, 0);
  const cur = terms[j];
  return (
    <figure className="viz">
      <div className="mat-row">
        <MatrixView M={A} label="A" rows={[i]} cells={[[i, j]]} />
        <span className="mat-op">→</span>
        <MatrixView M={minor(i, j)} label={`minor M${i + 1}${j + 1}`} />
      </div>
      <div className="viz-controls" style={{ justifyContent: "center", flexWrap: "wrap" }}>
        {[0, 1, 2].map((r) => <button key={r} type="button" className={"btn" + (r === i ? " btn-primary" : "")} onClick={() => setI(r)}>Expand along row {r + 1}</button>)}
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <thead><tr><th>entry</th><th>sign</th><th>minor det</th><th>term</th></tr></thead>
        <tbody>
          {terms.map((t) => (
            <tr key={t.c} onClick={() => setJ(t.c)} style={{ cursor: "pointer", fontWeight: t.c === j ? 600 : 400 }}>
              <td className="mono">a{i + 1}{t.c + 1} = {fmtNum(A[i][t.c])}</td>
              <td className="mono">{t.s > 0 ? "+" : "−"}</td>
              <td className="mono">{fmtNum(t.m)}</td>
              <td className="mono">{fmtNum(t.t)}</td>
            </tr>
          ))}
          <tr><td colSpan={3}>sum</td><td className="mono">{fmtNum(sum)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Tap a row of the table to see its minor. The term for a{i + 1}{j + 1} is {fmtNum(A[i][j])} × ({cur.s > 0 ? "+" : "−"}1) × {fmtNum(cur.m)} = {fmtNum(cur.t)}.
        The signs follow a chessboard pattern starting with + in the top-left. Whichever row you expand along, the sum is {fmtNum(sum)}, which is det A = {fmtNum(Math.round(det(A)))}.
      </figcaption>
    </figure>
  );
}
