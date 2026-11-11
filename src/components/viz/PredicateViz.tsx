"use client";

import { useState } from "react";

const PREDICATES: { label: string; test: (x: number) => boolean }[] = [
  { label: "x is even", test: (x) => x % 2 === 0 },
  { label: "x is prime", test: (x) => x > 1 && Array.from({ length: x - 2 }, (_, i) => i + 2).every((d) => x % d !== 0) },
  { label: "x > 12", test: (x) => x > 12 },
  { label: "x² < 30", test: (x) => x * x < 30 },
  { label: "x divides 12", test: (x) => 12 % x === 0 },
];

const DOMAIN = Array.from({ length: 20 }, (_, i) => i + 1);

/** A predicate sorts a domain into the elements that satisfy it and those that do not. */
export function PredicateViz() {
  const [k, setK] = useState(1);
  const [x, setX] = useState(7);
  const P = PREDICATES[k];
  const truth = DOMAIN.filter(P.test);
  const at = P.test(x);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PREDICATES.map((p, i) => (
          <button key={p.label} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            <span className="mono">P(x): {p.label}</span>
          </button>
        ))}
      </div>
      <p className="viz-stepper-label" style={{ margin: "16px 0 8px" }}>Domain: the whole numbers 1 to 20. Lit numbers satisfy P.</p>
      <div className="viz-remainders" role="list" aria-label="Truth set">
        {DOMAIN.map((n) => (
          <button
            key={n}
            type="button"
            role="listitem"
            className={`viz-chip mono ${P.test(n) ? "is-on" : ""}`}
            style={{ cursor: "pointer", fontWeight: n === x ? 700 : undefined, outline: n === x ? "2px solid var(--text)" : undefined, outlineOffset: 1 }}
            onClick={() => setX(n)}
            aria-label={`x = ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        On its own, <span className="mono">P(x)</span> is neither true nor false. Fix x = {x} (click any number) and you get
        the statement <span className="mono">P({x})</span>: &ldquo;{P.label.replace("x", String(x))}&rdquo;, which is{" "}
        <strong>{at ? "true" : "false"}</strong>. The truth set is{" "}
        <span className="mono">{"{"}{truth.join(", ")}{"}"}</span>, with {truth.length} {truth.length === 1 ? "element" : "elements"}.
      </figcaption>
    </figure>
  );
}
