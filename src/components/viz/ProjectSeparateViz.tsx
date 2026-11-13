"use client";

import { useState } from "react";

type V = [number, number];
const POLY: V[] = [[-0.9, -0.5], [0.3, -0.8], [0.9, -0.1], [0.6, 0.7], [-0.3, 0.8], [-1.0, 0.2]];

function projSeg(x: V, a: V, b: V): V {
  const d: V = [b[0] - a[0], b[1] - a[1]];
  const t = Math.max(0, Math.min(1, ((x[0] - a[0]) * d[0] + (x[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1])));
  return [a[0] + t * d[0], a[1] + t * d[1]];
}

function project(x: V): V {
  const inside = POLY.every((a, i) => {
    const b = POLY[(i + 1) % POLY.length];
    return (b[0] - a[0]) * (x[1] - a[1]) - (b[1] - a[1]) * (x[0] - a[0]) >= 0;
  });
  if (inside) return x;
  let best: V = POLY[0], bd = Infinity;
  POLY.forEach((a, i) => {
    const p = projSeg(x, a, POLY[(i + 1) % POLY.length]);
    const d = Math.hypot(p[0] - x[0], p[1] - x[1]);
    if (d < bd) { bd = d; best = p; }
  });
  return best;
}

/** Projecting a point onto a convex polygon, and the separating and supporting hyperplanes that the projection gives. */
export function ProjectSeparateViz() {
  const [px, setPx] = useState(1.4);
  const [py, setPy] = useState(0.9);
  const x: V = [px, py];
  const p = project(x);
  const a: V = [x[0] - p[0], x[1] - p[1]];
  const dist = Math.hypot(a[0], a[1]);
  const W = 260, H = 240;
  const X = (v: number) => 130 + v * 70;
  const Y = (v: number) => 120 - v * 70;
  const line = (c: V, dash: string | undefined, col: string) => {
    const t: V = [-a[1] / dist, a[0] / dist];
    return <line x1={X(c[0] - 3 * t[0])} y1={Y(c[1] - 3 * t[1])} x2={X(c[0] + 3 * t[0])} y2={Y(c[1] + 3 * t[1])} stroke={col} strokeWidth={1.6} strokeDasharray={dash} />;
  };
  const mid: V = [(x[0] + p[0]) / 2, (x[1] + p[1]) / 2];
  // a check of the projection inequality <x - p, z - p> <= 0 at every vertex
  const worst = Math.max(...POLY.map((z) => a[0] * (z[0] - p[0]) + a[1] * (z[1] - p[1])));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x₁ = {px.toFixed(1)}
          <input type="range" min={-1.7} max={1.7} step={0.1} value={px} onChange={(e) => setPx(Number(e.target.value))} aria-label="first coordinate of the point" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x₂ = {py.toFixed(1)}
          <input type="range" min={-1.5} max={1.5} step={0.1} value={py} onChange={(e) => setPy(Number(e.target.value))} aria-label="second coordinate of the point" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Convex polygon, a point, its projection and the separating line">
        <defs>
          <clipPath id="ps-clip"><rect width={W} height={H} /></clipPath>
        </defs>
        <polygon points={POLY.map(([u, v]) => `${X(u)},${Y(v)}`).join(" ")} fill="var(--accent)" opacity={0.25} stroke="var(--accent)" />
        <g clipPath="url(#ps-clip)">
          {dist > 1e-9 && line(mid, undefined, "var(--danger)")}
          {dist > 1e-9 && line(p, "4 3", "var(--text-muted)")}
        </g>
        {dist > 1e-9 && <line x1={X(x[0])} y1={Y(x[1])} x2={X(p[0])} y2={Y(p[1])} stroke="var(--text)" strokeDasharray="2 2" />}
        <circle cx={X(p[0])} cy={Y(p[1])} r={3.5} fill="var(--text)" />
        <circle cx={X(x[0])} cy={Y(x[1])} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {dist > 1e-9 ? `distance ${dist.toFixed(3)}; max over vertices z of ⟨x − p, z − p⟩ = ${(worst + 0).toFixed(3)} ≤ 0` : "x is in the set, so it is its own projection and nothing separates it"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Move the red point x. Its projection p (black) is the nearest point of the convex polygon. The vector x − p makes an
        angle of at least 90° with every direction into the set, so the inner product shown is never positive. Hence the
        line through the midpoint perpendicular to x − p (solid red) strictly separates x from the set, and the parallel
        line through p (dashed) supports the set: it touches it and has the whole set on one side.
      </figcaption>
    </figure>
  );
}
