"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const S = 70, OX = 20, OY = 20;

/** The product rule as area: a rectangle of sides f and g grows by two strips and a small corner. */
export function ProductRuleViz() {
  const [f, setF] = useState(4), [g, setG] = useState(2.5);
  const [df, setDf] = useState(1), [dg, setDg] = useState(0.8);
  const W = (f + df) * S, H = (g + dg) * S;
  const slider = (label: string, v: number, set: (x: number) => void, min: number, max: number) => (
    <label className="viz-stepper-label" style={{ flex: 1, minWidth: 130 }}>
      {label} = <span className="mono">{fmtNum(v)}</span>
      <input type="range" className="viz-range" min={min} max={max} step={0.1} value={v} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
  const box = (x: number, y: number, w: number, h: number, fill: string, label: string) => (
    <g>
      <rect x={OX + x} y={OY + y} width={w} height={h} style={{ fill, stroke: "var(--border-strong)", strokeWidth: 1 }} />
      {w > 34 && h > 18 && <text x={OX + x + w / 2} y={OY + y + h / 2 + 4} textAnchor="middle" className="viz-label">{label}</text>}
    </g>
  );

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${5.2 * S + 2 * OX} ${3.9 * S + 2 * OY}`} role="img" aria-label={`A rectangle of sides ${f} and ${g}, grown by ${df} and ${dg}`}>
        {box(0, dg * S, f * S, g * S, "var(--accent-soft)", "f · g")}
        {box(0, 0, f * S, dg * S, "color-mix(in srgb, var(--accent) 35%, transparent)", "f · Δg")}
        {box(f * S, dg * S, df * S, g * S, "color-mix(in srgb, var(--accent) 35%, transparent)", "g · Δf")}
        {box(f * S, 0, df * S, dg * S, "color-mix(in srgb, var(--danger) 45%, transparent)", "Δf·Δg")}
        <text x={OX + (f * S) / 2} y={OY + H + 16} textAnchor="middle" className="plot-tick">f</text>
        <text x={OX + f * S + (df * S) / 2} y={OY + H + 16} textAnchor="middle" className="plot-tick">Δf</text>
        <text x={OX + W + 8} y={OY + dg * S + (g * S) / 2} className="plot-tick">g</text>
        <text x={OX + W + 8} y={OY + (dg * S) / 2 + 4} className="plot-tick">Δg</text>
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {slider("f", f, setF, 1, 4)}
        {slider("g", g, setG, 1, 3)}
        {slider("Δf", df, setDf, 0, 1)}
        {slider("Δg", dg, setDg, 0, 1)}
      </div>
      <p className="viz-verdict viz-verdict-right" style={{ margin: "8px 0 0" }}>
        Δ(fg) = f·Δg + g·Δf + Δf·Δg = {fmtNum(Number((f * dg).toFixed(2)))} + {fmtNum(Number((g * df).toFixed(2)))} + {fmtNum(Number((df * dg).toFixed(2)))} = {fmtNum(Number(((f + df) * (g + dg) - f * g).toFixed(2)))}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        When f and g change by Δf and Δg, the area fg grows by two strips and a corner. Shrink Δf and Δg together: the strips
        shrink in proportion, but the red corner, a product of two small changes, vanishes much faster. Dividing by Δx and
        letting it tend to 0 leaves (fg)′ = f g′ + g f′.
      </figcaption>
    </figure>
  );
}
