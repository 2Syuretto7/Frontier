"use client";

import { useState } from "react";

type Env = { P: boolean; Q: boolean; R: boolean };
const imp = (a: boolean, b: boolean) => !a || b;

const FORMULAS: { label: string; vars: (keyof Env)[]; cols: { head: string; f: (e: Env) => boolean }[] }[] = [
  { label: "P ∨ ¬P", vars: ["P"], cols: [{ head: "¬P", f: (e) => !e.P }, { head: "P ∨ ¬P", f: (e) => e.P || !e.P }] },
  { label: "P ∧ ¬P", vars: ["P"], cols: [{ head: "¬P", f: (e) => !e.P }, { head: "P ∧ ¬P", f: (e) => e.P && !e.P }] },
  { label: "(P ∨ Q) → P", vars: ["P", "Q"], cols: [{ head: "P ∨ Q", f: (e) => e.P || e.Q }, { head: "(P ∨ Q) → P", f: (e) => imp(e.P || e.Q, e.P) }] },
  {
    label: "((P → Q) ∧ P) → Q", vars: ["P", "Q"],
    cols: [
      { head: "P → Q", f: (e) => imp(e.P, e.Q) },
      { head: "(P → Q) ∧ P", f: (e) => imp(e.P, e.Q) && e.P },
      { head: "((P → Q) ∧ P) → Q", f: (e) => imp(imp(e.P, e.Q) && e.P, e.Q) },
    ],
  },
  {
    label: "(P → Q) ∨ (Q → R)", vars: ["P", "Q", "R"],
    cols: [
      { head: "P → Q", f: (e) => imp(e.P, e.Q) },
      { head: "Q → R", f: (e) => imp(e.Q, e.R) },
      { head: "(P → Q) ∨ (Q → R)", f: (e) => imp(e.P, e.Q) || imp(e.Q, e.R) },
    ],
  },
];

function rowsFor(vars: (keyof Env)[]): Env[] {
  const n = vars.length;
  return Array.from({ length: 2 ** n }, (_, i) => {
    const e: Env = { P: false, Q: false, R: false };
    vars.forEach((v, j) => { e[v] = ((i >> (n - 1 - j)) & 1) === 0; }); // T before F, as in the usual layout
    return e;
  });
}

/** A truth table filled in one row at a time, ending with a verdict: tautology, contradiction or neither. */
export function TruthTableViz() {
  const [k, setK] = useState(3);
  const [shown, setShown] = useState(0);
  const F = FORMULAS[k];
  const rows = rowsFor(F.vars);
  const last = F.cols[F.cols.length - 1];
  const done = shown === rows.length;
  const outs = rows.map((e) => last.f(e));
  const verdict = outs.every(Boolean) ? "a tautology: true in every row" : outs.some(Boolean) ? "contingent: true in some rows and false in others" : "a contradiction: false in every row";
  const pick = (i: number) => { setK(i); setShown(0); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {FORMULAS.map((f, i) => (
          <button key={f.label} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => pick(i)}>
            <span className="mono">{f.label}</span>
          </button>
        ))}
      </div>
      <table className="table" style={{ marginTop: 16, marginBottom: 8 }}>
        <thead>
          <tr>
            {F.vars.map((v) => <th key={v} className="mono">{v}</th>)}
            {F.cols.map((c) => <th key={c.head} className="mono" style={{ textTransform: "none" }}>{c.head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={i}>
              {F.vars.map((v) => <td key={v} className="mono">{e[v] ? "T" : "F"}</td>)}
              {F.cols.map((c, j) => (
                <td key={c.head} className={`mono${i < shown && j === F.cols.length - 1 ? ` viz-verdict viz-verdict-${c.f(e) ? "right" : "wrong"}` : ""}`}>
                  {i < shown ? (c.f(e) ? "T" : "F") : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setShown(0)} disabled={shown === 0}>Clear</button>
        <button type="button" className="btn btn-primary" onClick={() => setShown(shown + 1)} disabled={done}>Fill the next row</button>
        <button type="button" className="btn" onClick={() => setShown(rows.length)} disabled={done}>Fill every row</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {F.vars.length} {F.vars.length === 1 ? "letter gives" : "letters give"} <span className="mono">2<sup>{F.vars.length}</sup> = {rows.length}</span> rows, one for each way of assigning truth values.{" "}
        {done ? <>The formula is {verdict}.</> : <>Work out each row yourself before you fill it in.</>}
      </figcaption>
    </figure>
  );
}
