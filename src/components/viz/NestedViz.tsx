"use client";

import { useState } from "react";

const N = [1, 2, 3, 4, 5];
const S = 44;
const X0 = 70, Y0 = 40;

const RELATIONS: { label: string; r: (x: number, y: number) => boolean }[] = [
  { label: "x < y", r: (x, y) => x < y },
  { label: "x ≤ y", r: (x, y) => x <= y },
  { label: "x + y = 6", r: (x, y) => x + y === 6 },
  { label: "x ≠ y", r: (x, y) => x !== y },
  { label: "y divides x", r: (x, y) => x % y === 0 },
];

const FORMS = ["∀x ∃y", "∃y ∀x", "∀x ∀y", "∃x ∃y"] as const;

/** A relation on {1, …, 5} drawn as a grid, with the four ways of quantifying both variables. */
export function NestedViz() {
  const [k, setK] = useState(2);
  const [f, setF] = useState(0);
  const R = RELATIONS[k].r;
  const rowOk = N.map((x) => N.some((y) => R(x, y)));
  const colOk = N.map((y) => N.every((x) => R(x, y)));
  const all = N.every((x) => N.every((y) => R(x, y)));
  const any = N.some((x) => N.some((y) => R(x, y)));
  const truth = [rowOk.every(Boolean), colOk.some(Boolean), all, any][f];
  const goodCol = colOk.indexOf(true);
  const badRow = rowOk.indexOf(false);

  const reading = [
    "every row contains at least one lit cell: for each x you may choose y after seeing x.",
    "a single column is lit all the way down: one y must work for every x at once.",
    "every cell is lit.",
    "at least one cell is lit.",
  ][f];

  let detail = "";
  if (f === 0) detail = truth ? "Every row has a lit cell, so it is true." : `Row x = ${N[badRow]} has no lit cell, so it is false.`;
  if (f === 1) detail = truth ? `Column y = ${N[goodCol]} is lit all the way down, so it is true.` : `Every column has a gap, so it is false${rowOk.every(Boolean) ? ", even though every row has a lit cell" : ""}.`;
  if (f === 2) detail = truth ? "Every cell is lit, so it is true." : "Some cell is dark, so it is false.";
  if (f === 3) detail = truth ? "Some cell is lit, so it is true." : "No cell is lit, so it is false.";

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <span className="viz-stepper-label">R(x, y)</span>
        {RELATIONS.map((r, i) => (
          <button key={r.label} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">{r.label}</span></button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <span className="viz-stepper-label">Statement</span>
        {FORMS.map((form, i) => (
          <button key={form} type="button" className={i === f ? "btn btn-primary" : "btn"} aria-pressed={i === f} onClick={() => setF(i)}><span className="mono">{form} R(x, y)</span></button>
        ))}
      </div>
      <svg viewBox="0 0 620 272" role="img" aria-label={`Grid of the relation ${RELATIONS[k].label} on 1 to 5`}>
        <text x={X0 + 2.5 * S} y={Y0 - 22} textAnchor="middle" className="viz-label">y</text>
        <text x={X0 - 40} y={Y0 + 2.5 * S + 4} textAnchor="middle" className="viz-label">x</text>
        {N.map((y, j) => (
          <text key={`c${y}`} x={X0 + j * S + S / 2} y={Y0 - 6} textAnchor="middle" className="plot-tick">{y}</text>
        ))}
        {N.map((x, i) => (
          <g key={x}>
            <text x={X0 - 14} y={Y0 + i * S + S / 2 + 4} textAnchor="middle" className={f === 0 && !rowOk[i] ? "viz-label is-on" : "plot-tick"} style={f === 0 && !rowOk[i] ? { fill: "var(--danger)" } : undefined}>{x}</text>
            {N.map((y, j) => (
              <rect key={y} x={X0 + j * S} y={Y0 + i * S} width={S} height={S} className={R(x, y) ? "viz-cell is-on" : "viz-cell"} />
            ))}
          </g>
        ))}
        {f === 1 && goodCol >= 0 && (
          <rect x={X0 + goodCol * S} y={Y0} width={S} height={5 * S} fill="none" stroke="var(--accent)" strokeWidth={3} />
        )}
        {f === 0 && badRow >= 0 && (
          <rect x={X0} y={Y0 + badRow * S} width={5 * S} height={S} fill="none" stroke="var(--danger)" strokeWidth={3} />
        )}
        <text x={X0 + 5 * S + 40} y={Y0 + 30} className="viz-label">
          <tspan className="mono">{FORMS[f]} ({RELATIONS[k].label})</tspan>
        </text>
        <text x={X0 + 5 * S + 40} y={Y0 + 58} className={truth ? "viz-label is-on" : "viz-label"} style={truth ? undefined : { fill: "var(--danger)", fontWeight: 600 }}>
          {truth ? "true" : "false"}
        </text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Lit cells are the pairs with <span className="mono">R(x, y)</span>. The statement asks that {reading} {detail}
      </figcaption>
    </figure>
  );
}
