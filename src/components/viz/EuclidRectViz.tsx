"use client";

import { useState } from "react";

/** Euclid's algorithm as tiling: cut the largest squares from an a × b rectangle; the last square's side is gcd(a, b). */
export function EuclidRectViz() {
  const [a, setA] = useState(21);
  const [b, setB] = useState(15);
  const squares: { x: number; y: number; s: number; step: number }[] = [];
  const rows: string[] = [];
  let x = 0, y = 0, w = Math.max(a, b), h = Math.min(a, b), step = 0;
  while (w > 0 && h > 0) {
    const big = Math.max(w, h), small = Math.min(w, h), q = Math.floor(big / small), r = big % small;
    rows.push(`${big} = ${q} × ${small} + ${r}`);
    for (let i = 0; i < q; i++) {
      if (w >= h) { squares.push({ x, y, s: h, step }); x += h; w -= h; }
      else { squares.push({ x, y, s: w, step }); y += w; h -= w; }
    }
    step++;
  }
  const g = squares[squares.length - 1].s;
  const W = 520, scale = Math.min(W / Math.max(a, b), 220 / Math.min(a, b));
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${Math.max(a, b) * scale + 4} ${Math.min(a, b) * scale + 4}`} style={{ maxHeight: 240, display: "block", margin: "0 auto" }} role="img" aria-label={`Tiling a ${a} by ${b} rectangle with squares`}>
        {squares.map((q, k) => (
          <rect key={k} x={2 + q.x * scale} y={2 + q.y * scale} width={q.s * scale} height={q.s * scale} className={q.s === g ? "viz-cell is-on" : "viz-cell"} style={{ fillOpacity: 0.15 + 0.12 * (q.step % 5) }} />
        ))}
      </svg>
      <div className="viz-sliders">
        <label><span>a = <span className="mono">{a}</span></span><input type="range" min={1} max={60} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label><span>b = <span className="mono">{b}</span></span><input type="range" min={1} max={60} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{rows.join(";  ")}</span>. Each step replaces (big, small) by (small, remainder), which has the same common divisors.
        The smallest squares, shaded, have side <span className="mono">gcd({a}, {b}) = {g}</span>: they tile every earlier square, and so the whole rectangle.
      </figcaption>
    </figure>
  );
}
