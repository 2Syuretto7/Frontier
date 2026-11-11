"use client";

import { useState } from "react";

const U = Array.from({ length: 12 }, (_, i) => i + 1);
const SETS: { name: string; has: (n: number) => boolean }[] = [
  { name: "even numbers", has: (n) => n % 2 === 0 },
  { name: "{2, 4, 6, 8, 10, 12}", has: (n) => [2, 4, 6, 8, 10, 12].includes(n) },
  { name: "multiples of 4", has: (n) => n % 4 === 0 },
  { name: "divisors of 12", has: (n) => 12 % n === 0 },
  { name: "primes", has: (n) => [2, 3, 5, 7, 11].includes(n) },
  { name: "odd numbers", has: (n) => n % 2 === 1 },
];

/** Comparing two sets inside the universe 1 to 12: subset, equality, overlap or disjointness. */
export function SubsetViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(0);
  const A = SETS[a], B = SETS[b];
  const onlyA = U.filter((n) => A.has(n) && !B.has(n));
  const onlyB = U.filter((n) => B.has(n) && !A.has(n));
  const both = U.filter((n) => A.has(n) && B.has(n));

  const AsubB = onlyA.length === 0, BsubA = onlyB.length === 0;
  const row = (label: string, pick: number, set: (i: number) => void) => (
    <div className="viz-controls" style={{ flexWrap: "wrap" }}>
      <span className="viz-stepper-label" style={{ minWidth: 20 }}>{label}</span>
      {SETS.map((s, i) => (
        <button key={s.name} type="button" className={i === pick ? "btn btn-primary" : "btn"} aria-pressed={i === pick} onClick={() => set(i)}>{s.name}</button>
      ))}
    </div>
  );

  return (
    <figure className="viz">
      {row("A", a, setA)}
      {row("B", b, setB)}
      <div className="viz-remainders" style={{ marginTop: 16 }}>
        {U.map((n) => {
          const inA = A.has(n), inB = B.has(n);
          const style = inA && inB ? undefined : inA ? { borderColor: "var(--danger)", color: "var(--danger)" } : inB ? { borderStyle: "dashed" } : undefined;
          return <span key={n} className={`viz-chip mono ${inA && inB ? "is-on" : ""}`} style={style}>{n}</span>;
        })}
      </div>
      <p className="viz-verdict viz-verdict-right" style={{ margin: "8px 0 0" }}>Lit: in both. Red: in A only. Dashed: in B only. Plain: in neither.</p>
      <table className="table" style={{ marginTop: 12, marginBottom: 8 }}>
        <tbody>
          <tr><td className="mono">A ⊆ B</td><td className={`viz-verdict viz-verdict-${AsubB ? "info" : "wrong"}`}>{AsubB ? "true: every element of A is in B" : `false: ${onlyA[0]} is in A but not in B`}</td></tr>
          <tr><td className="mono">B ⊆ A</td><td className={`viz-verdict viz-verdict-${BsubA ? "info" : "wrong"}`}>{BsubA ? "true: every element of B is in A" : `false: ${onlyB[0]} is in B but not in A`}</td></tr>
          <tr><td className="mono">A = B</td><td className={`viz-verdict viz-verdict-${AsubB && BsubA ? "info" : "wrong"}`}>{AsubB && BsubA ? "true: each is a subset of the other" : "false"}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {AsubB && BsubA
          ? <>Two different descriptions, one set. Sets are equal when they have the same elements, however they are described.</>
          : both.length === 0
            ? <>A and B share no elements: they are <strong>disjoint</strong>.</>
            : AsubB || BsubA
              ? <>One set sits inside the other, but they are not equal.</>
              : <>The sets overlap in {both.join(", ")}, but neither contains the other.</>}
      </figcaption>
    </figure>
  );
}
