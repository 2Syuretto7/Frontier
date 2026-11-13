"use client";

import { useState, type ReactElement } from "react";

const FUNCS: { label: string; f: (x: number, y: number) => number; levels: number[] }[] = [
  { label: "x² + y²", f: (x, y) => x * x + y * y, levels: [0.25, 1, 2, 3, 4] },
  { label: "x² + 4y²", f: (x, y) => x * x + 4 * y * y, levels: [0.25, 1, 2, 3, 4] },
  { label: "x² − y²", f: (x, y) => x * x - y * y, levels: [-2, -1, 0, 1, 2] },
  { label: "(1 − x)² + 5(y − x²)²", f: (x, y) => (1 - x) ** 2 + 5 * (y - x * x) ** 2, levels: [0.1, 0.5, 1, 2, 4] },
];
const N = 60, S = 300, LO = -2, HI = 2;
const g = (i: number) => LO + ((HI - LO) * i) / N;
const px = (x: number) => ((x - LO) / (HI - LO)) * S;
const py = (y: number) => S - ((y - LO) / (HI - LO)) * S;

function contour(f: (x: number, y: number) => number, c: number) {
  const segs: string[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const xs = [g(i), g(i + 1), g(i + 1), g(i)], ys = [g(j), g(j), g(j + 1), g(j + 1)];
    const v = xs.map((x, k) => f(x, ys[k]) - c);
    const pts: [number, number][] = [];
    for (let k = 0; k < 4; k++) {
      const a = v[k], b = v[(k + 1) % 4];
      if ((a < 0) !== (b < 0)) {
        const t = a / (a - b);
        pts.push([xs[k] + t * (xs[(k + 1) % 4] - xs[k]), ys[k] + t * (ys[(k + 1) % 4] - ys[k])]);
      }
    }
    for (let k = 0; k + 1 < pts.length; k += 2)
      segs.push(`M${px(pts[k][0]).toFixed(1)},${py(pts[k][1]).toFixed(1)}L${px(pts[k + 1][0]).toFixed(1)},${py(pts[k + 1][1]).toFixed(1)}`);
  }
  return segs.join("");
}

/** Contour lines of a function of two variables, and the set where it is at most c. */
export function ContourViz() {
  const [fi, setFi] = useState(1);
  const [ci, setCi] = useState(2);
  const { f, levels, label } = FUNCS[fi];
  const c = levels[ci];
  const cells: ReactElement[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (f(g(i + 0.5), g(j + 0.5)) <= c) cells.push(<rect key={`${i}-${j}`} x={px(g(i))} y={py(g(j + 1))} width={S / N + 0.3} height={S / N + 0.3} fill="var(--accent-soft)" />);
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {FUNCS.map((F, i) => (
          <button key={F.label} type="button" className="seg" aria-pressed={fi === i} onClick={() => { setFi(i); setCi(2); }}>f = {F.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "8px auto" }} role="img" aria-label={`Contours of ${label}`}>
        {cells}
        <line x1={0} y1={py(0)} x2={S} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} y1={0} x2={px(0)} y2={S} stroke="var(--border)" />
        {levels.map((L, k) => (
          <path key={L} d={contour(f, L)} stroke={k === ci ? "var(--accent)" : "var(--text-faint)"} strokeWidth={k === ci ? 2.2 : 1} fill="none" />
        ))}
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">c = {c}</span>
        <input type="range" min={0} max={levels.length - 1} step={1} value={ci} onChange={(e) => setCi(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        Lines are level sets f(x, y) = constant, drawn on the square [−2, 2]²; the shaded region is where f ≤ {c}.{" "}
        {fi === 2
          ? "For the saddle the level sets are hyperbolas, and the level set at 0 is a pair of crossing lines."
          : fi === 3
            ? "A curved valley: the minimum at (1, 1) sits at the bottom of a narrow banana-shaped trough, which gradient descent finds hard."
            : "Closer lines mean the function changes faster in that direction."}
      </figcaption>
    </figure>
  );
}
