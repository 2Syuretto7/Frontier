"use client";

import { useState } from "react";

const S = 260, C = S / 2, R = 90;
const PS = [1, 1.5, 2, 3, 4, Infinity];

function pnorm(x: number, y: number, p: number) {
  if (p === Infinity) return Math.max(Math.abs(x), Math.abs(y));
  return (Math.abs(x) ** p + Math.abs(y) ** p) ** (1 / p);
}

/** The unit ball of the p-norm in the plane, and the norms of one point. */
export function NormBallViz() {
  const [pi, setPi] = useState(2);
  const [pt, setPt] = useState<[number, number]>([0.6, 0.8]);
  const p = PS[pi];
  const pts: string[] = [];
  for (let k = 0; k <= 360; k++) {
    const t = (k / 360) * 2 * Math.PI;
    const r = 1 / pnorm(Math.cos(t), Math.sin(t), p);
    pts.push(`${(C + R * r * Math.cos(t)).toFixed(1)},${(C - R * r * Math.sin(t)).toFixed(1)}`);
  }
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * S;
    const y = ((e.clientY - box.top) / box.height) * S;
    setPt([+((x - C) / R).toFixed(2), +((C - y) / R).toFixed(2)]);
  };
  const [x, y] = pt;
  const inside = pnorm(x, y, p) <= 1 + 1e-9;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PS.map((q, i) => (
          <button key={i} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>p = {q === Infinity ? "∞" : q}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto", cursor: "crosshair" }} onClick={onClick} role="img" aria-label="Unit ball of the chosen norm; tap to move the point">
        <line x1={0} y1={C} x2={S} y2={C} stroke="var(--border)" />
        <line x1={C} y1={0} x2={C} y2={S} stroke="var(--border)" />
        <polygon points={pts.join(" ")} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={C + R * x} cy={C - R * y} r={5} fill={inside ? "var(--accent)" : "var(--danger)"} />
        <text x={C + R + 4} y={C - 4} className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, display: "flex", flexWrap: "wrap", gap: "4px 16px", justifyContent: "center" }}>
        <span>x = ({x}, {y})</span>
        <span>‖x‖₁ = {pnorm(x, y, 1).toFixed(3)}</span>
        <span>‖x‖₂ = {pnorm(x, y, 2).toFixed(3)}</span>
        <span>‖x‖∞ = {pnorm(x, y, Infinity).toFixed(3)}</span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded set is every point with ‖x‖<sub>{p === Infinity ? "∞" : p}</sub> ≤ 1; the point is {inside ? "inside" : "outside"} it.
        Tap to move the point. As p grows the ball swells from a diamond to a square, so ‖x‖∞ ≤ ‖x‖₂ ≤ ‖x‖₁ for every x.
      </figcaption>
    </figure>
  );
}
