"use client";

import { useState } from "react";

const PS = ["1", "2", "∞"] as const;
type P = (typeof PS)[number];

/** The dual norm of y is the largest ⟨x, y⟩ over the unit ball of ‖·‖: the ball's support in direction y. */
export function DualNormViz() {
  const [p, setP] = useState<P>("1");
  const [deg, setDeg] = useState(25);
  const t = (deg * Math.PI) / 180;
  const y = [1.6 * Math.cos(t), 1.6 * Math.sin(t)];
  let x: number[];
  if (p === "1") x = Math.abs(y[0]) >= Math.abs(y[1]) ? [Math.sign(y[0]), 0] : [0, Math.sign(y[1])];
  else if (p === "∞") x = [Math.sign(y[0]) || 1, Math.sign(y[1]) || 1];
  else { const n = Math.hypot(y[0], y[1]); x = [y[0] / n, y[1] / n]; }
  const dual = x[0] * y[0] + x[1] * y[1];
  const dualName = p === "1" ? "‖y‖∞" : p === "2" ? "‖y‖₂" : "‖y‖₁";
  const C = 110, S = 60;
  const P2 = (a: number, b: number) => `${(C + a * S).toFixed(1)},${(C - b * S).toFixed(1)}`;
  const ball = p === "1" ? [P2(1, 0), P2(0, 1), P2(-1, 0), P2(0, -1)].join(" ") : p === "∞" ? [P2(1, 1), P2(-1, 1), P2(-1, -1), P2(1, -1)].join(" ") : "";
  // supporting line {z : ⟨z, y⟩ = dual}
  const ny = Math.hypot(y[0], y[1]);
  const foot = [(y[0] / ny) * (dual / ny), (y[1] / ny) * (dual / ny)];
  const tan = [-y[1] / ny, y[0] / ny];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PS.map((q) => (
          <button key={q} type="button" className="seg" aria-pressed={p === q} onClick={() => setP(q)}>‖·‖{q === "∞" ? "∞" : q === "1" ? "₁" : "₂"} ball</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          direction of y {deg}°
          <input type="range" min={0} max={359} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="direction of y" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 220 220" style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="A unit ball, a vector y and the point of the ball furthest in direction y">
        <defs><clipPath id="dnv-clip"><rect x={0} y={0} width={220} height={220} /></clipPath></defs>
        <g clipPath="url(#dnv-clip)">
          {p === "2" ? <circle cx={C} cy={C} r={S} fill="var(--accent-soft)" stroke="var(--accent)" /> : <polygon points={ball} fill="var(--accent-soft)" stroke="var(--accent)" />}
          <line x1={C + (foot[0] - 3 * tan[0]) * S} y1={C - (foot[1] - 3 * tan[1]) * S} x2={C + (foot[0] + 3 * tan[0]) * S} y2={C - (foot[1] + 3 * tan[1]) * S} stroke="var(--text-muted)" strokeDasharray="4 3" />
          <line x1={C} y1={C} x2={C + y[0] * S} y2={C - y[1] * S} stroke="var(--danger)" strokeWidth={2} />
          <circle cx={C + x[0] * S} cy={C - x[1] * S} r={5} fill="var(--text)" />
          <text x={C + y[0] * S + 4} y={C - y[1] * S} className="viz-label">y</text>
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        max ⟨x, y⟩ over the ball = {dual.toFixed(3)} = {dualName}, at x = ({x[0].toFixed(2)}, {x[1].toFixed(2)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Slide the dashed line, perpendicular to y, outwards until it last touches the ball: the touching point x is the
        maximiser and ⟨x, y⟩ is the dual norm. For the ℓ₁ ball it is a corner (one coordinate), giving ‖y‖∞; for the ℓ∞ ball
        a corner with all signs of y, giving ‖y‖₁; for the round ball the direction of y itself. The same x is the steepest
        descent direction for −y under that norm.
      </figcaption>
    </figure>
  );
}
