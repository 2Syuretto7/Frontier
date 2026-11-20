"use client";

import { useState } from "react";

const ITEM =
  "a train leaves the station at nine and travels at sixty miles per hour while a second train leaves two hours later at eighty miles per hour".split(
    " ",
  );
const EDIT_ORDER = [14, 6, 22, 2, 18, 10]; // positions changed in the leaked copy, in order
const EDITS = [0, 1, 2, 3, 6];
const NS = [5, 8, 13];

/** Positions of the item covered by n-grams that also occur in the edited copy. */
export function shared(n: number, k: number) {
  const edited = new Set(EDIT_ORDER.slice(0, k));
  const covered = new Set<number>();
  let count = 0;
  for (let i = 0; i + n <= ITEM.length; i++) {
    let ok = true;
    for (let j = i; j < i + n; j++) if (edited.has(j)) ok = false;
    if (ok) {
      count++;
      for (let j = i; j < i + n; j++) covered.add(j);
    }
  }
  return { count, covered, edited, total: ITEM.length - n + 1 };
}

export function ContaminationViz() {
  const [ki, setKi] = useState(1);
  const [ni, setNi] = useState(2);
  const n = NS[ni],
    k = EDITS[ki];
  const { count, covered, edited, total } = shared(n, k);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">edits</span>
          <div
            className="segmented"
            role="group"
            aria-label="Words changed in the leaked copy"
          >
            {EDITS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={ki === j}
                onClick={() => setKi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">n</span>
          <div className="segmented" role="group" aria-label="N-gram length">
            {NS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={ni === j}
                onClick={() => setNi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p
        className="mono"
        style={{
          fontSize: 13,
          lineHeight: 1.9,
          margin: "8px 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "2px 6px",
        }}
      >
        {ITEM.map((w, i) => (
          <span
            key={i}
            style={{
              padding: "0 3px",
              borderRadius: 3,
              background: covered.has(i) ? "var(--accent-soft)" : "transparent",
              color: edited.has(i) ? "var(--danger)" : "var(--text)",
              textDecoration: edited.has(i) ? "line-through" : "none",
            }}
          >
            {w}
          </span>
        ))}
      </p>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {count} of {total} {n}-grams still match;{" "}
        {count > 0 ? "the copy is flagged" : "the copy is missed"}
      </div>
      <figcaption className="viz-caption">
        A benchmark question and a leaked copy of it in the training data with
        some words changed (struck through in red). Shaded words lie inside at
        least one n-gram that still matches exactly. Each edit breaks every
        n-gram that contains it, so long n-grams and a few scattered edits are
        enough to hide a copy.
      </figcaption>
    </figure>
  );
}
