"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const STEPS: { say: string; f: (v: number) => number; algebra: string }[] = [
  { say: "Think of a number", f: (v) => v, algebra: "n" },
  { say: "Double it", f: (v) => 2 * v, algebra: "2n" },
  { say: "Add 6", f: (v) => v + 6, algebra: "2n + 6" },
  { say: "Halve it", f: (v) => v / 2, algebra: "n + 3" },
  { say: "Take away the number you first thought of", f: () => NaN, algebra: "3" },
];

/** The same trick run on a particular number and on "any number" n, side by side. */
export function ThinkOfNumberViz() {
  const [n, setN] = useState(17);
  const [shown, setShown] = useState(1);
  const values: number[] = [];
  let v = n;
  for (let i = 0; i < STEPS.length; i++) {
    v = i === STEPS.length - 1 ? values[i - 1] - n : STEPS[i].f(v);
    values.push(v);
  }

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-stepper">
          <span className="viz-stepper-label">Your number</span>
          <input className="input mono" style={{ width: 96, height: 32 }} type="number" value={n}
            onChange={(e) => { const x = Number(e.target.value); if (Number.isFinite(x)) setN(x); }} />
        </label>
      </div>
      <table className="table" style={{ margin: "12px 0 8px" }}>
        <thead><tr><th>Instruction</th><th>With {fmtNum(n)}</th><th>With any number n</th></tr></thead>
        <tbody>
          {STEPS.slice(0, shown).map((s, i) => (
            <tr key={s.say}>
              <td>{s.say}</td>
              <td className="mono">{fmtNum(values[i])}</td>
              <td className="mono" style={{ color: "var(--accent)" }}>{s.algebra}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setShown((s) => Math.min(STEPS.length, s + 1))} disabled={shown === STEPS.length}>Next step</button>
        <button type="button" className="btn btn-ghost" onClick={() => setShown(1)} disabled={shown === 1}>Start again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {shown === STEPS.length
          ? "Any number you choose gives 3. The right-hand column explains why: the n cancels, so the answer cannot depend on it."
          : "Try a few different numbers, including a negative number or a fraction, and watch the right-hand column."}
      </figcaption>
    </figure>
  );
}
