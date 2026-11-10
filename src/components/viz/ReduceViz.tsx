"use client";

import { useState } from "react";

type Reduction = { expr: string; steps: { to: string; why: string }[] };

const EXPRS: Reduction[] = [
  {
    expr: "2 + 3 * 4 ** 2",
    steps: [
      { to: "2 + 3 * 16", why: "** binds most tightly, so 4 ** 2 is worked out first." },
      { to: "2 + 48", why: "Multiplication comes before addition." },
      { to: "50", why: "Finally the addition. The value of the whole expression is the int 50." },
    ],
  },
  {
    expr: "(7 + 5) // 4 % 2",
    steps: [
      { to: "12 // 4 % 2", why: "Brackets first." },
      { to: "3 % 2", why: "// and % have the same precedence, so they go from left to right. 12 // 4 is 3." },
      { to: "1", why: "3 % 2 is the remainder when 3 is divided by 2." },
    ],
  },
  {
    expr: "17 / 5 + 17 // 5",
    steps: [
      { to: "3.4 + 17 // 5", why: "/ is true division and always gives a float." },
      { to: "3.4 + 3", why: "// divides and rounds down to a whole number." },
      { to: "6.4", why: "An int added to a float gives a float." },
    ],
  },
  {
    expr: '"ab" * 2 + "c"',
    steps: [
      { to: '"abab" + "c"', why: "* with a string and an int repeats the string." },
      { to: '"ababc"', why: "+ with two strings joins them. The same symbols mean different things for different types." },
    ],
  },
  {
    expr: "10 - 4 > 5 or 9 % 4 == 1",
    steps: [
      { to: "6 > 5 or 9 % 4 == 1", why: "Arithmetic comes before comparison, and comparison before or." },
      { to: "True or 9 % 4 == 1", why: "6 > 5 is True." },
      { to: "True", why: "or needs only one true side. Its left side is True, so Python does not even look at the right side." },
    ],
  },
];

/** Reduce an expression one operation at a time, in Python's order. */
export function ReduceViz() {
  const [e, setE] = useState(0);
  const [k, setK] = useState(0);
  const r = EXPRS[e];
  const shown = [r.expr, ...r.steps.slice(0, k).map((s) => s.to)];
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Expression">
        {EXPRS.map((x, i) => (
          <button key={i} type="button" className="seg" aria-pressed={i === e} onClick={() => { setE(i); setK(0); }}>
            {`Expression ${i + 1}`}
          </button>
        ))}
      </div>
      <pre className="trace-code" style={{ marginTop: 16 }}>
        {shown.map((s, i) => (
          <span key={i} className={i === shown.length - 1 ? "trace-line is-on" : "trace-line"}>
            <span className="trace-ln">{i === 0 ? " " : "="}</span>{s}
          </span>
        ))}
      </pre>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setK(0)} disabled={k === 0}>Start again</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(k + 1)} disabled={k === r.steps.length}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {k === 0 ? "Predict the value before you step through." : r.steps[k - 1].why}
      </figcaption>
    </figure>
  );
}
