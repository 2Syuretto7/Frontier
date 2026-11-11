"use client";

import { useState } from "react";
import { fmt, mul, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const A: Mat = [[1, 2, 0], [3, -1, 1]];
const B: Mat = [[2, 1], [0, 1], [4, -2]];
const C = mul(A, B);
type Way = "entry" | "column" | "row" | "outer";
const WAYS: { k: Way; name: string }[] = [
  { k: "entry", name: "row · column" },
  { k: "column", name: "columns" },
  { k: "row", name: "rows" },
  { k: "outer", name: "outer products" },
];

/** The same product AB computed four ways: entry by entry, column by column, row by row, and as a sum of outer products. */
export function MatMulViz() {
  const [w, setW] = useState<Way>("entry");
  const [i, setI] = useState(0);
  const max = w === "entry" ? 4 : w === "column" ? 2 : w === "row" ? 2 : 3;
  const k = Math.min(i, max - 1);
  const pick = (x: Way) => { setW(x); setI(0); };
  let note = "", hiA: { rows?: number[]; cols?: number[]; cells?: [number, number][] } = {}, hiB: typeof hiA = {}, hiC: typeof hiA = {};
  let part: Mat | null = null;
  if (w === "entry") {
    const r = Math.floor(k / 2), c = k % 2;
    hiA = { rows: [r] }; hiB = { cols: [c] }; hiC = { cells: [[r, c]] };
    note = `Entry (${r + 1}, ${c + 1}) is row ${r + 1} of A dotted with column ${c + 1} of B: ${A[r].map((a, j) => `${fmt(a)}·${fmt(B[j][c])}`).join(" + ")} = ${fmt(C[r][c])}.`;
  } else if (w === "column") {
    hiB = { cols: [k] }; hiC = { cols: [k] };
    note = `Column ${k + 1} of AB is A times column ${k + 1} of B: a combination of the columns of A with weights ${B.map((r) => fmt(r[k])).join(", ")}.`;
  } else if (w === "row") {
    hiA = { rows: [k] }; hiC = { rows: [k] };
    note = `Row ${k + 1} of AB is row ${k + 1} of A times B: a combination of the rows of B with weights ${A[k].map(fmt).join(", ")}.`;
  } else {
    hiA = { cols: [k] }; hiB = { rows: [k] };
    part = A.map((r) => B[k].map((b) => r[k] * b));
    note = `Column ${k + 1} of A times row ${k + 1} of B is a whole 2 × 2 matrix of rank one (shown). AB is the sum of the three such outer products.`;
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Way to multiply">
        {WAYS.map((x) => <button key={x.k} type="button" className={x.k === w ? "btn btn-primary" : "btn"} aria-pressed={x.k === w} onClick={() => pick(x.k)}>{x.name}</button>)}
      </div>
      <div className="mat-row">
        <MatrixView M={A} label="A" {...hiA} /><span className="mat-op">×</span><MatrixView M={B} label="B" {...hiB} /><span className="mat-op">=</span><MatrixView M={C} label="AB" {...hiC} />
      </div>
      {part && <div className="mat-row"><MatrixView M={part} label={`piece ${k + 1}`} /></div>}
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn btn-primary" onClick={() => setI((k + 1) % max)}>Next piece ({k + 1} of {max})</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{note}</figcaption>
    </figure>
  );
}
