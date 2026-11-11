"use client";

import { useState } from "react";
import { T, fmt, rrefSteps, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const PRESETS: { name: string; A: Mat }[] = [
  { name: "3 × 4, rank 2", A: [[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]] },
  { name: "2 × 3, rank 1", A: [[1, 2, 3], [2, 4, 6]] },
  { name: "3 × 2, rank 2", A: [[1, 0], [1, 1], [1, 2]] },
];

function nullBasis(A: Mat): Mat {
  const { steps, pivots } = rrefSteps(A);
  const R = steps[steps.length - 1].M, n = A[0].length;
  const free = Array.from({ length: n }, (_, j) => j).filter((j) => !pivots.includes(j));
  return free.map((f) => {
    const x = Array(n).fill(0);
    x[f] = 1;
    pivots.forEach((p, i) => { x[p] = -R[i][f]; });
    return x;
  });
}

/** The four fundamental subspaces of a matrix, their dimensions, and bases computed by elimination. */
export function FourSubspacesViz() {
  const [k, setK] = useState(0);
  const A = PRESETS[k].A, m = A.length, n = A[0].length;
  const { steps, pivots } = rrefSteps(A);
  const R = steps[steps.length - 1].M;
  const r = pivots.length;
  const row = R.slice(0, r), col = pivots.map((j) => A.map((rw) => rw[j]));
  const nul = nullBasis(A), lnul = nullBasis(T(A));
  const vec = (v: number[]) => `(${v.map(fmt).join(", ")})`;
  const box = (title: string, dim: number, basis: number[][], where: string) => (
    <div className="gb-group" style={{ minWidth: 0 }}>
      <div className="gb-head">{title}</div>
      <p className="viz-caption" style={{ margin: "4px 0" }}>in ℝ<sup>{where}</sup>, dimension <b>{dim}</b></p>
      <p className="mono" style={{ fontSize: 12.5, overflowWrap: "anywhere", margin: 0 }}>{basis.length ? basis.map(vec).join(", ") : "only the zero vector"}</p>
    </div>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Matrix">
        {PRESETS.map((p, i) => <button key={p.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>{p.name}</button>)}
      </div>
      <div className="mat-row"><MatrixView M={A} label="A" /><MatrixView M={R} label="rref(A)" cols={pivots} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        {box("Row space C(Aᵀ)", r, row, String(n))}
        {box("Column space C(A)", r, col, String(m))}
        {box("Null space N(A)", n - r, nul, String(n))}
        {box("Left null space N(Aᵀ)", m - r, lnul, String(m))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A is {m} × {n} with rank r = {r}. The row space and null space live in ℝ<sup>{n}</sup> and their dimensions add to n = {n}; the column space and left null space live in ℝ<sup>{m}</sup> and add to m = {m}. Check: every null-space vector has dot product 0 with every row-space vector.
      </figcaption>
    </figure>
  );
}
