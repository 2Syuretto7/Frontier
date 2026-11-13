"use client";

import { useState, type ReactElement } from "react";

const CASES = [
  { label: "f = x² + y² on the square", f: (x: number, y: number) => x * x + y * y, inside: () => true, exact: 2 / 3, max: 2 },
  { label: "f = 1 on the quarter disc", f: () => 1, inside: (x: number, y: number) => x * x + y * y <= 1, exact: Math.PI / 4, max: 1 },
];
const S = 260;

/** Midpoint Riemann sums over [0, 1]²: each cell contributes f(centre) × area. */
export function Riemann2DViz() {
  const [ci, setCi] = useState(0);
  const [n, setN] = useState(6);
  const K = CASES[ci];
  const h = 1 / n;
  let sum = 0;
  const cells: ReactElement[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = (i + 0.5) * h, y = (j + 0.5) * h;
    const v = K.inside(x, y) ? K.f(x, y) : 0;
    sum += v * h * h;
    cells.push(
      <rect key={`${i}-${j}`} x={i * h * S} y={S - (j + 1) * h * S} width={h * S} height={h * S} fill="var(--accent)" opacity={0.08 + 0.8 * (v / K.max)} stroke="var(--bg)" strokeWidth={n > 30 ? 0 : 1} />,
    );
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {CASES.map((c, i) => (
          <button key={c.label} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "8px auto" }} role="img" aria-label="Grid of cells shaded by the function value">
        {cells}
        {ci === 1 && <path d={`M0,0 A${S},${S} 0 0 1 ${S},${S}`} fill="none" stroke="var(--danger)" strokeWidth={2} />}
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono" style={{ minWidth: 80 }}>{n} × {n}</span>
        <input type="range" min={1} max={60} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center" }}>
        sum = {sum.toFixed(5)}, exact = {K.exact.toFixed(5)}, error = {Math.abs(sum - K.exact).toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Darker cells have larger f at their centre. The sum of f(centre) × cell area approaches the integral as the grid is
        refined.{" "}
        {ci === 0
          ? "For a smooth integrand on a rectangle the midpoint error falls like 1/n²."
          : "For a curved region, the integrand is f times the region's indicator, which jumps at the boundary; cells cut by the circle cause an error that falls only like 1/n, more slowly."}
      </figcaption>
    </figure>
  );
}
