"use client";

import { useState } from "react";

const PRESETS: { name: string; a: number; b: number; d: number }[] = [
  { name: "Merge sort", a: 2, b: 2, d: 1 },
  { name: "Schoolbook split", a: 4, b: 2, d: 1 },
  { name: "Karatsuba", a: 3, b: 2, d: 1 },
  { name: "Binary search", a: 1, b: 2, d: 0 },
];

/** Work per level of the recursion tree for T(n) = a T(n/b) + n^d: which levels dominate decides the total. */
export function RecursionTreeViz() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [d, setD] = useState(1);
  const L = b === 2 ? 10 : b === 3 ? 6 : 5;
  const n = b ** L;
  const levels = Array.from({ length: L + 1 }, (_, i) => a ** i * (n / b ** i) ** d);
  const max = Math.max(...levels);
  const total = levels.reduce((s, x) => s + x, 0);
  const crit = Math.log(a) / Math.log(b);
  const verdict =
    Math.abs(crit - d) < 1e-9
      ? `a = b^d: every level does the same work, so T(n) = Θ(n^${d} log n).`
      : crit < d
        ? `a < b^d: the top level dominates and the work shrinks going down, so T(n) = Θ(n^${d}).`
        : `a > b^d: the leaves dominate and the work grows going down, so T(n) = Θ(n^${crit.toFixed(3)}), since log_${b} ${a} = ${crit.toFixed(3)}.`;
  const W = 520, rowH = 20, H = (L + 1) * rowH + 30;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <button key={p.name} type="button" className="seg" aria-pressed={a === p.a && b === p.b && d === p.d} onClick={() => { setA(p.a); setB(p.b); setD(p.d); }}>{p.name}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Work per level for a = ${a}, b = ${b}, d = ${d}`}>
        <text x={4} y={14} className="plot-tick">level</text>
        <text x={W - 4} y={14} textAnchor="end" className="plot-tick">work at that level</text>
        {levels.map((w, i) => (
          <g key={i}>
            <text x={20} y={30 + i * rowH + 13} textAnchor="middle" className="plot-tick">{i}</text>
            <rect x={44} y={30 + i * rowH + 2} width={Math.max(1, (w / max) * (W - 150))} height={rowH - 5} rx={3} className="viz-cell is-on" />
            <text x={44 + Math.max(1, (w / max) * (W - 150)) + 6} y={30 + i * rowH + 13} className="plot-tick">{w >= 1e6 ? w.toExponential(1) : Math.round(w).toLocaleString("en-IN")}</text>
          </g>
        ))}
      </svg>
      <div className="viz-sliders">
        <label><span>Subproblems <span className="mono">a = {a}</span></span><input type="range" min={1} max={8} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label><span>Shrink factor <span className="mono">b = {b}</span></span><input type="range" min={2} max={4} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
        <label><span>Combine cost <span className="mono">n^{d}</span></span><input type="range" min={0} max={2} value={d} onChange={(e) => setD(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        n = {b}^{L} = {n.toLocaleString("en-IN")}. Level i has a^i subproblems of size n/b^i. Total work {Math.round(total).toLocaleString("en-IN")}. {verdict}
      </figcaption>
    </figure>
  );
}
