"use client";

import { useState } from "react";

type Step = { f: string; en: string; rule: string };

const CASES: { name: string; steps: Step[] }[] = [
  {
    name: "Not every swan is white",
    steps: [
      { f: "¬∀x W(x)", en: "It is not the case that every swan is white.", rule: "The statement to negate." },
      { f: "∃x ¬W(x)", en: "Some swan is not white.", rule: "¬∀ becomes ∃¬: to deny that all pass, name one that fails." },
    ],
  },
  {
    name: "No real number squares to −1",
    steps: [
      { f: "¬∃x (x² = −1)", en: "There is no real x with x² = −1.", rule: "The statement to negate." },
      { f: "∀x ¬(x² = −1)", en: "Every real x fails to satisfy x² = −1.", rule: "¬∃ becomes ∀¬: to deny a witness exists, every candidate must fail." },
      { f: "∀x (x² ≠ −1)", en: "Every real number has a square other than −1.", rule: "Tidy the inside: ¬(a = b) is a ≠ b." },
    ],
  },
  {
    name: "Not all primes are odd",
    steps: [
      { f: "¬∀x (P(x) → O(x))", en: "It is not true that every prime is odd.", rule: "The statement to negate. P: prime, O: odd." },
      { f: "∃x ¬(P(x) → O(x))", en: "Something is not a case of 'if prime then odd'.", rule: "¬∀ becomes ∃¬." },
      { f: "∃x (P(x) ∧ ¬O(x))", en: "Some prime is not odd. (Indeed: 2.)", rule: "¬(A → B) is A ∧ ¬B: a conditional fails only when A holds and B does not." },
    ],
  },
  {
    name: "There is no largest number",
    steps: [
      { f: "∀x ∃y (y > x)", en: "Every number has a bigger one. Now negate it.", rule: "The statement to negate." },
      { f: "¬∀x ∃y (y > x)", en: "It is not true that every number has a bigger one.", rule: "Put ¬ in front." },
      { f: "∃x ¬∃y (y > x)", en: "Some number has no bigger one.", rule: "¬∀ becomes ∃¬. The ¬ moves one quantifier inward." },
      { f: "∃x ∀y ¬(y > x)", en: "Some number is such that nothing is bigger than it.", rule: "¬∃ becomes ∀¬. The ¬ moves past the second quantifier." },
      { f: "∃x ∀y (y ≤ x)", en: "There is a largest number.", rule: "Tidy the inside: ¬(y > x) is y ≤ x. Each quantifier flipped as ¬ passed it." },
    ],
  },
];

/** Pushing a negation inward through quantifiers, one step at a time. */
export function NegationViz() {
  const [c, setC] = useState(3);
  const [s, setS] = useState(0);
  const steps = CASES[c].steps;
  const pick = (i: number) => { setC(i); setS(0); };

  return (
    <figure className="viz">
      <div className="choices" role="radiogroup" aria-label="Statement">
        {CASES.map((x, i) => (
          <label key={x.name} className={`choice ${i === c ? "is-picked" : ""}`}>
            <input type="radio" name="negation-case" checked={i === c} onChange={() => pick(i)} />
            <span>{x.name}</span>
          </label>
        ))}
      </div>
      <table className="table" style={{ marginTop: 16, marginBottom: 8 }}>
        <thead><tr><th>Step</th><th>Formula</th><th>In words</th></tr></thead>
        <tbody>
          {steps.slice(0, s + 1).map((st, i) => (
            <tr key={i} style={i === s ? { background: "var(--accent-soft)" } : undefined}>
              <td className="mono">{i + 1}</td>
              <td className="mono" style={{ whiteSpace: "nowrap" }}>{st.f}</td>
              <td>{st.en}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setS(Math.max(0, s - 1))} disabled={s === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setS(Math.min(steps.length - 1, s + 1))} disabled={s === steps.length - 1}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {steps[s].rule}
        {s === steps.length - 1 && <> The negation is finished: no ¬ stands in front of a quantifier.</>}
      </figcaption>
    </figure>
  );
}
