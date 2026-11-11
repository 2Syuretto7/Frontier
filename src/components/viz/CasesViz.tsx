"use client";

import { useState } from "react";

const EXPRS: { label: string; f: (n: number) => number }[] = [
  { label: "n²", f: (n) => n * n },
  { label: "n² + n", f: (n) => n * n + n },
  { label: "n³ − n", f: (n) => n * n * n - n },
];
const MODS = [2, 3, 4, 5, 6];
const mod = (a: number, m: number) => ((a % m) + m) % m;

/** Proof by cases on remainders: finitely many cases settle a question about every integer. */
export function CasesViz() {
  const [e, setE] = useState(0);
  const [m, setM] = useState(4);
  const E = EXPRS[e];
  const rows = Array.from({ length: m }, (_, r) => ({ r, v: mod(E.f(r), m) }));
  const values = Array.from(new Set(rows.map((x) => x.v))).sort((a, b) => a - b);
  const always0 = values.length === 1 && values[0] === 0;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <span className="viz-stepper-label">Expression</span>
        {EXPRS.map((x, i) => (
          <button key={x.label} type="button" className={i === e ? "btn btn-primary" : "btn"} aria-pressed={i === e} onClick={() => setE(i)}><span className="mono">{x.label}</span></button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <span className="viz-stepper-label">Divide by</span>
        {MODS.map((x) => (
          <button key={x} type="button" className={x === m ? "btn btn-primary" : "btn"} aria-pressed={x === m} onClick={() => setM(x)}>{x}</button>
        ))}
      </div>
      <table className="table" style={{ marginTop: 16, marginBottom: 8 }}>
        <thead><tr><th>Case</th><th>Remainder</th><th>An example</th></tr></thead>
        <tbody>
          {rows.map(({ r, v }) => {
            const n = m + r;
            return (
              <tr key={r}>
                <td className="mono">n = {m}k{r ? ` + ${r}` : ""}</td>
                <td className={`mono viz-verdict viz-verdict-${v === 0 ? "info" : "right"}`}>{v}</td>
                <td className="mono">{E.label.replaceAll("n", String(n))} = {E.f(n)}, remainder {mod(E.f(n), m)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Every integer is in exactly one of these {m} cases, so the table covers all integers at once.{" "}
        {always0
          ? <>In every case the remainder is 0, so {m} divides {E.label} for every integer n.</>
          : <>The only possible remainders of {E.label} on division by {m} are {values.length > 1 ? `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}` : values[0]}. {E.label === "n²" && m === 4 ? <>So a square is never 3 more than a multiple of 4, and a number such as 4003 cannot be a perfect square.</> : null}</>}
      </figcaption>
    </figure>
  );
}
