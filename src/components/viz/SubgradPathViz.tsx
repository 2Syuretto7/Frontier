"use client";

import { useState } from "react";

const K = 200;
const f = (x: number, y: number) => Math.abs(x) + 2 * Math.abs(y);
const RULES = [
  { label: "t = 0.1", t: () => 0.1 },
  { label: "t = 0.02", t: () => 0.02 },
  { label: "t = 0.3/√k", t: (k: number) => 0.3 / Math.sqrt(k) },
  { label: "Polyak", t: (_k: number, fx: number, g2: number) => fx / g2 },
];

/** The subgradient method on |x| + 2|y|: it is not a descent method, constant steps stall at a level set of size proportional to t, and diminishing steps converge slowly. */
export function SubgradPathViz() {
  const [r, setR] = useState(0);
  const pts: [number, number][] = [[1.6, 0.9]];
  let best = f(1.6, 0.9);
  for (let k = 1; k <= K; k++) {
    const [x, y] = pts[pts.length - 1];
    const g = [Math.sign(x), 2 * Math.sign(y)];
    const g2 = g[0] ** 2 + g[1] ** 2;
    if (g2 === 0) { pts.push([x, y]); continue; }
    const t = RULES[r].t(k, f(x, y), g2);
    const nx = x - t * g[0], ny = y - t * g[1];
    pts.push([nx, ny]);
    best = Math.min(best, f(nx, ny));
  }
  const last = pts[pts.length - 1];
  const W = 300, H = 220, R = 2;
  const yR = (R * H) / W;
  const X = (x: number) => W / 2 + (x / R) * (W / 2 - 6);
  const Y = (y: number) => H / 2 - (y / yR) * (H / 2 - 6);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {RULES.map((q, i) => (
          <button key={q.label} type="button" className="seg" aria-pressed={r === i} onClick={() => setR(i)}>{q.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Diamond-shaped level sets and the zigzag path of the subgradient method">
        {[0.25, 0.75, 1.5, 2.5].map((c) => (
          <polygon key={c} points={[[c, 0], [0, c / 2], [-c, 0], [0, -c / 2]].map(([a, b]) => `${X(a)},${Y(b)}`).join(" ")} fill="none" stroke="var(--border)" />
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.2} points={pts.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ")} />
        <circle cx={X(pts[0][0])} cy={Y(pts[0][1])} r={3.5} fill="var(--text)" />
        <circle cx={X(last[0])} cy={Y(last[1])} r={3} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        after {K} steps: best f = {best.toExponential(2)}; current f = {f(last[0], last[1]).toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The function |x| + 2|y| has diamond-shaped level sets and a kink along each axis, where any slope between the two
        sides is a subgradient. A step against a subgradient need not decrease f: the path keeps hopping across the axes.
        With a constant step the iterates end up bouncing in a band whose size is proportional to t. A step shrinking like
        1/√k converges, slowly. The Polyak step (f(x) − f*)/‖g‖² uses the optimal value 0, which is rarely known.
      </figcaption>
    </figure>
  );
}
