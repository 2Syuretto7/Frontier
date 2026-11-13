"use client";

import { useState } from "react";

// f(x, y) = (x² − y, xy) near a = (1, 2), with Jacobian [[2, −1], [2, 1]].
const f = (x: number, y: number): [number, number] => [x * x - y, x * y];
const A: [number, number] = [1, 2];
const FA = f(...A);
const L = (h: number, k: number): [number, number] => [FA[0] + 2 * h - k, FA[1] + 2 * h + k];
const S = 280, C = S / 2;

/** A small grid around a, its image under f, and its image under the linear approximation. Zoom in and they merge. */
export function LocalLinearViz() {
  const [lr, setLr] = useState(0);
  const r = 10 ** lr;
  const n = 6;
  const lines: { pts: [number, number][]; lin: [number, number][] }[] = [];
  for (let k = 0; k <= n; k++) {
    const s = -r + (2 * r * k) / n;
    const along = (fn: (u: number) => [number, number]) => Array.from({ length: 21 }, (_, m) => fn(-r + (2 * r * m) / 20));
    lines.push({ pts: along((u) => f(A[0] + u, A[1] + s)), lin: along((u) => L(u, s)) });
    lines.push({ pts: along((u) => f(A[0] + s, A[1] + u)), lin: along((u) => L(s, u)) });
  }
  const scale = (S * 0.33) / (3 * r);
  const P = ([x, y]: [number, number]) => `${(C + (x - FA[0]) * scale).toFixed(1)},${(C - (y - FA[1]) * scale).toFixed(1)}`;
  let worst = 0;
  for (const l of lines) l.pts.forEach((p, i) => (worst = Math.max(worst, Math.hypot(p[0] - l.lin[i][0], p[1] - l.lin[i][1]))));
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Image of a small grid under f and under its linear approximation">
        {lines.map((l, i) => <polyline key={`l${i}`} points={l.lin.map(P).join(" ")} fill="none" stroke="var(--text-faint)" strokeWidth={1.2} strokeDasharray="4 3" />)}
        {lines.map((l, i) => <polyline key={`f${i}`} points={l.pts.map(P).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.6} />)}
        <circle cx={C} cy={C} r={3.5} fill="var(--danger)" />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">grid radius {r < 0.01 ? r.toExponential(0) : r.toFixed(2)}</span>
        <input type="range" min={-3} max={0} step={0.25} value={lr} onChange={(e) => setLr(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        Solid: the image under f(x, y) = (x² − y, xy) of a square grid of radius r around (1, 2). Dashed: its image under the
        linear approximation f(a) + J h. Both are rescaled to the same size. The largest gap is {worst.toExponential(1)}, which
        is {(worst / r).toExponential(1)} times r: it shrinks faster than r, which is what being differentiable means.
      </figcaption>
    </figure>
  );
}
