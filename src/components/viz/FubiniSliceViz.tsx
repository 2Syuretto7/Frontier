"use client";

import { useState } from "react";

// D = {0 ≤ y ≤ x ≤ 1}, f(x, y) = x y; exact integral 1/8.
const S = 240, P = 20;
const px = (x: number) => P + x * (S - 2 * P);
const py = (y: number) => S - P - y * (S - 2 * P);

/** Fubini on a triangle: slice vertically (dy inside) or horizontally (dx inside); the limits change, the answer does not. */
export function FubiniSliceViz() {
  const [order, setOrder] = useState<"dydx" | "dxdy">("dydx");
  const [t, setT] = useState(0.6);
  const vertical = order === "dydx";
  // inner integral as a function of the outer variable
  const inner = (s: number) => (vertical ? (s * s * s) / 2 : (s * (1 - s * s)) / 2);
  const W2 = 220, H2 = 120;
  const gx = (s: number) => 24 + s * (W2 - 34);
  const gy = (v: number) => H2 - 18 - (v / 0.5) * (H2 - 30);
  const curve = Array.from({ length: 51 }, (_, k) => `${gx(k / 50).toFixed(1)},${gy(inner(k / 50)).toFixed(1)}`).join(" ");
  const area = Array.from({ length: 51 }, (_, k) => k / 50).filter((s) => s <= t);
  const fill = `${gx(0)},${gy(0)} ${area.map((s) => `${gx(s).toFixed(1)},${gy(inner(s)).toFixed(1)}`).join(" ")} ${gx(t)},${gy(0)}`;
  const so_far = vertical ? t ** 4 / 8 : t * t / 4 - t ** 4 / 8;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={vertical} onClick={() => setOrder("dydx")}>∫₀¹ ∫₀ˣ f dy dx</button>
        <button type="button" className="seg" aria-pressed={!vertical} onClick={() => setOrder("dxdy")}>∫₀¹ ∫ᵧ¹ f dx dy</button>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "48%", minWidth: 160, maxWidth: 260 }} role="img" aria-label="The triangle and one slice">
          <polygon points={`${px(0)},${py(0)} ${px(1)},${py(0)} ${px(1)},${py(1)}`} fill="var(--accent-soft)" stroke="var(--accent)" />
          {vertical
            ? <line x1={px(t)} y1={py(0)} x2={px(t)} y2={py(t)} stroke="var(--danger)" strokeWidth={3} />
            : <line x1={px(t)} y1={py(t)} x2={px(1)} y2={py(t)} stroke="var(--danger)" strokeWidth={3} />}
          <text x={px(0.5)} y={S - 4} textAnchor="middle" className="viz-label">x</text>
          <text x={6} y={py(0.5)} className="viz-label">y</text>
        </svg>
        <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: "48%", minWidth: 160, maxWidth: 260 }} role="img" aria-label="Inner integral against the outer variable">
          <polygon points={fill} fill="var(--accent-soft)" />
          <polyline points={curve} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <line x1={gx(0)} y1={gy(0)} x2={gx(1)} y2={gy(0)} stroke="var(--border)" />
          <circle cx={gx(t)} cy={gy(inner(t))} r={4} fill="var(--danger)" />
          <text x={gx(1)} y={H2 - 4} textAnchor="end" className="viz-label">{vertical ? "x" : "y"}</text>
          <text x={gx(0)} y={12} className="viz-label">inner integral</text>
        </svg>
      </div>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono" style={{ minWidth: 60 }}>{vertical ? "x" : "y"} = {t.toFixed(2)}</span>
        <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        {vertical ? `∫₀^${t.toFixed(2)} x y dy = x³/2 = ${inner(t).toFixed(4)}` : `∫_${t.toFixed(2)}^1 x y dx = y(1 − y²)/2 = ${inner(t).toFixed(4)}`}; shaded area so far {so_far.toFixed(4)} of 0.1250
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        f(x, y) = xy on the triangle 0 ≤ y ≤ x ≤ 1. Each slice gives an inner integral, a function of the outer variable;
        integrating that function adds up the slices. {vertical ? "Vertical slices run from y = 0 to y = x." : "Horizontal slices run from x = y to x = 1."} Both orders give 1/8.
      </figcaption>
    </figure>
  );
}
