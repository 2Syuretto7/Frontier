"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MAXL = 9;
const r0 = rand(1911);
const normal = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
// one standard normal for B(1), then 2^(k-1) more at refinement level k
const Z = [
  [normal()],
  ...Array.from({ length: MAXL }, (_, k) =>
    Array.from({ length: 2 ** k }, normal),
  ),
];

/** Lévy's construction: the path on the grid of spacing 2^-level, each midpoint the average of its neighbours plus N(0, dt/4). */
export function levyPath(level: number) {
  let path = [0, Z[0][0]],
    dt = 1;
  for (let k = 1; k <= level; k++) {
    const next: number[] = [];
    for (let i = 0; i < path.length - 1; i++)
      next.push(
        path[i],
        (path[i] + path[i + 1]) / 2 + (Math.sqrt(dt) / 2) * Z[k][i],
      );
    next.push(path[path.length - 1]);
    path = next;
    dt /= 2;
  }
  return path;
}

export const sumSq = (p: number[]) =>
  p.slice(1).reduce((a, v, i) => a + (v - p[i]) ** 2, 0);

const LEVELS = [1, 2, 3, 5, 9];

export function BrownianRefineViz() {
  const [li, setLi] = useState(2);
  const level = LEVELS[li];
  const path = levyPath(level);
  const prev = li > 0 ? levyPath(LEVELS[li - 1]) : [0, Z[0][0]];
  const fine = levyPath(MAXL);
  const lo = Math.min(...fine, 0) - 0.1,
    hi = Math.max(...fine, 0) + 0.1;
  const W = 340,
    H = 190,
    X0 = 30,
    X1 = W - 8,
    Y0 = 8,
    Y1 = H - 22;
  const sx = (t: number) => X0 + t * (X1 - X0);
  const sy = (v: number) => Y1 - ((v - lo) / (hi - lo)) * (Y1 - Y0);
  const line = (p: number[]) =>
    p
      .map((v, i) => `${i ? "L" : "M"}${sx(i / (p.length - 1))},${sy(v)}`)
      .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Refinement level">
          {LEVELS.map((l, j) => (
            <button
              key={l}
              type="button"
              className="seg"
              aria-pressed={li === j}
              onClick={() => setLi(j)}
            >
              level {l}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A Brownian path built by repeatedly adding random midpoints"
      >
        <line x1={X0} y1={sy(0)} x2={X1} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--border-strong)" />
        <path
          d={line(prev)}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <path
          d={line(path)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.6}
        />
        {path.length <= 33
          ? path.map((v, i) => (
              <circle
                key={i}
                cx={sx(i / (path.length - 1))}
                cy={sy(v)}
                r={2.2}
                style={{ fill: "var(--accent)" }}
              />
            ))
          : null}
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - 6}
            textAnchor={t === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">
          0
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {path.length} points; sum of squared increments {sumSq(path).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The construction fixes B(0) = 0 and draws B(1). Each level halves the
        grid: every new midpoint is the average of its two neighbours plus
        independent Gaussian noise with variance a quarter of the old spacing.
        The dashed line is the path at the previous level listed. Earlier points never move,
        the corrections shrink, and the paths converge uniformly to a continuous
        limit that is nowhere smooth. The sum of squared increments settles near
        the elapsed time, 1, a fact the next lesson proves.
      </figcaption>
    </figure>
  );
}
