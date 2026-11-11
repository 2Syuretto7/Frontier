"use client";

import { useState } from "react";

const TF = (b: boolean) => (b ? "T" : "F");

/** The five connectives, evaluated for whichever truth values you give P and Q. */
export function ConnectiveViz() {
  const [p, setP] = useState(true);
  const [q, setQ] = useState(false);
  const rows: { sym: string; name: string; reads: string; v: boolean }[] = [
    { sym: "¬P", name: "negation", reads: "not P", v: !p },
    { sym: "P ∧ Q", name: "conjunction", reads: "P and Q", v: p && q },
    { sym: "P ∨ Q", name: "disjunction", reads: "P or Q (or both)", v: p || q },
    { sym: "P → Q", name: "conditional", reads: "if P then Q", v: !p || q },
    { sym: "P ↔ Q", name: "biconditional", reads: "P if and only if Q", v: p === q },
  ];

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className={p ? "btn btn-primary" : "btn"} aria-pressed={p} onClick={() => setP(!p)}>P is {p ? "true" : "false"}</button>
        <button type="button" className={q ? "btn btn-primary" : "btn"} aria-pressed={q} onClick={() => setQ(!q)}>Q is {q ? "true" : "false"}</button>
      </div>
      <table className="table" style={{ marginTop: 16, marginBottom: 8 }}>
        <thead><tr><th>Statement</th><th>Connective</th><th>Read as</th><th>Value</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sym}>
              <td className="mono">{r.sym}</td>
              <td>{r.name}</td>
              <td>{r.reads}</td>
              <td className={`mono viz-verdict viz-verdict-${r.v ? "right" : "wrong"}`}>{TF(r.v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {!p
          ? <>With P false, <span className="mono">P → Q</span> is true whatever Q is: a promise &ldquo;if P then Q&rdquo; cannot be broken when P never happens.</>
          : !q
            ? <>This is the only row where <span className="mono">P → Q</span> is false: P happened and Q did not, so the promise is broken.</>
            : <>Both true: every connective here except negation comes out true.</>}
      </figcaption>
    </figure>
  );
}
