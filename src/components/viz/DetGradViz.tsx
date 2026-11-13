"use client";

import { useState } from "react";

const S = 260, C = S / 2, SC = 34;
const px = (x: number) => C + x * SC;
const py = (y: number) => C - y * SC;
const NAMES = ["a", "b", "c", "d"];

/** The determinant of [[a, b], [c, d]] as a signed area, and its gradient, the cofactor matrix. */
export function DetGradViz() {
  const [m, setM] = useState([2, 1, 0.5, 1.5]);
  const [sel, setSel] = useState(0);
  const [a, b, c, d] = m;
  const det = a * d - b * c;
  const grad = [d, -c, -b, a]; // ∂det/∂(a, b, c, d) = cofactors
  const delta = 0.5;
  const after = m.map((v, i) => (i === sel ? v + delta : v));
  const detAfter = after[0] * after[3] - after[1] * after[2];
  const poly = (q: number[]) => {
    const pts: [number, number][] = [[0, 0], [q[0], q[2]], [q[0] + q[1], q[2] + q[3]], [q[1], q[3]]];
    return pts.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(" ");
  };
  const bump = (i: number, s: number) => setM(m.map((v, k) => (k === i ? Math.max(-3, Math.min(3, v + s)) : v)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}>
        {m.map((v, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <button type="button" className="seg" aria-pressed={sel === i} onClick={() => setSel(i)}>{NAMES[i]} = {v}</button>
            <button type="button" className="btn" aria-label={`decrease ${NAMES[i]}`} onClick={() => bump(i, -0.5)}>−</button>
            <button type="button" className="btn" aria-label={`increase ${NAMES[i]}`} onClick={() => bump(i, 0.5)}>+</button>
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto" }} role="img" aria-label="Parallelogram spanned by the columns of the matrix">
        <line x1={0} y1={py(0)} x2={S} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} y1={0} x2={px(0)} y2={S} stroke="var(--border)" />
        <polygon points={poly(after)} fill="none" stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1.5} />
        <polygon points={poly(m)} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.8, textAlign: "center", overflowWrap: "anywhere" }}>
        <div>det = ad − bc = {det.toFixed(2)}</div>
        <div>∇ det = [[d, −c], [−b, a]] = [[{grad[0]}, {grad[1]}], [{grad[2]}, {grad[3]}]]</div>
        <div style={{ color: "var(--danger)" }}>
          {NAMES[sel]} + {delta}: det becomes {detAfter.toFixed(2)}, change {(detAfter - det).toFixed(2)} = {delta} × {grad[sel]}
        </div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The columns (a, c) and (b, d) span the shaded parallelogram, of signed area det. The dashed one shows the effect of
        increasing the selected entry by {delta}. Because det is linear in each entry separately, the change is exactly the
        gradient entry times {delta}: the cofactor. {Math.abs(det) > 1e-9 ? `Here ∇ det = det · X⁻ᵀ, since det ≠ 0.` : "At det = 0 the matrix is singular and X⁻ᵀ does not exist, but the cofactor formula still gives the gradient."}
      </figcaption>
    </figure>
  );
}
