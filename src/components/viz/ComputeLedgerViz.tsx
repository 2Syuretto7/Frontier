"use client";

import { useState } from "react";

const RUNS: [string, number, boolean, string][] = [
  ["ladder", 22, false, "var(--code-function)"],
  ["data ablations", 9, false, "var(--code-number)"],
  ["main run", 104, true, "var(--accent)"],
  ["crashed main run", 18, false, "var(--danger)"],
  ["mid-training", 21, true, "var(--text)"],
  ["post-training", 27, true, "var(--success)"],
  ["evaluation", 8, true, "var(--text-muted)"],
];

export function ComputeLedgerViz() {
  const [all, setAll] = useState(true);
  const shown = RUNS.filter((r) => all || r[2]);
  const total = shown.reduce((s, r) => s + r[1], 0);
  const grand = RUNS.reduce((s, r) => s + r[1], 0);
  const final = RUNS.filter((r) => r[2]).reduce((s, r) => s + r[1], 0);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}
        role="group"
        aria-label="Which runs to count"
      >
        {(
          [
            [true, "all compute"],
            [false, "final model only"],
          ] as [boolean, string][]
        ).map(([v, l]) => (
          <button
            key={l}
            type="button"
            className={v === all ? "btn btn-primary" : "btn"}
            aria-pressed={v === all}
            onClick={() => setAll(v)}
          >
            {l}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          height: 28,
          marginTop: 12,
          border: "1px solid var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
        role="img"
        aria-label="GPU-hours by stage"
      >
        {shown.map(([name, h, , col]) => (
          <div
            key={name}
            style={{ width: `${(100 * h) / total}%`, background: col }}
            title={name}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          marginTop: 10,
        }}
      >
        {shown.map(([name, h, , col]) => (
          <span
            key={name}
            className="viz-label"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: col,
                display: "inline-block",
                borderRadius: 2,
              }}
            />
            {name}: {h}
          </span>
        ))}
      </div>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {total} GPU-hours shown; the final model&apos;s lineage is{" "}
        {((100 * final) / grand).toFixed(0)}% of all compute spent
      </p>
      <figcaption className="viz-caption">
        An illustrative compute ledger for a capstone-sized project, in
        GPU-hours. Reports that state only the final run&apos;s compute
        understate the cost of the result: the ladder, the ablations and the run
        that crashed were all needed to get there, and the technical report
        lists them.
      </figcaption>
    </figure>
  );
}
