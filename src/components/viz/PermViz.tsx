"use client";

import { useState } from "react";
import { T, mul, type Mat } from "./la";
import { MatrixView } from "./MatrixView";

const A: Mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const ORDERS = [[0, 1, 2], [1, 0, 2], [2, 0, 1], [2, 1, 0]];

/** Permutation matrices reorder rows; their transposes undo them; the transpose itself swaps rows and columns. */
export function PermViz() {
  const [o, setO] = useState(1);
  const [tr, setTr] = useState(false);
  const order = ORDERS[o];
  const P: Mat = order.map((r) => [0, 1, 2].map((j) => (j === r ? 1 : 0)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="New order of rows">
        {ORDERS.map((x, i) => <button key={i} type="button" className={i === o ? "btn btn-primary" : "btn"} aria-pressed={i === o} onClick={() => setO(i)}>rows {x.map((r) => r + 1).join(", ")}</button>)}
      </div>
      <div className="mat-row">
        <MatrixView M={P} label="P" /><span className="mat-op">×</span><MatrixView M={A} label="A" /><span className="mat-op">=</span><MatrixView M={mul(P, A)} label="PA" />
      </div>
      <div className="mat-row">
        <MatrixView M={T(P)} label="Pᵀ" /><span className="mat-op">×</span><MatrixView M={P} label="P" /><span className="mat-op">=</span><MatrixView M={mul(T(P), P)} label="PᵀP" />
      </div>
      <div className="viz-controls" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={() => setTr(!tr)}>{tr ? "Hide" : "Show"} Aᵀ</button>
      </div>
      {tr && <div className="mat-row"><MatrixView M={T(A)} label="Aᵀ" /></div>}
      <figcaption className="viz-caption" aria-live="polite">
        P is the identity with its rows in the order {order.map((r) => r + 1).join(", ")}, so PA has the rows of A in that order. Its transpose puts them back: PᵀP = I, so P⁻¹ = Pᵀ.{tr ? " The transpose Aᵀ turns each row of A into a column: the entry in row i, column j moves to row j, column i." : ""}
      </figcaption>
    </figure>
  );
}
