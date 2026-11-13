"use client";

import { useState } from "react";

const LAYERS = [
  { label: "a good name", code: ["def masked_mean(x, mask, axis):"] },
  { label: "type hints", code: ["def masked_mean(x: np.ndarray, mask: np.ndarray, axis: int = -1) -> np.ndarray:"] },
  {
    label: "a docstring",
    code: [
      '    """Mean of x over axis, counting only positions where mask is True.',
      "",
      "    Args:",
      "        x: values, shape (..., n).",
      "        mask: booleans with the same shape as x.",
      "        axis: the axis to average over.",
      "    Returns:",
      "        x's shape without axis. Rows with no True entries give nan.",
    ],
  },
  {
    label: "an example",
    code: ["", "    >>> masked_mean(np.array([[1., 2., 9.]]), np.array([[True, True, False]]))", "    array([1.5])", '    """'],
  },
];

const QUESTIONS = [
  { q: "What does it compute, roughly?", at: 0 },
  { q: "What types go in and come out?", at: 1 },
  { q: "What shapes, and which axis is reduced?", at: 2 },
  { q: "What happens when a row is fully masked?", at: 2 },
  { q: "How exactly do I call it, and is that still true?", at: 3 },
];

/** Add documentation layer by layer and see which of a reader's questions get answered. */
export function DocLayersViz() {
  const [n, setN] = useState(1);
  const shown = LAYERS.slice(0, n);
  const code = n >= 2 ? [...LAYERS[1].code, ...shown.slice(2).flatMap((l) => l.code)] : LAYERS[0].code;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {LAYERS.map((l, i) => (
          <button key={l.label} type="button" className="seg" aria-pressed={i < n} onClick={() => setN(i + 1)}>{i + 1}. {l.label}</button>
        ))}
      </div>
      <pre className="mono" style={{ fontSize: 12.5, margin: "8px 0", overflowX: "auto" }}>{code.join("\n")}{n < 4 ? "\n    ..." : "\n    ..."}</pre>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {QUESTIONS.map((q) => {
          const ok = q.at < n;
          return (
            <li key={q.q} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "2px 0" }}>
              <span className={`seg ${ok ? "is-right" : "is-wrong"}`} style={{ flex: "none", padding: "0 8px" }}>{ok ? "answered" : "open"}</span>
              <span>{q.q}</span>
            </li>
          );
        })}
      </ul>
      <figcaption className="viz-caption" aria-live="polite">
        {n === 4
          ? "The example is also a test: doctest runs it, so if the function changes, the documentation fails instead of quietly becoming wrong."
          : "Each layer answers questions the reader would otherwise answer by reading the code, or by guessing."}
      </figcaption>
    </figure>
  );
}
