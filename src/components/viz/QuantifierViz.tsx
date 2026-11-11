"use client";

import { useState } from "react";

const DOMAINS: { name: string; values: number[] }[] = [
  { name: "1 to 10", values: Array.from({ length: 10 }, (_, i) => i + 1) },
  { name: "−5 to 5", values: Array.from({ length: 11 }, (_, i) => i - 5) },
  { name: "halves, −2 to 2", values: Array.from({ length: 9 }, (_, i) => -2 + i / 2) },
];

const PREDICATES: { label: string; test: (x: number) => boolean }[] = [
  { label: "x² ≥ x", test: (x) => x * x >= x },
  { label: "x + 3 > 0", test: (x) => x + 3 > 0 },
  { label: "x² = 4", test: (x) => x * x === 4 },
  { label: "x² = 2", test: (x) => x * x === 2 },
];

function show(x: number) {
  const s = Number.isInteger(x) ? String(Math.abs(x)) : `${Math.abs(x * 2)}/2`;
  return x < 0 ? `−${s}` : s;
}

/** The same predicate under "for all" and "there exists", over three different domains. */
export function QuantifierViz() {
  const [d, setD] = useState(0);
  const [k, setK] = useState(0);
  const D = DOMAINS[d].values;
  const P = PREDICATES[k];
  const counter = D.find((x) => !P.test(x));
  const witness = D.find((x) => P.test(x));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <span className="viz-stepper-label">Domain</span>
        {DOMAINS.map((dm, i) => (
          <button key={dm.name} type="button" className={i === d ? "btn btn-primary" : "btn"} aria-pressed={i === d} onClick={() => setD(i)}>{dm.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <span className="viz-stepper-label">Predicate</span>
        {PREDICATES.map((p, i) => (
          <button key={p.label} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">{p.label}</span></button>
        ))}
      </div>
      <div className="viz-remainders" style={{ marginTop: 16 }} role="list" aria-label="Domain">
        {D.map((x) => (
          <span
            key={x}
            role="listitem"
            className={`viz-chip mono ${P.test(x) ? "is-on" : ""}`}
            style={x === counter ? { borderColor: "var(--danger)", color: "var(--danger)", fontWeight: 600 } : undefined}
          >
            {show(x)}
          </span>
        ))}
      </div>
      <table className="table" style={{ marginTop: 16, marginBottom: 8 }}>
        <tbody>
          <tr>
            <td className="mono">∀x, {P.label}</td>
            <td className={`viz-verdict viz-verdict-${counter === undefined ? "info" : "wrong"}`}>
              {counter === undefined ? "true: every element is lit" : `false: counterexample x = ${show(counter)}`}
            </td>
          </tr>
          <tr>
            <td className="mono">∃x, {P.label}</td>
            <td className={`viz-verdict viz-verdict-${witness === undefined ? "wrong" : "info"}`}>
              {witness === undefined ? "false: no element is lit" : `true: witness x = ${show(witness)}`}
            </td>
          </tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        One counterexample, marked in red, is enough to make &ldquo;for all&rdquo; false; one witness is enough to make
        &ldquo;there exists&rdquo; true. Change the domain and the same words can change their truth value.
      </figcaption>
    </figure>
  );
}
