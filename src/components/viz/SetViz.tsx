"use client";

import { useState } from "react";

const A = ["Asha", "Kabir", "Meera", "Ravi"];
const B = ["Kabir", "Ravi", "Zoya"];
const ALL = ["Asha", "Kabir", "Meera", "Ravi", "Zoya"];

const OPS: { op: string; label: string; keep: (a: boolean, b: boolean) => boolean; why: string }[] = [
  { op: "chess | music", label: "Union", keep: (a, b) => a || b, why: "The union holds everyone in at least one club." },
  { op: "chess & music", label: "Intersection", keep: (a, b) => a && b, why: "The intersection holds those in both clubs." },
  { op: "chess - music", label: "Difference", keep: (a, b) => a && !b, why: "The difference holds those in chess but not in music. Note that chess - music and music - chess differ." },
  { op: "chess ^ music", label: "Symmetric difference", keep: (a, b) => a !== b, why: "The symmetric difference holds those in exactly one of the two clubs." },
];

/** Combine two sets with Python's set operators. */
export function SetViz() {
  const [k, setK] = useState(0);
  const o = OPS[k];
  const result = ALL.filter((x) => o.keep(A.includes(x), B.includes(x)));
  const fmt = (xs: string[]) => (xs.length ? `{${xs.map((x) => `'${x}'`).join(", ")}}` : "set()");
  return (
    <figure className="viz">
      <p className="trace-out" style={{ margin: "0 0 4px" }}>{`chess = ${fmt(A)}`}</p>
      <p className="trace-out" style={{ margin: "0 0 16px" }}>{`music = ${fmt(B)}`}</p>
      <div className="segmented" role="group" aria-label="Operation">
        {OPS.map((x, i) => (
          <button key={x.op} type="button" className="seg" aria-pressed={i === k} onClick={() => setK(i)}>{x.label}</button>
        ))}
      </div>
      <div className="setviz">
        {ALL.map((x) => (
          <div key={x} className="setviz-row">
            <span className={result.includes(x) ? "viz-chip is-on" : "viz-chip"}>{x}</span>
            <span className="setviz-tag">{A.includes(x) ? "chess" : ""}</span>
            <span className="setviz-tag">{B.includes(x) ? "music" : ""}</span>
          </div>
        ))}
      </div>
      <p className="trace-out" style={{ marginTop: 12 }}>{`${o.op}  →  ${fmt(result)}`}</p>
      <figcaption className="viz-caption" aria-live="polite">{o.why} Python may print the members of a set in any order.</figcaption>
    </figure>
  );
}
