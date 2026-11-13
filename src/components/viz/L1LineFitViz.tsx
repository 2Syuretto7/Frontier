"use client";

import { useState } from "react";

const XS = [0, 1, 2, 3, 4, 5];
const BASE = [0.3, 1.1, 1.9, 3.2, 3.9, 5.1];

/** Least-absolute-deviation line fitting as a linear program: the best line passes through two data points, a vertex of the LP. */
export function L1LineFitViz() {
  const [out, setOut] = useState(9);
  const ys = BASE.map((y, i) => (i === 4 ? out : y));
  let best = { v: Infinity, a: 0, b: 0, i: 0, j: 1 };
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    const b = (ys[j] - ys[i]) / (XS[j] - XS[i]), a = ys[i] - b * XS[i];
    const v = XS.reduce((s, x, k) => s + Math.abs(a + b * x - ys[k]), 0);
    if (v < best.v - 1e-12) best = { v, a, b, i, j };
  }
  const mx = XS.reduce((s, x) => s + x, 0) / 6, my = ys.reduce((s, y) => s + y, 0) / 6;
  const lb = XS.reduce((s, x, k) => s + (x - mx) * (ys[k] - my), 0) / XS.reduce((s, x) => s + (x - mx) ** 2, 0);
  const la = my - lb * mx;
  const W = 300, H = 210;
  const X = (x: number) => 24 + (x / 5.4) * (W - 36);
  const Y = (y: number) => H - 18 - ((y + 1) / 12) * (H - 28);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          fifth point y = {out.toFixed(1)}
          <input type="range" min={-0.5} max={10.5} step={0.1} value={out} onChange={(e) => setOut(Number(e.target.value))} aria-label="height of the fifth point" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Data points with least-absolute-deviation and least-squares lines">
        {XS.map((x, k) => (
          <line key={k} x1={X(x)} x2={X(x)} y1={Y(ys[k])} y2={Y(best.a + best.b * x)} stroke="var(--accent)" strokeWidth={3} opacity={0.35} />
        ))}
        <line x1={X(0)} y1={Y(best.a)} x2={X(5.4)} y2={Y(best.a + best.b * 5.4)} stroke="var(--accent)" strokeWidth={2} />
        <line x1={X(0)} y1={Y(la)} x2={X(5.4)} y2={Y(la + lb * 5.4)} stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="5 3" />
        {XS.map((x, k) => (
          <circle key={k} cx={X(x)} cy={Y(ys[k])} r={k === best.i || k === best.j ? 5 : 3.5} fill={k === best.i || k === best.j ? "var(--text)" : "var(--text-muted)"} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        ℓ₁ line: y = {best.a.toFixed(2)} + {best.b.toFixed(2)}x, Σtᵢ = {best.v.toFixed(2)}; least squares: y = {la.toFixed(2)} + {lb.toFixed(2)}x
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Minimising Σ|aᵀxᵢ − yᵢ| is not smooth, but with one new variable per point it becomes the LP: minimise Σtᵢ subject to
        −tᵢ ≤ residualᵢ ≤ tᵢ. The bars show the tᵢ at the optimum. Because LP optima sit at vertices, the best ℓ₁ line
        passes exactly through two of the points (large dots), found here by checking every pair. Move the fifth point: the
        least-squares line (dashed red) is dragged along, while the ℓ₁ line ignores the outlier.
      </figcaption>
    </figure>
  );
}
