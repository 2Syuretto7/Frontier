"use client";

import { useState } from "react";

const J = [
  [1, 2, 0, -1],
  [0, 1, 3, 2],
  [2, -1, 1, 0],
];
const CYCLE = [0, 1, -1, 2];
const next = (x: number) => CYCLE[(CYCLE.indexOf(x) + 1) % CYCLE.length];

/** J v combines the columns of J; uᵀ J combines its rows. */
export function VjpJvpViz() {
  const [mode, setMode] = useState<"jvp" | "vjp">("jvp");
  const [v, setV] = useState([1, 0, 0, 0]);
  const [u, setU] = useState([1, 0, 0]);
  const Jv = J.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
  const uJ = J[0].map((_, j) => J.reduce((s, row, i) => s + u[i] * row[j], 0));
  const cell = 38;
  const weightCol = (j: number) => (mode === "jvp" ? v[j] !== 0 : false);
  const weightRow = (i: number) => (mode === "vjp" ? u[i] !== 0 : false);
  const VecBtn = ({ val, onClick, label }: { val: number; onClick: () => void; label: string }) => (
    <button type="button" className="seg" onClick={onClick} aria-label={label} style={{ width: cell, minWidth: cell, padding: "4px 0", fontFamily: "var(--font-mono, monospace)" }}>
      {val}
    </button>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="seg" aria-pressed={mode === "jvp"} onClick={() => setMode("jvp")}>J v (forward)</button>
        <button type="button" className="seg" aria-pressed={mode === "vjp"} onClick={() => setMode("vjp")}>uᵀ J (reverse)</button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap", margin: "10px 0" }}>
        {mode === "vjp" && (
          <div style={{ display: "grid", gap: 4 }}>
            {u.map((x, i) => (
              <VecBtn key={i} val={x} label={`u entry ${i + 1}`} onClick={() => setU(u.map((y, k) => (k === i ? next(y) : y)))} />
            ))}
          </div>
        )}
        <div className="mono" style={{ display: "grid", gridTemplateColumns: `repeat(4, ${cell}px)`, gap: 4 }}>
          {J.flatMap((row, i) =>
            row.map((a, j) => (
              <div key={`${i}-${j}`} style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border)", background: weightCol(j) || weightRow(i) ? "var(--accent-soft)" : "transparent" }}>
                {a}
              </div>
            )),
          )}
          {mode === "jvp" && v.map((x, j) => (
            <VecBtn key={`v${j}`} val={x} label={`v entry ${j + 1}`} onClick={() => setV(v.map((y, k) => (k === j ? next(y) : y)))} />
          ))}
        </div>
      </div>
      <div className="mono" style={{ textAlign: "center", fontSize: 14 }}>
        {mode === "jvp" ? `J v = [${Jv.join(", ")}]  (length 3)` : `uᵀ J = [${uJ.join(", ")}]  (length 4)`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Tap the {mode === "jvp" ? "entries of v, under the matrix," : "entries of u, left of the matrix,"} to change them.{" "}
        {mode === "jvp"
          ? "J v is a combination of the highlighted columns: the change in all 3 outputs when the 4 inputs move along v. Forward mode gives one of these per sweep."
          : "uᵀ J is a combination of the highlighted rows: how a weighting of the 3 outputs depends on each of the 4 inputs. Reverse mode gives one of these per sweep; with u = 1 and a single output, it is the gradient."}
      </figcaption>
    </figure>
  );
}
