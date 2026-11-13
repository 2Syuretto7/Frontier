"use client";

import { useState } from "react";

type Kind = 0 | 1 | 2;
const F = ["scalar f", "vector y ∈ ℝᵐ", "matrix Y (m × n)"];
const X = ["scalar x", "vector x ∈ ℝⁿ", "matrix X (p × q)"];
const FS = [[], ["m"], ["m", "n"]];
const XS = [[], ["n"], ["p", "q"]];

function shapeOf(dims: string[]) {
  if (dims.length === 0) return "a number";
  if (dims.length === 1) return `a vector of length ${dims[0]}`;
  if (dims.length === 2) return `${dims[0]} × ${dims[1]}`;
  return `an array of shape ${dims.join(" × ")}`;
}

/** The shape of a derivative depends on what is differentiated by what, and on a layout convention. */
export function LayoutViz() {
  const [fi, setFi] = useState<Kind>(1);
  const [xi, setXi] = useState<Kind>(1);
  const fd = FS[fi], xd = XS[xi];
  const num = [...fd, ...xd];
  const den = [...xd, ...fd];
  let note: string;
  if (fi === 0 && xi === 0) note = "The ordinary derivative: a single number. Layouts only matter once vectors appear.";
  else if (fi === 0) note = "A scalar by a vector or matrix: the convention in machine learning is to give the gradient the same shape as the input, so it can be subtracted from it in gradient descent. That is the denominator layout.";
  else if (xi === 0) note = "A vector or matrix by a scalar: the derivative has the shape of the output, entry by entry.";
  else if (fi === 1 && xi === 1) note = "The Jacobian in numerator layout is m × n, one row per output, as in this course. Denominator layout is its transpose, n × m. Papers use both, so check before copying a formula.";
  else note = "Once matrices are involved on both sides the derivative has four indices. Rather than store it, write the differential dY in terms of dX, or flatten both with vec and use an mn × pq Jacobian.";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <span className="viz-label" style={{ minWidth: 70 }}>output</span>
        {F.map((s, i) => (
          <button key={s} type="button" className="seg" aria-pressed={fi === i} onClick={() => setFi(i as Kind)}>{s}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <span className="viz-label" style={{ minWidth: 70 }}>input</span>
        {X.map((s, i) => (
          <button key={s} type="button" className="seg" aria-pressed={xi === i} onClick={() => setXi(i as Kind)}>{s}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 14, lineHeight: 1.9, margin: "10px 0", overflowWrap: "anywhere" }}>
        <div>numerator layout (output indices first): {shapeOf(num)}</div>
        <div>denominator layout (input indices first): {shapeOf(den)}</div>
        <div style={{ color: "var(--text-muted)" }}>entries: {num.length === 0 ? "1" : num.join("·")}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{note}</figcaption>
    </figure>
  );
}
