"use client";

import { useState } from "react";

// X = a die roll, Y = number of heads in X fair coin tosses
const choose = (n: number, k: number) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c; };
const J = Array.from({ length: 6 }, (_, i) => Array.from({ length: 7 }, (_, y) => (y <= i + 1 ? choose(i + 1, y) / Math.pow(2, i + 1) / 6 : 0)));
const PY = Array.from({ length: 7 }, (_, y) => J.reduce((s, r) => s + r[y], 0));

/** A joint pmf as a grid, its marginals, and the conditional distribution of Y in one selected row. */
export function JointGridViz() {
  const [x, setX] = useState(4);
  const row = J[x - 1];
  const px = row.reduce((s, v) => s + v, 0);
  const cond = row.map((v) => v / px);
  const max = Math.max(...J.flat());
  const C = 34, W = 320;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 330`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Joint probability grid with marginal and conditional distributions">
        <text x={30} y={12} className="viz-label">y = number of heads →</text>
        {[0, 1, 2, 3, 4, 5, 6].map((y) => <text key={y} x={46 + y * C + C / 2} y={28} textAnchor="middle" className="viz-label">{y}</text>)}
        {J.map((r, i) => (
          <g key={i} onClick={() => setX(i + 1)} style={{ cursor: "pointer" }}>
            <text x={30} y={34 + i * C + C / 2 + 4} textAnchor="end" className="viz-label">x={i + 1}</text>
            {r.map((v, y) => (
              <rect key={y} x={46 + y * C} y={34 + i * C} width={C - 2} height={C - 2} fill="var(--accent)" opacity={v === 0 ? 0.04 : 0.12 + (0.85 * v) / max} stroke={i + 1 === x ? "var(--danger)" : "none"} strokeWidth={2} />
            ))}
          </g>
        ))}
        <text x={30} y={258} className="viz-label">marginal of Y</text>
        {PY.map((v, y) => <rect key={y} x={46 + y * C + 4} y={318 - v * 200} width={C - 10} height={v * 200} fill="var(--text-muted)" opacity={0.6} />)}
        {cond.map((v, y) => <rect key={y} x={46 + y * C + 12} y={318 - v * 100} width={C - 26} height={v * 100} fill="var(--danger)" opacity={0.85} />)}
      </svg>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          condition on X = {x}
          <input type="range" min={1} max={6} value={x} onChange={(e) => setX(Number(e.target.value))} aria-label="value of X to condition on" style={{ width: 140 }} />
        </label>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        P(X = {x}) = {px.toFixed(4)}; E[Y | X = {x}] = {cond.reduce((s, v, y) => s + v * y, 0).toFixed(2)}; E[Y] = {PY.reduce((s, v, y) => s + v * y, 0).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Roll a die to get X, then toss X fair coins and let Y be the number of heads. Each cell is P(X = x, Y = y), darker
        for larger. Summing each column gives the marginal of Y (grey bars). Taking one row and dividing by its total gives
        the conditional distribution of Y given X = x (red bars, at half scale), here Binomial(x, 1/2). The cells are not the
        product of the marginals, so X and Y are dependent.
      </figcaption>
    </figure>
  );
}
