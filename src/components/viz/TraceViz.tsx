"use client";

import { useState } from "react";

export type TraceStep = {
  /** The line about to run, counted from 1. */
  line: number;
  /** Every variable and its value after the previous step, as Python would print it. */
  vars: Record<string, string>;
  /** Everything printed so far. */
  out?: string;
  /** A sentence explaining what this step does. */
  note: string;
};

/** Step through a program line by line, watching the variables and the output change. */
export function TraceViz({ code, steps, title }: { code: string; steps: TraceStep[]; title?: string }) {
  const [i, setI] = useState(0);
  const lines = code.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const s = steps[i];
  const prev = i > 0 ? steps[i - 1].vars : {};
  const names = Object.keys(s.vars);

  return (
    <figure className="viz">
      {title && <p className="viz-caption" style={{ marginTop: 0 }}>{title}</p>}
      <div className="trace">
        <pre className="trace-code" aria-label="Program">
          {lines.map((l, k) => (
            <span key={k} className={k + 1 === s.line ? "trace-line is-on" : "trace-line"}>
              <span className="trace-ln">{k + 1}</span>{l || " "}
            </span>
          ))}
        </pre>
        <div className="trace-side">
          <div className="trace-box">
            <h4>Variables</h4>
            {names.length === 0 ? <p className="trace-out" style={{ color: "var(--text-faint)" }}>none yet</p> : (
              <table className="trace-vars">
                <tbody>
                  {names.map((n) => (
                    <tr key={n} className={prev[n] !== s.vars[n] ? "is-new" : undefined}>
                      <td>{n}</td>
                      <td>{s.vars[n]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="trace-box">
            <h4>Output</h4>
            <p className="trace-out">{s.out ?? ""}</p>
          </div>
        </div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setI(0)} disabled={i === 0}>Start again</button>
        <button type="button" className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)} disabled={i === steps.length - 1}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Step {i + 1} of {steps.length}. {s.note}
      </figcaption>
    </figure>
  );
}
