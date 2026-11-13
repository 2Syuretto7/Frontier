"use client";

import { useState } from "react";

const CODE = [
  "def normalise(xs):",
  "    total = 0",
  "    for x in xs:",
  "        total += x",
  "    mean = total / len(xs)",
  "    var = sum((x - mean) ** 2 for x in xs) / len(xs)",
  "    return [(x - mean) / var ** 0.5 for x in xs]",
];

type State = { line: number; vars: [string, string][] };
const XS: [string, string] = ["xs", "[3.0, 3.0, 3.0]"];
const TRACE: State[] = [
  { line: 2, vars: [XS] },
  { line: 3, vars: [XS, ["total", "0"]] },
  { line: 4, vars: [XS, ["total", "0"], ["x", "3.0"]] },
  { line: 3, vars: [XS, ["total", "3.0"], ["x", "3.0"]] },
  { line: 4, vars: [XS, ["total", "3.0"], ["x", "3.0"]] },
  { line: 3, vars: [XS, ["total", "6.0"], ["x", "3.0"]] },
  { line: 4, vars: [XS, ["total", "6.0"], ["x", "3.0"]] },
  { line: 3, vars: [XS, ["total", "9.0"], ["x", "3.0"]] },
  { line: 5, vars: [XS, ["total", "9.0"], ["x", "3.0"]] },
  { line: 6, vars: [XS, ["total", "9.0"], ["x", "3.0"], ["mean", "3.0"]] },
  { line: 7, vars: [XS, ["total", "9.0"], ["x", "3.0"], ["mean", "3.0"], ["var", "0.0"]] },
];

/** A pdb session on normalise([3.0, 3.0, 3.0]): step with next, or continue to the crash and look around. */
export function PdbViz() {
  const [k, setK] = useState(0);
  const crashed = k === TRACE.length;
  const s = TRACE[Math.min(k, TRACE.length - 1)];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setK(k + 1)} disabled={crashed}>n (next line)</button>
        <button type="button" className="btn" onClick={() => setK(TRACE.length)} disabled={crashed}>c (continue)</button>
        <button type="button" className="btn" onClick={() => setK(0)} disabled={k === 0}>restart</button>
      </div>
      <pre className="mono" style={{ fontSize: 13, margin: "8px 0", overflowX: "auto" }}>
        {CODE.map((l, i) => (
          <div key={i} style={{ background: s.line === i + 1 ? (crashed ? "color-mix(in srgb, var(--danger) 18%, transparent)" : "var(--accent-soft)") : undefined }}>
            <span style={{ color: "var(--text-faint)" }}>{s.line === i + 1 ? "->" : "  "} {i + 1} </span>{l}
          </div>
        ))}
      </pre>
      <div className="mono" style={{ fontSize: 13, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
        {s.vars.map(([n, v]) => <span key={n}>(Pdb) p {n} <strong>{v}</strong></span>)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {crashed
          ? "ZeroDivisionError: float division by zero. In the post-mortem debugger every local is still there: var is 0.0 because all inputs are equal. The bug is the missing guard, not the arithmetic."
          : k === 0
            ? "Paused at breakpoint() before line 2. The arrow marks the line about to run."
            : `About to run line ${s.line}.`}
      </figcaption>
    </figure>
  );
}
