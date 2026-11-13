"use client";

import { useState } from "react";

const OPS: Record<string, { m: number[][]; text: string }> = {
  diagonalisable: { m: [[2, 1], [0, 0.5]], text: "Two eigenvalues, 2 and 0.5, so exactly two invariant lines: the eigenvector directions." },
  shear: { m: [[1, 1], [0, 1]], text: "A shear has one eigenvalue, 1, and only one eigenvector direction, so only the horizontal line is invariant." },
  rotation: { m: [[0.8, -0.6], [0.6, 0.8]], text: "A rotation moves every line: no real eigenvalue, so the only invariant subspaces of ℝ² are {0} and ℝ² itself. Over ℂ it has two eigenvalues, e^{±iθ}." },
  scalar: { m: [[1.5, 0], [0, 1.5]], text: "A multiple of the identity maps every line to itself: every subspace is invariant." },
};

/** A line through the origin and its image under an operator on ℝ²: the line is invariant exactly when the two coincide. */
export function InvariantLineViz() {
  const [op, setOp] = useState("diagonalisable");
  const [deg, setDeg] = useState(30);
  const T = OPS[op].m;
  const t = (deg * Math.PI) / 180;
  const d = [Math.cos(t), Math.sin(t)];
  const td = [T[0][0] * d[0] + T[0][1] * d[1], T[1][0] * d[0] + T[1][1] * d[1]];
  const cross = Math.abs(d[0] * td[1] - d[1] * td[0]) / Math.hypot(td[0], td[1]);
  const inv = cross < 0.03;
  const C = 110, S = 90;
  const ln = (v: number[], color: string, w: number, dash?: string) => {
    const n = Math.hypot(v[0], v[1]);
    const e = [(v[0] / n) * 1.3, (v[1] / n) * 1.3];
    return <line x1={C - e[0] * S} y1={C + e[1] * S} x2={C + e[0] * S} y2={C - e[1] * S} stroke={color} strokeWidth={w} strokeDasharray={dash} />;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(OPS).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={op === k} onClick={() => setOp(k)}>{k}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          line angle {deg}°
          <input type="range" min={0} max={179} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="angle of the line" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 220 220" style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="A line and its image under the operator">
        <circle cx={C} cy={C} r={S * 1.3} fill="none" stroke="var(--border)" />
        {ln(d, "var(--text)", 2)}
        {ln(td, inv ? "var(--accent)" : "var(--danger)", 2, "6 4")}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {inv ? "invariant: T maps this line into itself" : "not invariant: the image (dashed) is a different line"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid line is U = span(d); the dashed line is T(U) = span(Td). Turn the slider to hunt for invariant lines. {OPS[op].text}
      </figcaption>
    </figure>
  );
}
