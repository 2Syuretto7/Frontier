"use client";

import { useState } from "react";

type Map2 = { label: string; f: (x: number, y: number) => [number, number]; J: (x: number, y: number) => number[][]; a: [number, number] };
const MAPS: Map2[] = [
  { label: "polar: (r cos θ, r sin θ)", f: (r, t) => [r * Math.cos(t), r * Math.sin(t)], J: (r, t) => [[Math.cos(t), -r * Math.sin(t)], [Math.sin(t), r * Math.cos(t)]], a: [1.5, 0.6] },
  { label: "(x + y², y)", f: (x, y) => [x + y * y, y], J: (_, y) => [[1, 2 * y], [0, 1]], a: [0, 0.8] },
  { label: "(x², y)", f: (x, y) => [x * x, y], J: (x) => [[2 * x, 0], [0, 1]], a: [0.8, 0.5] },
];
const S = 280, C = S / 2, SC = 50;

/** A small square near a point and its image: the Jacobian's determinant is the factor by which area changes. */
export function JacobianAreaViz() {
  const [mi, setMi] = useState(0);
  const [u, setU] = useState(0.5);
  const m = MAPS[mi];
  const a: [number, number] = mi === 2 ? [-1 + 2 * u, 0.5] : mi === 1 ? [0, -1.2 + 2.4 * u] : [0.4 + 2 * u, 0.6];
  const r = 0.15;
  const sq: [number, number][] = [];
  for (let k = 0; k < 40; k++) {
    const s = -r + (2 * r * (k % 10)) / 10;
    const side = Math.floor(k / 10);
    sq.push(side === 0 ? [a[0] + s, a[1] - r] : side === 1 ? [a[0] + r, a[1] + s] : side === 2 ? [a[0] - s, a[1] + r] : [a[0] - r, a[1] - s]);
  }
  const img = sq.map(([x, y]) => m.f(x, y));
  let area = 0;
  img.forEach(([x1, y1], i) => { const [x2, y2] = img[(i + 1) % img.length]; area += x1 * y2 - x2 * y1; });
  area = Math.abs(area) / 2;
  const J = m.J(...a);
  const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  const P = ([x, y]: [number, number]) => `${(C + x * SC).toFixed(1)},${(C - y * SC).toFixed(1)}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {MAPS.map((M2, i) => (
          <button key={M2.label} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{M2.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto" }} role="img" aria-label="A small square and its image under the map">
        <line x1={0} y1={C} x2={S} y2={C} stroke="var(--border)" />
        <line x1={C} y1={0} x2={C} y2={S} stroke="var(--border)" />
        <polygon points={sq.map(P).join(" ")} fill="none" stroke="var(--text-faint)" strokeDasharray="3 3" />
        <polygon points={img.map(P).join(" ")} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">a = ({a[0].toFixed(2)}, {a[1].toFixed(2)})</span>
        <input type="range" min={0} max={1} step={0.01} value={u} onChange={(e) => setU(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        J = [[{J[0][0].toFixed(2)}, {J[0][1].toFixed(2)}], [{J[1][0].toFixed(2)}, {J[1][1].toFixed(2)}]], det J = {det.toFixed(3)}. Dashed: a
        square of area {(4 * r * r).toFixed(3)} around a. Shaded: its image, area {area.toFixed(3)}, ratio {(area / (4 * r * r)).toFixed(3)}.{" "}
        {Math.abs(det) < 0.05 ? "Where det J is 0 the map squashes area flat; here (x², y) folds the plane over." : "The ratio approaches |det J| as the square shrinks."}
      </figcaption>
    </figure>
  );
}
